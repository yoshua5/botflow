import { NextResponse } from "next/server";
import { getUserIdByPhone, getBotIdByPhone, getPhoneMappingHmac, getConfig, getBots, getAllKBText, getKBImages, getKBImageData, trackMessage, getConversation, setConversation } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";
function supabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); }
import { verifyMetaSignature, verifyOwnershipHmac } from "@/lib/webhookAuth";

// Lazy imports — loaded only when POST handler actually needs them.
// This ensures the GET (webhook verification) handler works even if
// Google/booking modules fail to initialize (e.g. missing credentials).
async function getAvailableSlots(...args) {
  const { getAvailableSlots: fn } = await import("@/lib/google");
  return fn(...args);
}
async function bookAppointment(...args) {
  const { bookAppointment: fn } = await import("@/lib/bookAppointment");
  return fn(...args);
}

// ── GET: WhatsApp webhook verification ───────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Accept either WA_VERIFY_TOKEN or WEBHOOK_SECRET as the verify token
  const verifyToken = process.env.WA_VERIFY_TOKEN || process.env.WEBHOOK_SECRET;
  if (!verifyToken) {
    console.error("❌ No verify token set. Add WA_VERIFY_TOKEN to env vars.");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const headers = { "Content-Type": "text/plain" };
  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verificado");
    return new Response(challenge, { status: 200, headers });
  }
  console.warn(`⚠️ Webhook verification failed. mode=${mode}, expected=${verifyToken}, got=${token}`);
  return new Response("Token incorrecto", { status: 403, headers });
}

// ── POST: Receive & reply to WhatsApp messages ────────────────
export async function POST(request) {
  // Read raw body first (needed for Meta signature verification)
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  // ── 1. Verify Meta signature ─────────────────────────────
  if (!verifyMetaSignature(rawBody, signatureHeader)) {
    console.error("❌ Meta signature verification failed — rejecting request");
    return new Response("Unauthorized", { status: 403 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Accept text, audio, and interactive (button/list clicks)
    const isText        = message?.type === "text";
    const isAudio       = message?.type === "audio";
    const isInteractive = message?.type === "interactive";
    if (!message || (!isText && !isAudio && !isInteractive)) return NextResponse.json({ status: "ok" });

    const metadata = body.entry?.[0]?.changes?.[0]?.value?.metadata;
    const phoneId = metadata?.phone_number_id;
    if (!phoneId) return NextResponse.json({ status: "ok" });

    let userId = await getUserIdByPhone(phoneId);
    let skipOwnershipCheck = false;

    if (!userId) {
      // Fall back to env-var config when phone matches the default number
      if (process.env.WA_PHONE_NUMBER_ID && phoneId === process.env.WA_PHONE_NUMBER_ID) {
        userId = "default";
        skipOwnershipCheck = true; // env-var default doesn't have a DB row to check
        console.log("ℹ️ Using env-var config for phoneId:", phoneId);
      } else {
        console.error("❌ No user mapped for phoneId:", phoneId);
        return NextResponse.json({ status: "ok" });
      }
    }

    // ── 2. Verify webhook ownership ──────────────────────────
    if (!skipOwnershipCheck) {
      const storedHmac = await getPhoneMappingHmac(phoneId);
      if (!verifyOwnershipHmac(phoneId, userId, storedHmac)) {
        console.error(`❌ Ownership HMAC mismatch for phoneId=${phoneId} userId=${userId} — possible hijack attempt`);
        return NextResponse.json({ status: "ok" });
      }
    }

    const from      = message.from;
    const contactName = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || null;
    const baseConfig = await getConfig(userId);

    // ── Find the specific bot for this phone number ────────
    const bots  = await getBots(userId);
    const botId = await getBotIdByPhone(phoneId);
    const activeBot = (botId ? bots.find(b => b.id === botId) : null)
      || bots.find(b => b.phoneNumberId === phoneId)
      || bots.find(b => b.status !== "INACTIVO")
      || bots[0];

    if (activeBot && activeBot.status === "INACTIVO") {
      console.log(`⏸️ Bot inactivo, ignorando mensaje de ${from}`);
      return NextResponse.json({ status: "ok" });
    }

    const GENERIC_DEFAULTS = ["Asistente", "Assistant", "Mi Bot", "My Bot", "Bot", ""];
    const config = { ...activeBot };
    for (const [k, v] of Object.entries(baseConfig)) {
      if (v !== undefined && v !== null) config[k] = v;
    }
    if (GENERIC_DEFAULTS.includes(config.agentName || "")) {
      config.agentName = activeBot?.agentName || activeBot?.name || config.agentName;
    }
    if (!config.flow && activeBot?.flow) config.flow = activeBot.flow;
    if (activeBot) console.log(`🤖 Bot: ${config.agentName} / ${config.businessName} (id: ${activeBot.id})`);

    if (!config.accessToken || !config.phoneNumberId || !config.anthropicKey) {
      console.error("❌ Faltan credenciales");
      return NextResponse.json({ status: "error: missing config" });
    }

    // ── Resolve user message text ──────────────────────────
    let text;
    let transcribedNote = "";

    if (isAudio) {
      const mediaId = message.audio?.id;
      console.log(`🎤 Nota de voz recibida, media_id: ${mediaId}`);
      const openaiKey = config.openaiKey;
      if (!openaiKey) {
        await sendWhatsAppText(from, "Lo siento, la función de notas de voz no está configurada aún. Por favor escríbeme tu mensaje. 🙏", config);
        return NextResponse.json({ status: "ok" });
      }
      text = await transcribeWhatsAppAudio(mediaId, config, openaiKey);
      if (!text) {
        await sendWhatsAppText(from, "No pude entender el audio. ¿Puedes escribirme tu mensaje? 😊", config);
        return NextResponse.json({ status: "ok" });
      }
      console.log(`🎤 Transcripción: "${text}"`);
      transcribedNote = `🎤 _"${text}"_\n\n`;
    } else if (isInteractive) {
      const btnReply  = message.interactive?.button_reply;
      const listReply = message.interactive?.list_reply;
      const selected  = btnReply || listReply;
      text = selected?.title || selected?.id || "opción seleccionada";
      console.log(`🔘 Opción seleccionada: "${text}" (id: ${selected?.id})`);

      const flow = config.flow || activeBot?.flow;
      if (flow?.menuItems) {
        const matched = flow.menuItems.find(it => it.id === selected?.id || it.title === text);
        if (matched?.response) {
          text = `[El usuario seleccionó: "${text}"] ${matched.response}`;
        }
      }
    } else {
      text = message.text.body;
    }

    // ── Appointment flow ───────────────────────────────────────────────
    let _apptHandled = false;
    try {
      _apptHandled = await handleAppointmentFlow(text, from, userId, activeBot?.id || null, contactName || null, config);
    } catch (apptErr) {
      console.error("⚠️ Appointment flow error (continuing):", apptErr.message);
    }
    if (_apptHandled) return NextResponse.json({ status: "ok" });
    // ───────────────────────────────────────────────────────────────────

    const knowledge      = await getAllKBText(userId);
    const kbImages       = await getKBImages(userId);
    const history        = await getConversation(from, userId);
    const availableSlots = config.appointments?.enabled && config.appointments?.calendarId && config.appointments?.googleCredentials
      ? await getAvailableSlots(config.appointments).catch(() => null)
      : null;

    if (knowledge) console.log(`📚 KB: ${knowledge.length} chars`);
    if (kbImages.length) console.log(`🖼️ Imágenes en KB: ${kbImages.length}`);
    if (availableSlots) console.log(`📅 Slots disponibles en prompt`);

    const aiReply = await callClaude(text, config, knowledge, kbImages, history, availableSlots);

    const updatedHistory = [
      ...history,
      { role: "user", content: text },
      { role: "assistant", content: aiReply },
    ];
    setConversation(from, updatedHistory, userId).catch(() => {});

    // Parse [BOOK_APPOINTMENT:{...}] marker
    let cleanReply = aiReply;
    const bookStart = aiReply.indexOf("[BOOK_APPOINTMENT:");
    if (bookStart !== -1) {
      try {
        const rest = aiReply.slice(bookStart + "[BOOK_APPOINTMENT:".length);
        let braceDepth = 0, jsonEnd = -1;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === "{") braceDepth++;
          else if (rest[i] === "}") { braceDepth--; if (braceDepth === 0) { jsonEnd = i; break; } }
        }
        if (jsonEnd !== -1) {
          const jsonStr = rest.slice(0, jsonEnd + 1);
          const appointmentData = JSON.parse(jsonStr);
          console.log("📅 Booking appointment:", JSON.stringify(appointmentData));
          const waConfig = { accessToken: config.accessToken, phoneNumberId: config.phoneNumberId };
          bookAppointment(appointmentData, from, config.appointments || {}, waConfig)
            .then(r => console.log(`📅 Booking result: cal=${r.results.calendar} sheets=${r.results.sheets} wa=${r.results.whatsapp}`))
            .catch(err => console.error("❌ Appointment booking error:", err.message));
          cleanReply = aiReply.slice(0, bookStart) + aiReply.slice(bookStart + "[BOOK_APPOINTMENT:".length + jsonEnd + 2);
        }
      } catch (err) {
        console.error("Failed to parse [BOOK_APPOINTMENT]:", err.message);
      }
    }

    // Parse [SEND_BOOKING_LINK] marker
    const hasBookingLink = cleanReply.includes("[SEND_BOOKING_LINK]");
    cleanReply = cleanReply.replace(/\[SEND_BOOKING_LINK\]/gi, "").trim();

    // Parse [SEND_IMAGE:id] markers
    const imageMarkerRegex = /\[SEND_IMAGE:([^\]]+)\]/gi;
    const imageMarkers = [...cleanReply.matchAll(imageMarkerRegex)];
    const cleanText = cleanReply.replace(imageMarkerRegex, "").trim();

    const finalText = transcribedNote + cleanText;
    if (finalText) await sendWhatsAppText(from, finalText, config);

    // ── Send interactive menu if flow mode requires it ─────
    const flow = config.flow || activeBot?.flow || baseConfig.flow;
    const flowMode = flow?.mode || "text";
    const isFirstMsg = history.length === 0;
    const shouldShowMenu = !!(
      flow?.menuItems?.length > 0 &&
      (flowMode === "menu" || (flowMode === "hybrid" && isFirstMsg)) &&
      !isInteractive
    );
    console.log(`🔀 flow mode: ${flowMode}, shouldShowMenu: ${shouldShowMenu}, items: ${flow?.menuItems?.length || 0}`);

    if (shouldShowMenu) {
      await sendWhatsAppMenu(from, flow, config);
    }

    // Send booking link if requested
    if (hasBookingLink && config.appointments?.enabled) {
      const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.NEXTAUTH_URL || "https://botflow-eight.vercel.app";
      const bookingUrl = `${baseUrl}/booking?from=${encodeURIComponent(from)}`;
      await sendWhatsAppText(from, `📅 Elige tu fecha y hora aquí:\n${bookingUrl}`, config);
    }

    // Send each image from Claude markers
    for (const match of imageMarkers) {
      const hint = match[1].toLowerCase().trim();
      const img = kbImages.find(i =>
        i.id === match[1].trim() ||
        i.id.toLowerCase().includes(hint) ||
        i.name.toLowerCase().includes(hint) ||
        hint.includes(i.name.toLowerCase().replace(/\.[^.]+$/, ""))
      );
      if (img) {
        console.log(`🖼️ Enviando imagen: ${img.name}`);
        await sendWhatsAppImage(from, img.id, img.name, config, userId);
      } else {
        console.warn(`⚠️ Imagen no encontrada para hint: ${hint}`);
      }
    }

    // Fallback: if user asked for images but Claude didn't generate markers, send automatically
    if (imageMarkers.length === 0 && kbImages.length > 0) {
      const photoRequest = /\b(foto|fotos|imagen|imágenes|picture|photo|photos|muéstrame|mándame|envíame|ver|muestra|catálogo).*(foto|imagen|picture|photo)\b|\b(foto|fotos|imagen|imágenes|picture|photos)\b/i;
      if (photoRequest.test(text)) {
        console.log("⚠️ Fallback: usuario pidió fotos pero Claude no generó markers — enviando automáticamente");
        for (const img of kbImages.slice(0, 3)) {
          console.log(`🖼️ Fallback img: ${img.name}`);
          await sendWhatsAppImage(from, img.id, img.name, config, userId);
        }
      }
    }

    const botName = config.agentName || config.businessName || "Bot";
    const trackText = isAudio ? `🎤 ${text}` : text;
    trackMessage(from, trackText, botName, userId).catch(() => {});
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}


// ── Appointment flow handler ─────────────────────────────────────────────────
const APPT_INTENT = /\b(cita|citas|agendar|agenda|reservar|reserva|turno|quiero una cita|quiero un turno|quiero agendar|necesito una cita|necesito un turno|quiero una reserva|appointment|booking)\b/i;

// ── Availability helpers ────────────────────────────────────────────────
function getAvailableDates(availCfg, numDays = 14) {
  const allowedDays = availCfg?.available_days || [1,2,3,4,5];
  const dates = [];
  const DAY_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const MONTH_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const now = new Date();
  // Start from tomorrow
  for (let i = 1; i <= 30 && dates.length < numDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (allowedDays.includes(d.getDay())) {
      dates.push({
        label: `${DAY_ES[d.getDay()]} ${d.getDate()} de ${MONTH_ES[d.getMonth()]}`,
        iso:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
      });
    }
  }
  return dates;
}

function getApptTimeSlots(availCfg) {
  const start = availCfg?.start_time || "09:00";
  const end   = availCfg?.end_time   || "18:00";
  const mins  = availCfg?.slot_minutes || 60;
  const [sh,sm] = start.split(":").map(Number);
  const [eh,em] = end.split(":").map(Number);
  const startM = sh*60+sm, endM = eh*60+em;
  const slots = [];
  for (let m = startM; m < endM; m += mins) {
    const h = Math.floor(m/60), mi = m%60;
    const suffix = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h-12 : h;
    slots.push(`${h12}:${String(mi).padStart(2,"0")} ${suffix}`);
  }
  return slots;
}

function isDateField(key) { return /fecha|date|dia|día/i.test(key); }
function isTimeField(key) { return /hora|time|horario/i.test(key); }

function buildFieldQuestion(field, availCfg) {
  const key = field.field_key || "";
  if (isDateField(key)) {
    const dates = getAvailableDates(availCfg);
    if (dates.length === 0) return field.question;
    const list = dates.slice(0,10).map((d,i) => `  ${i+1}. ${d.label}`).join("\n");
    return `${field.question}\n\n📅 *Fechas disponibles:*\n${list}\n\nResponde con el número o escribe la fecha.`;
  }
  if (isTimeField(key)) {
    const slots = getApptTimeSlots(availCfg);
    if (slots.length === 0) return field.question;
    const list = slots.map((s,i) => `  ${i+1}. ${s}`).join("\n");
    return `${field.question}\n\n🕐 *Horarios disponibles:*\n${list}\n\nResponde con el número o escribe la hora.`;
  }
  return field.question;
}

function resolveAnswer(text, field, availCfg) {
  const key = field.field_key || "";
  const num = parseInt(text.trim(), 10);
  if (!isNaN(num) && num >= 1) {
    if (isDateField(key)) {
      const dates = getAvailableDates(availCfg);
      if (dates[num-1]) return dates[num-1].label;
    }
    if (isTimeField(key)) {
      const slots = getApptTimeSlots(availCfg);
      if (slots[num-1]) return slots[num-1];
    }
  }
  return text.trim();
}

async function handleAppointmentFlow(text, from, userId, botId, contactName, config) {
  const db = supabase();

  // Default fields used when none are saved in DB yet
  const DEFAULT_FIELDS = [
    { field_key: "nombre",         question: "¿Cuál es tu nombre completo?",         required: true,  field_order: 0 },
    { field_key: "telefono",       question: "¿Cuál es tu número de teléfono?",       required: true,  field_order: 1 },
    { field_key: "fecha_deseada",  question: "¿Qué fecha te gustaría para la cita?",  required: true,  field_order: 2 },
    { field_key: "hora_deseada",   question: "¿A qué hora te gustaría la cita?",      required: true,  field_order: 3 },
    { field_key: "motivo",         question: "¿Cuál es el motivo de la cita?",        required: false, field_order: 4 },
  ];

  // Read appointment session from dedicated table — no bot_id/NULL ambiguity
  const { data: _apptSession } = await db
    .from("appointment_sessions")
    .select("state")
    .eq("user_id", userId)
    .eq("from_phone", from)
    .maybeSingle();
  const state = _apptSession?.state || null;
  console.log(`📋 appt [${from}] idx=${state?.currentIdx ?? "none"} data=${JSON.stringify(Object.keys(state?.data || {}))}`); getUserIdByPhone, getBotIdByPhone, getPhoneMappingHmac, getConfig, getBots, getAllKBText, getKBImages, getKBImageData, trackMessage, getConversation, setConversation } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";
function supabase() { return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); }
import { verifyMetaSignature, verifyOwnershipHmac } from "@/lib/webhookAuth";

// Lazy imports — loaded only when POST handler actually needs them.
// This ensures the GET (webhook verification) handler works even if
// Google/booking modules fail to initialize (e.g. missing credentials).
async function getAvailableSlots(...args) {
  const { getAvailableSlots: fn } = await import("@/lib/google");
  return fn(...args);
}
async function bookAppointment(...args) {
  const { bookAppointment: fn } = await import("@/lib/bookAppointment");
  return fn(...args);
}

// ── GET: WhatsApp webhook verification ───────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Accept either WA_VERIFY_TOKEN or WEBHOOK_SECRET as the verify token
  const verifyToken = process.env.WA_VERIFY_TOKEN || process.env.WEBHOOK_SECRET;
  if (!verifyToken) {
    console.error("❌ No verify token set. Add WA_VERIFY_TOKEN to env vars.");
    return new Response("Server misconfiguration", { status: 500 });
  }

  const headers = { "Content-Type": "text/plain" };
  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ Webhook verificado");
    return new Response(challenge, { status: 200, headers });
  }
  console.warn(`⚠️ Webhook verification failed. mode=${mode}, expected=${verifyToken}, got=${token}`);
  return new Response("Token incorrecto", { status: 403, headers });
}

// ── POST: Receive & reply to WhatsApp messages ────────────────
export async function POST(request) {
  // Read raw body first (needed for Meta signature verification)
  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-hub-signature-256");

  // ── 1. Verify Meta signature ─────────────────────────────
  if (!verifyMetaSignature(rawBody, signatureHeader)) {
    console.error("❌ Meta signature verification failed — rejecting request");
    return new Response("Unauthorized", { status: 403 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Accept text, audio, and interactive (button/list clicks)
    const isText        = message?.type === "text";
    const isAudio       = message?.type === "audio";
    const isInteractive = message?.type === "interactive";
    if (!message || (!isText && !isAudio && !isInteractive)) return NextResponse.json({ status: "ok" });

    const metadata = body.entry?.[0]?.changes?.[0]?.value?.metadata;
    const phoneId = metadata?.phone_number_id;
    if (!phoneId) return NextResponse.json({ status: "ok" });

    let userId = await getUserIdByPhone(phoneId);
    let skipOwnershipCheck = false;

    if (!userId) {
      // Fall back to env-var config when phone matches the default number
      if (process.env.WA_PHONE_NUMBER_ID && phoneId === process.env.WA_PHONE_NUMBER_ID) {
        userId = "default";
        skipOwnershipCheck = true; // env-var default doesn't have a DB row to check
        console.log("ℹ️ Using env-var config for phoneId:", phoneId);
      } else {
        console.error("❌ No user mapped for phoneId:", phoneId);
        return NextResponse.json({ status: "ok" });
      }
    }

    // ── 2. Verify webhook ownership ──────────────────────────
    if (!skipOwnershipCheck) {
      const storedHmac = await getPhoneMappingHmac(phoneId);
      if (!verifyOwnershipHmac(phoneId, userId, storedHmac)) {
        console.error(`❌ Ownership HMAC mismatch for phoneId=${phoneId} userId=${userId} — possible hijack attempt`);
        return NextResponse.json({ status: "ok" });
      }
    }

    const from      = message.from;
    const contactName = body.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || null;
    const baseConfig = await getConfig(userId);

    // ── Find the specific bot for this phone number ────────
    const bots  = await getBots(userId);
    const botId = await getBotIdByPhone(phoneId);
    const activeBot = (botId ? bots.find(b => b.id === botId) : null)
      || bots.find(b => b.phoneNumberId === phoneId)
      || bots.find(b => b.status !== "INACTIVO")
      || bots[0];

    if (activeBot && activeBot.status === "INACTIVO") {
      console.log(`⏸️ Bot inactivo, ignorando mensaje de ${from}`);
      return NextResponse.json({ status: "ok" });
    }

    const GENERIC_DEFAULTS = ["Asistente", "Assistant", "Mi Bot", "My Bot", "Bot", ""];
    const config = { ...activeBot };
    for (const [k, v] of Object.entries(baseConfig)) {
      if (v !== undefined && v !== null) config[k] = v;
    }
    if (GENERIC_DEFAULTS.includes(config.agentName || "")) {
      config.agentName = activeBot?.agentName || activeBot?.name || config.agentName;
    }
    if (!config.flow && activeBot?.flow) config.flow = activeBot.flow;
    if (activeBot) console.log(`🤖 Bot: ${config.agentName} / ${config.businessName} (id: ${activeBot.id})`);

    if (!config.accessToken || !config.phoneNumberId || !config.anthropicKey) {
      console.error("❌ Faltan credenciales");
      return NextResponse.json({ status: "error: missing config" });
    }

    // ── Resolve user message text ──────────────────────────
    let text;
    let transcribedNote = "";

    if (isAudio) {
      const mediaId = message.audio?.id;
      console.log(`🎤 Nota de voz recibida, media_id: ${mediaId}`);
      const openaiKey = config.openaiKey;
      if (!openaiKey) {
        await sendWhatsAppText(from, "Lo siento, la función de notas de voz no está configurada aún. Por favor escríbeme tu mensaje. 🙏", config);
        return NextResponse.json({ status: "ok" });
      }
      text = await transcribeWhatsAppAudio(mediaId, config, openaiKey);
      if (!text) {
        await sendWhatsAppText(from, "No pude entender el audio. ¿Puedes escribirme tu mensaje? 😊", config);
        return NextResponse.json({ status: "ok" });
      }
      console.log(`🎤 Transcripción: "${text}"`);
      transcribedNote = `🎤 _"${text}"_\n\n`;
    } else if (isInteractive) {
      const btnReply  = message.interactive?.button_reply;
      const listReply = message.interactive?.list_reply;
      const selected  = btnReply || listReply;
      text = selected?.title || selected?.id || "opción seleccionada";
      console.log(`🔘 Opción seleccionada: "${text}" (id: ${selected?.id})`);

      const flow = config.flow || activeBot?.flow;
      if (flow?.menuItems) {
        const matched = flow.menuItems.find(it => it.id === selected?.id || it.title === text);
        if (matched?.response) {
          text = `[El usuario seleccionó: "${text}"] ${matched.response}`;
        }
      }
    } else {
      text = message.text.body;
    }

    // ── Appointment flow ───────────────────────────────────────────────
    let _apptHandled = false;
    try {
      _apptHandled = await handleAppointmentFlow(text, from, userId, activeBot?.id || null, contactName || null, config);
    } catch (apptErr) {
      console.error("⚠️ Appointment flow error (continuing):", apptErr.message);
    }
    if (_apptHandled) return NextResponse.json({ status: "ok" });
    // ───────────────────────────────────────────────────────────────────

    const knowledge      = await getAllKBText(userId);
    const kbImages       = await getKBImages(userId);
    const history        = await getConversation(from, userId);
    const availableSlots = config.appointments?.enabled && config.appointments?.calendarId && config.appointments?.googleCredentials
      ? await getAvailableSlots(config.appointments).catch(() => null)
      : null;

    if (knowledge) console.log(`📚 KB: ${knowledge.length} chars`);
    if (kbImages.length) console.log(`🖼️ Imágenes en KB: ${kbImages.length}`);
    if (availableSlots) console.log(`📅 Slots disponibles en prompt`);

    const aiReply = await callClaude(text, config, knowledge, kbImages, history, availableSlots);

    const updatedHistory = [
      ...history,
      { role: "user", content: text },
      { role: "assistant", content: aiReply },
    ];
    setConversation(from, updatedHistory, userId).catch(() => {});

    // Parse [BOOK_APPOINTMENT:{...}] marker
    let cleanReply = aiReply;
    const bookStart = aiReply.indexOf("[BOOK_APPOINTMENT:");
    if (bookStart !== -1) {
      try {
        const rest = aiReply.slice(bookStart + "[BOOK_APPOINTMENT:".length);
        let braceDepth = 0, jsonEnd = -1;
        for (let i = 0; i < rest.length; i++) {
          if (rest[i] === "{") braceDepth++;
          else if (rest[i] === "}") { braceDepth--; if (braceDepth === 0) { jsonEnd = i; break; } }
        }
        if (jsonEnd !== -1) {
          const jsonStr = rest.slice(0, jsonEnd + 1);
          const appointmentData = JSON.parse(jsonStr);
          console.log("📅 Booking appointment:", JSON.stringify(appointmentData));
          const waConfig = { accessToken: config.accessToken, phoneNumberId: config.phoneNumberId };
          bookAppointment(appointmentData, from, config.appointments || {}, waConfig)
            .then(r => console.log(`📅 Booking result: cal=${r.results.calendar} sheets=${r.results.sheets} wa=${r.results.whatsapp}`))
            .catch(err => console.error("❌ Appointment booking error:", err.message));
          cleanReply = aiReply.slice(0, bookStart) + aiReply.slice(bookStart + "[BOOK_APPOINTMENT:".length + jsonEnd + 2);
        }
      } catch (err) {
        console.error("Failed to parse [BOOK_APPOINTMENT]:", err.message);
      }
    }

    // Parse [SEND_BOOKING_LINK] marker
    const hasBookingLink = cleanReply.includes("[SEND_BOOKING_LINK]");
    cleanReply = cleanReply.replace(/\[SEND_BOOKING_LINK\]/gi, "").trim();

    // Parse [SEND_IMAGE:id] markers
    const imageMarkerRegex = /\[SEND_IMAGE:([^\]]+)\]/gi;
    const imageMarkers = [...cleanReply.matchAll(imageMarkerRegex)];
    const cleanText = cleanReply.replace(imageMarkerRegex, "").trim();

    const finalText = transcribedNote + cleanText;
    if (finalText) await sendWhatsAppText(from, finalText, config);

    // ── Send interactive menu if flow mode requires it ─────
    const flow = config.flow || activeBot?.flow || baseConfig.flow;
    const flowMode = flow?.mode || "text";
    const isFirstMsg = history.length === 0;
    const shouldShowMenu = !!(
      flow?.menuItems?.length > 0 &&
      (flowMode === "menu" || (flowMode === "hybrid" && isFirstMsg)) &&
      !isInteractive
    );
    console.log(`🔀 flow mode: ${flowMode}, shouldShowMenu: ${shouldShowMenu}, items: ${flow?.menuItems?.length || 0}`);

    if (shouldShowMenu) {
      await sendWhatsAppMenu(from, flow, config);
    }

    // Send booking link if requested
    if (hasBookingLink && config.appointments?.enabled) {
      const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.NEXTAUTH_URL || "https://botflow-eight.vercel.app";
      const bookingUrl = `${baseUrl}/booking?from=${encodeURIComponent(from)}`;
      await sendWhatsAppText(from, `📅 Elige tu fecha y hora aquí:\n${bookingUrl}`, config);
    }

    // Send each image from Claude markers
    for (const match of imageMarkers) {
      const hint = match[1].toLowerCase().trim();
      const img = kbImages.find(i =>
        i.id === match[1].trim() ||
        i.id.toLowerCase().includes(hint) ||
        i.name.toLowerCase().includes(hint) ||
        hint.includes(i.name.toLowerCase().replace(/\.[^.]+$/, ""))
      );
      if (img) {
        console.log(`🖼️ Enviando imagen: ${img.name}`);
        await sendWhatsAppImage(from, img.id, img.name, config, userId);
      } else {
        console.warn(`⚠️ Imagen no encontrada para hint: ${hint}`);
      }
    }

    // Fallback: if user asked for images but Claude didn't generate markers, send automatically
    if (imageMarkers.length === 0 && kbImages.length > 0) {
      const photoRequest = /\b(foto|fotos|imagen|imágenes|picture|photo|photos|muéstrame|mándame|envíame|ver|muestra|catálogo).*(foto|imagen|picture|photo)\b|\b(foto|fotos|imagen|imágenes|picture|photos)\b/i;
      if (photoRequest.test(text)) {
        console.log("⚠️ Fallback: usuario pidió fotos pero Claude no generó markers — enviando automáticamente");
        for (const img of kbImages.slice(0, 3)) {
          console.log(`🖼️ Fallback img: ${img.name}`);
          await sendWhatsAppImage(from, img.id, img.name, config, userId);
        }
      }
    }

    const botName = config.agentName || config.businessName || "Bot";
    const trackText = isAudio ? `🎤 ${text}` : text;
    trackMessage(from, trackText, botName, userId).catch(() => {});
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}


// ── Appointment flow handler ─────────────────────────────────────────────────
const APPT_INTENT = /\b(cita|citas|agendar|agenda|reservar|reserva|turno|quiero una cita|quiero un turno|quiero agendar|necesito una cita|necesito un turno|quiero una reserva|appointment|booking)\b/i;

// ── Availability helpers ────────────────────────────────────────────────
function getAvailableDates(availCfg, numDays = 14) {
  const allowedDays = availCfg?.available_days || [1,2,3,4,5];
  const dates = [];
  const DAY_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const MONTH_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const now = new Date();
  // Start from tomorrow
  for (let i = 1; i <= 30 && dates.length < numDays; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    if (allowedDays.includes(d.getDay())) {
      dates.push({
        label: `${DAY_ES[d.getDay()]} ${d.getDate()} de ${MONTH_ES[d.getMonth()]}`,
        iso:   `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
      });
    }
  }
  return dates;
}

function getApptTimeSlots(availCfg) {
  const start = availCfg?.start_time || "09:00";
  const end   = availCfg?.end_time   || "18:00";
  const mins  = availCfg?.slot_minutes || 60;
  const [sh,sm] = start.split(":").map(Number);
  const [eh,em] = end.split(":").map(Number);
  const startM = sh*60+sm, endM = eh*60+em;
  const slots = [];
  for (let m = startM; m < endM; m += mins) {
    const h = Math.floor(m/60), mi = m%60;
    const suffix = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h-12 : h;
    slots.push(`${h12}:${String(mi).padStart(2,"0")} ${suffix}`);
  }
  return slots;
}

function isDateField(key) { return /fecha|date|dia|día/i.test(key); }
function isTimeField(key) { return /hora|time|horario/i.test(key); }

function buildFieldQuestion(field, availCfg) {
  const key = field.field_key || "";
  if (isDateField(key)) {
    const dates = getAvailableDates(availCfg);
    if (dates.length === 0) return field.question;
    const list = dates.slice(0,10).map((d,i) => `  ${i+1}. ${d.label}`).join("\n");
    return `${field.question}\n\n📅 *Fechas disponibles:*\n${list}\n\nResponde con el número o escribe la fecha.`;
  }
  if (isTimeField(key)) {
    const slots = getApptTimeSlots(availCfg);
    if (slots.length === 0) return field.question;
    const list = slots.map((s,i) => `  ${i+1}. ${s}`).join("\n");
    return `${field.question}\n\n🕐 *Horarios disponibles:*\n${list}\n\nResponde con el número o escribe la hora.`;
  }
  return field.question;
}

function resolveAnswer(text, field, availCfg) {
  const key = field.field_key || "";
  const num = parseInt(text.trim(), 10);
  if (!isNaN(num) && num >= 1) {
    if (isDateField(key)) {
      const dates = getAvailableDates(availCfg);
      if (dates[num-1]) return dates[num-1].label;
    }
    if (isTimeField(key)) {
      const slots = getApptTimeSlots(availCfg);
      if (slots[num-1]) return slots[num-1];
    }
  }
  return text.trim();
}


async function callClaude(userMessage, config, knowledge = "", kbImages = [], history = [], availableSlots = null) {
  const rawAgent = config.agentName || "";
  const isGeneric = !rawAgent || rawAgent === "Asistente" || rawAgent === "Assistant" || rawAgent === "Bot";
  const agentName = isGeneric
    ? (config.name && config.name !== "Mi Bot" && config.name !== "My Bot" ? config.name : rawAgent || "tu asistente")
    : rawAgent;
  const businessName = config.businessName || config.name || "este negocio";
  const tone         = config.tone         || "amigable";
  const language     = config.language     || "es";
  const useEmojis    = config.useEmojis    !== false;
  const shortAnswers = config.shortAnswers !== false;

  const toneDescriptions = {
    amigable: "amigable, cercano y casual", profesional: "profesional, formal y serio",
    energético: "energético, dinámico y entusiasta", empático: "empático, comprensivo y cálido",
    directo: "directo, conciso y al grano", vendedor: "orientado a ventas, persuasivo y entusiasta",
  };

  let systemPrompt = `Eres ${agentName}, el asistente virtual de WhatsApp de ${businessName}.`;
  if (config.businessDesc)    systemPrompt += `\n\nDescripción: ${config.businessDesc}`;
  if (config.businessProfile) systemPrompt += `\n\nPerfil detallado del negocio:\n${config.businessProfile}`;
  if (config.services)        systemPrompt += `\nServicios/productos: ${config.services}`;
  if (config.hours)           systemPrompt += `\nHorario: ${config.hours}`;
  if (config.location)        systemPrompt += `\nUbicación: ${config.location}`;
  if (config.fullAddress)     systemPrompt += `\nDirección: ${config.fullAddress}`;
  if (config.phone)           systemPrompt += `\nTeléfono: ${config.phone}`;
  if (config.website)         systemPrompt += `\nSitio web: ${config.website}`;
  if (config.pricePolicy)     systemPrompt += `\nPolítica de precios: ${config.pricePolicy}`;

  if (config.catalog && config.catalog.length > 0) {
    const validItems = config.catalog.filter(c => c.name);
    if (validItems.length > 0) {
      systemPrompt += `\n\nCATÁLOGO DE PRODUCTOS/SERVICIOS:\n`;
      validItems.forEach(c => {
        systemPrompt += `• ${c.name}${c.price ? ` — ${c.price}` : ""}${c.description ? `\n  ${c.description}` : ""}`;
        if (c.imageId) systemPrompt += `\n  [Imagen disponible ID: ${c.imageId}]`;
        systemPrompt += "\n";
      });
    }
  }
  systemPrompt += `\n\nTono: ${toneDescriptions[tone] || tone}.`;
  systemPrompt += `\n${language === "en" ? "Always respond in English." : language === "pt" ? "Responda em português." : "Responde siempre en español."}`;
  if (shortAnswers) systemPrompt += "\nSé breve y conciso (máximo 3-4 oraciones).";
  if (useEmojis)    systemPrompt += "\nUsa emojis con moderación.";
  else              systemPrompt += "\nNo uses emojis.";
  const isFirstMessage = history.length === 0;
  systemPrompt += `\nTu nombre es SIEMPRE "${agentName}". Nunca uses otro nombre al presentarte.`;
  if (config.greeting && isFirstMessage) {
    const fixedGreeting = config.greeting
      .replace(/Soy \*?[^,.\*\n😊!?]+\*?/i, `Soy *${agentName}*`)
      .replace(/Me llamo \*?[^,.\*\n😊!?]+\*?/i, `Me llamo *${agentName}*`)
      .replace(/Soy el asistente/i, `Soy ${agentName}`);
    systemPrompt += `\nSaludo de bienvenida: "${fixedGreeting}"`;
  } else if (isFirstMessage) {
    systemPrompt += `\nPreséntate brevemente como ${agentName}, asistente de ${businessName}.`;
  }
  systemPrompt += `\nIMPORTANTE: ${isFirstMessage ? "Esta es la primera vez que hablas con este usuario, preséntate con tu nombre correcto." : "Ya conoces a este usuario, NO te vuelvas a presentar. Continúa la conversación de forma natural."}`;

  systemPrompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLA CRÍTICA — NUNCA CIERRES LA CONVERSACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cuando el cliente diga "no", "no gracias", "no ahorita", "quizás después", "lo pienso" o cualquier variante de rechazo o postergación:
❌ JAMÁS respondas con frases que cierren la conversación como:
   - "Está bien, sin problema. Aquí estamos si necesitas algo."
   - "Entendido. Cuando gustes nos contactas."
   - "Que tengas buen día, con gusto te atiendo después."
✅ SIEMPRE continúa con UNA estrategia natural:
   a) Pregunta qué le genera duda: "¿Qué parte no te convence? A lo mejor hay algo que puedo aclarar."
   b) Ofrece algo más pequeño: "¿Quizás prefieres una demo o una consulta breve sin compromiso?"
   c) Comparte un ejemplo: "Mira, un cliente similar dudó igual y terminó muy contento — ¿quieres ver cómo quedó?"
   d) Muestra otra opción: "Si ese servicio no es lo que buscas, también tenemos [alternativa relacionada]."
   e) Descubre la necesidad real: "¿Qué tipo de solución sí encajaría con lo que tienes en mente?"
Sé natural y curioso, NO insistente ni desesperado.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGLA CRÍTICA — MOSTRAR SERVICIOS CON ENTUSIASMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cuando el cliente mencione cualquier servicio, evento o producto (aunque sea de pasada), SIEMPRE:
1. Describe ese servicio de manera atractiva y entusiasta (2-3 líneas máximo).
2. Si hay imágenes relacionadas en la base de conocimientos, ENVÍALAS AUTOMÁTICAMENTE sin que el cliente las pida, usando [SEND_IMAGE:id].
3. Propón el siguiente paso natural: agendar consulta, pedir cotización, ver más detalles.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  if (config.faqs && Array.isArray(config.faqs)) {
    const validFaqs = config.faqs.filter(f => f.question && f.answer);
    if (validFaqs.length > 0) {
      systemPrompt += "\n\nRespuestas predefinidas:";
      validFaqs.forEach(faq => { systemPrompt += `\n- "${faq.question}" → "${faq.answer}"`; });
    }
  }
  if (config.extraInstructions) systemPrompt += `\n\nInstrucciones especiales: ${config.extraInstructions}`;

  const flow     = config.flow || config._flow;
  const flowMode = flow?.mode || "text";
  if (flowMode === "menu" && flow?.menuItems?.length > 0) {
    const optionsList = flow.menuItems.map(it => `"${it.title}"`).join(", ");
    systemPrompt += `\n\nMODO MENÚ: El usuario interactúa seleccionando botones. Las opciones disponibles son: ${optionsList}. Responde enfocado en la opción que el usuario seleccionó. Sé conciso.`;
  } else if (flowMode === "hybrid" && flow?.menuItems?.length > 0) {
    const optionsList = flow.menuItems.map(it => `"${it.title}"`).join(", ");
    systemPrompt += `\n\nMODO HÍBRIDO: Tienes un menú con opciones (${optionsList}) pero el usuario también puede escribir texto libre. Responde a lo que el usuario envíe.`;
  }

  const appointments = config.appointments;
  if (appointments?.enabled && appointments.fields?.length > 0) {
    const fields   = appointments.fields;
    const required = fields.filter(f => f.required);
    const sep = "=".repeat(40);

    systemPrompt += `\n\n${sep}\nSISTEMA DE CITAS\n${sep}`;
    systemPrompt += `\nCuando el usuario quiera agendar una cita, reservar, hacer una cita o hablar con alguien:`;
    systemPrompt += `\n1. Pide estos datos uno por uno, de forma amigable y natural:`;
    fields.forEach(f => {
      systemPrompt += `\n   • ${f.label}${f.required ? " (obligatorio)" : " (opcional)"}`;
    });

    if (availableSlots) {
      systemPrompt += `\n\n2. HORARIOS DISPONIBLES (próximos días):\n${availableSlots}`;
      systemPrompt += `\n   Ofrece estos horarios al usuario para que elija. NO inventes otros horarios.`;
    } else {
      systemPrompt += `\n\n2. Pregunta por la fecha y hora preferida del usuario.`;
    }

    systemPrompt += `\n\n3. Una vez que tengas TODOS los datos obligatorios (${required.map(f => f.label).join(", ")}), agrega AL FINAL de tu mensaje:`;
    systemPrompt += `\n   [BOOK_APPOINTMENT:{"${fields.map(f => `${f.key}":"valor`).join(`","`)}"}]`;
    systemPrompt += `\n   (usa los valores reales que el usuario te dio)`;
    systemPrompt += `\n4. Confirma al usuario que su cita fue registrada exitosamente.`;
    systemPrompt += `\nOPCIÓN ALTERNATIVA: Si el usuario prefiere elegir su fecha visualmente, puedes enviarle el link del calendario con [SEND_BOOKING_LINK] al final de tu mensaje.`;
    systemPrompt += `\nIMPORTANTE: Incluye [BOOK_APPOINTMENT:...] SOLO cuando tengas TODOS los datos obligatorios. Nunca antes.`;
    systemPrompt += `\n${sep}`;
  }

  if (knowledge) {
    systemPrompt += `\n\n${"=".repeat(40)}\nBASE DE CONOCIMIENTOS\n${"=".repeat(40)}\n${knowledge}\n${"=".repeat(40)}`;
  }

  if (kbImages.length > 0) {
    const imgList = kbImages.map((img, i) => {
      let line = `${i + 1}. [SEND_IMAGE:${img.id}] → ${img.name}`;
      if (img.description) line += ` (${img.description})`;
      if (img.preview) line += ` | ${img.preview.slice(0, 60)}`;
      return line;
    }).join("\n");
    const exampleId = kbImages[0] ? kbImages[0].id : "ID_EJEMPLO";
    systemPrompt += `\n\n${"=".repeat(40)}
IMÁGENES DISPONIBLES — COPIA EL MARCADOR EXACTO
${"=".repeat(40)}
Cuando el usuario pida fotos/imágenes, incluye los marcadores de abajo COPIADOS EXACTAMENTE:
${imgList}

INSTRUCCIÓN CRÍTICA — IMÁGENES:
• Cuando el usuario pida fotos/imágenes/catálogo: copia y pega los marcadores al FINAL de tu respuesta.
• Ejemplo correcto: "¡Aquí te muestro nuestro catálogo! 📸 [SEND_IMAGE:${exampleId}]"
• Si pide todas las fotos: incluye todos los marcadores (máximo 4).
• NUNCA digas que no puedes enviar imágenes. SIEMPRE puedes copiando el marcador.
• NUNCA escribas el ID manualmente — copia el marcador completo de la lista de arriba.
${"=".repeat(40)}`;
  }

  systemPrompt += "\nSi preguntan por citas o pedidos, pide nombre, fecha y hora.";
  systemPrompt += "\nNunca inventes información que no esté en tu base de conocimientos.";

  const messages = [
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.anthropicKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", max_tokens: 600,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "Hola, ¿en qué te puedo ayudar?";
}

// ── Transcribe WhatsApp voice note via Whisper ────────────
async function transcribeWhatsAppAudio(mediaId, config, openaiKey) {
  try {
    const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });
    if (!mediaRes.ok) {
      console.error("❌ Error obteniendo media URL:", await mediaRes.text());
      return null;
    }
    const mediaData = await mediaRes.json();
    const audioUrl  = mediaData.url;
    const mimeType  = mediaData.mime_type || "audio/ogg";

    const audioRes = await fetch(audioUrl, {
      headers: { Authorization: `Bearer ${config.accessToken}` },
    });
    if (!audioRes.ok) {
      console.error("❌ Error descargando audio:", audioRes.status);
      return null;
    }
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    const extMap = {
      "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "mp4",
      "audio/wav": "wav", "audio/webm": "webm", "audio/m4a": "m4a",
    };
    const ext = extMap[mimeType.split(";")[0].trim()] || "ogg";
    const filename = `voice.${ext}`;

    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: mimeType });
    formData.append("file", blob, filename);
    formData.append("model", "whisper-1");
    formData.append("language", "es");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.json();
      console.error("❌ Whisper error:", JSON.stringify(err));
      return null;
    }

    const whisperData = await whisperRes.json();
    return whisperData.text?.trim() || null;

  } catch (err) {
    console.error("❌ transcribeWhatsAppAudio:", err.message);
    return null;
  }
}

async function sendWhatsAppMenu(to, flow, config) {
  const items   = (flow.menuItems || []).filter(i => i.title);
  const welcome = flow.menuWelcome || "Selecciona una opción:";
  const type    = flow.menuType || "buttons";

  if (items.length === 0) return;

  let interactive;

  if (type === "buttons") {
    const buttons = items.slice(0, 3).map(it => ({
      type: "reply",
      reply: {
        id: String(it.id).slice(0, 256),
        title: it.title.trim().slice(0, 20),
      },
    }));
    interactive = {
      type: "button",
      body: { text: welcome.slice(0, 1024) },
      action: { buttons },
    };
  } else {
    const rows = items.slice(0, 10).map(it => ({
      id: String(it.id).slice(0, 200),
      title: it.title.trim().slice(0, 24),
      description: (it.description || "").slice(0, 72),
    }));
    interactive = {
      type: "list",
      body: { text: welcome.slice(0, 1024) },
      action: { button: "Ver opciones", sections: [{ title: "Opciones", rows }] },
    };
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "interactive",
    interactive,
  };

  console.log("📋 Sending menu:", JSON.stringify(payload).slice(0, 300));

  const res = await fetch(`https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("❌ WA menu error:", JSON.stringify(err));
    const textMenu = welcome + "\n\n" + items.map((it, i) => `${i + 1}. ${it.title}`).join("\n");
    await fetch(`https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: textMenu } }),
    });
  } else {
    console.log("✅ Menu sent successfully");
  }
}

async function sendWhatsAppText(to, text, config) {
  const res = await fetch(`https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  if (!res.ok) { const err = await res.json(); console.error("❌ WA text error:", JSON.stringify(err)); }
}

async function sendWhatsAppImage(to, imageId, imageName, config, userId) {
  try {
    const imgData = await getKBImageData(imageId, userId);
    if (!imgData) { console.error(`❌ No image data for id: ${imageId}`); return; }

    const { base64, mimeType, filename } = imgData;
    const buffer = Buffer.from(base64, "base64");

    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("type", mimeType || "image/jpeg");
    const blob = new Blob([buffer], { type: mimeType || "image/jpeg" });
    formData.append("file", blob, filename || imageName || "image.jpg");

    const uploadRes = await fetch(
      `https://graph.facebook.com/v19.0/${config.phoneNumberId}/media`,
      { method: "POST", headers: { Authorization: `Bearer ${config.accessToken}` }, body: formData }
    );
    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.id) {
      console.error("❌ Media upload error:", JSON.stringify(uploadData));
      return;
    }

    const sendRes = await fetch(`https://graph.facebook.com/v19.0/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.accessToken}` },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "image",
        image: { id: uploadData.id, caption: imageName || "" },
      }),
    });
    if (!sendRes.ok) {
      const errData = await sendRes.json();
      console.error("❌ Error sending image:", JSON.stringify(errData));
    }
  } catch (err) {
    console.error("❌ sendWhatsAppImage error:", err.message);
  }
}
