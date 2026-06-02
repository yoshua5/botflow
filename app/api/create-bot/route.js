import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConfig, setConfig, getBots, setBots } from "@/lib/storage";

const QUESTIONS = [
  { id: "businessName",      text: "¿Cuál es el nombre de tu negocio?",                                          hint: 'Ej: "Cafetería El Buen Sabor"' },
  { id: "businessDesc",      text: "¿A qué se dedica tu negocio? Descríbelo en pocas palabras.",                  hint: 'Ej: "Vendemos café de especialidad y postres artesanales"' },
  { id: "purpose",           text: "¿Para qué quieres usar el agente?",                                          hint: "Ej: responder preguntas, agendar citas, tomar pedidos, soporte técnico..." },
  { id: "agentName",         text: "¿Cómo quieres que se llame tu agente? (el nombre que verán tus clientes)",   hint: 'Ej: "Sofía", "Max", "Luna"' },
  { id: "tone",              text: "¿Qué tono de comunicación debe tener tu agente?",                            hint: "Elige: profesional, amigable, vendedor o empático" },
  { id: "hours",             text: "¿Cuál es tu horario de atención?",                                           hint: 'Ej: "Lunes a Viernes 9am–6pm, Sábados 10am–2pm"' },
  { id: "location",          text: "¿En qué ciudad o país está tu negocio?",                                     hint: 'Ej: "Ciudad de México, CDMX" o "Madrid, España"' },
  { id: "services",          text: "¿Cuáles son tus servicios o productos principales? Descríbelos.",             hint: 'Ej: "Americano, Cappuccino, Cheesecake, Croissant — precios desde $50"' },
  { id: "faqs",              text: "¿Cuáles son las 2–3 preguntas más frecuentes que te hacen tus clientes?",    hint: 'Ej: "1. ¿Tienen envíos a domicilio? 2. ¿Cuál es el precio del menú?"' },
  { id: "extraInstructions", text: "¿Tienes alguna instrucción especial para el agente?",                        hint: "Ej: descuentos vigentes, políticas de devolución, frases que debe evitar..." },
];

function parseTone(toneAnswer) {
  const lower = toneAnswer.toLowerCase();
  if (lower.includes("profesional")) return "profesional";
  if (lower.includes("vendedor"))    return "vendedor";
  if (lower.includes("empático") || lower.includes("empatico")) return "empático";
  return "amigable";
}

function buildConfig(answers, existingConfig) {
  const faqsRaw  = answers.faqs || "";
  const faqLines = faqsRaw.split(/\n|\d+\.\s+/).filter(s => s.trim().length > 10);
  const faqs     = faqLines.map(line => ({ question: line.trim(), answer: "" }));

  return {
    ...existingConfig,
    businessName:      answers.businessName || "",
    businessDesc:      answers.businessDesc || "",
    agentName:         answers.agentName || "Asistente",
    tone:              parseTone(answers.tone || "amigable"),
    hours:             answers.hours || "",
    location:          answers.location || "",
    services:          answers.services || "",
    language:          "es",
    useEmojis:         true,
    shortAnswers:      true,
    faqs:              faqs,
    extraInstructions: [
      answers.purpose ? `Propósito del agente: ${answers.purpose}` : "",
      answers.extraInstructions || "",
    ].filter(Boolean).join("\n\n"),
    greeting: `¡Hola! Soy ${answers.agentName || "tu asistente"} de ${answers.businessName || "nuestro negocio"}. ¿En qué te puedo ayudar hoy? 😊`,
  };
}

export async function POST(request) {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { step, userAnswer, answers, anthropicKey, _autofill } = await request.json();

    const config = await getConfig();

    // ── Autofill mode: skip Claude, save directly ──────────
    if (_autofill) {
      try {
        const newConfig = buildConfig(answers, config);
        // Also carry over extra fields from the new form
        const merged = {
          ...newConfig,
          businessProfile:  answers.businessProfile  || newConfig.businessProfile  || "",
          fullAddress:      answers.fullAddress       || newConfig.fullAddress      || "",
          phone:            answers.phone             || newConfig.phone            || "",
          website:          answers.website           || newConfig.website          || "",
          contactEmail:     answers.contactEmail      || newConfig.contactEmail     || "",
          greeting:         answers.greeting          || newConfig.greeting,
          extraInstructions: answers.extraInstructions || newConfig.extraInstructions || "",
        };
        await setConfig(merged);

        const bots   = await getBots(userId);
        const newBot = {
          id:                `bot-${Date.now()}`,
          name:              merged.businessName || "Mi Bot",
          agentName:         merged.agentName    || "Asistente",
          businessName:      merged.businessName || "Mi negocio",
          status:            "ACTIVO",
          createdAt:         new Date().toISOString(),
          messageCount:      0,
          conversationCount: 0,
        };
        bots.unshift(newBot);
        // ✅ CRITICAL: Save with userId to ensure RLS enforcement
        await setBots(bots, userId);
        return NextResponse.json({ success: true, bot: newBot });
      } catch (err) {
        console.error("create-bot autofill error:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
    }

    // ── Legacy step-by-step flow ───────────────────────────
    const apiKey = anthropicKey || config.anthropicKey;

    if (!apiKey) {
      return NextResponse.json({
        reply: "⚠️ Para continuar, primero agrega tu Anthropic API Key en **Settings → WhatsApp**. Sin ella no puedo procesar tus respuestas.",
        nextStep: step,
        done: false,
        error: "missing_key",
      });
    }

    const currentQuestion = QUESTIONS[step];
    const isLast = step === QUESTIONS.length - 1;

    const systemPrompt = `Eres el asistente de onboarding de Botflow, una plataforma para crear bots de WhatsApp con IA.
Tu trabajo es ayudar al dueño de un negocio a configurar su agente de WhatsApp haciéndole ${QUESTIONS.length} preguntas, una por una.

Pregunta actual (${step + 1}/${QUESTIONS.length}): "${currentQuestion.text}"
El usuario acaba de responder esta pregunta.

${isLast ? "Esta fue la ÚLTIMA pregunta." : `La siguiente pregunta es (${step + 2}/${QUESTIONS.length}): "${QUESTIONS[step + 1].text}" — Hint: ${QUESTIONS[step + 1].hint}`}

Instrucciones:
- Primero, reconoce brevemente la respuesta del usuario con una frase cálida y personalizada (usa el dato que dijo).
- ${isLast
  ? "Como es la última pregunta, di algo como: '¡Perfecto! Ya tengo toda la información que necesito. Estoy configurando tu agente ahora... 🚀' (No hagas más preguntas)"
  : `Luego, de forma natural y fluida, haz la siguiente pregunta. Incluye el hint como ejemplo entre paréntesis o como sugerencia.`}
- Sé conciso: máximo 3 oraciones en total.
- Responde SIEMPRE en español.
- Usa emojis con moderación para un tono cálido.
- NO repitas la pregunta ya contestada.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":    "application/json",
          "x-api-key":       apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model:      "claude-haiku-4-5-20251001",
          max_tokens: 250,
          system:     systemPrompt,
          messages:   [{ role: "user", content: userAnswer }],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || "Error calling Claude API");
      }

      const reply    = data.content?.[0]?.text || "¡Genial! Continuemos. 😊";
      const nextStep = step + 1;
      const done     = isLast;

      if (done) {
        const finalAnswers = { ...answers, [currentQuestion.id]: userAnswer };
        const newConfig    = buildConfig(finalAnswers, config);
        await setConfig(newConfig);

        const bots   = await getBots(userId);
        const newBot = {
          id:               `bot-${Date.now()}`,
          name:             newConfig.businessName || "Mi Bot",
          agentName:        newConfig.agentName    || "Asistente",
          businessName:     newConfig.businessName || "Mi negocio",
          status:           "ACTIVO",
          createdAt:        new Date().toISOString(),
          messageCount:     0,
          conversationCount:0,
        };
        bots.unshift(newBot);
        // ✅ CRITICAL: Save with userId to ensure RLS enforcement
        await setBots(bots, userId);
      }

      return NextResponse.json({ reply, nextStep, done });

    } catch (err) {
      console.error("create-bot error:", err);
      return NextResponse.json({
        reply:    `Lo siento, hubo un error: ${err.message}. Verifica tu API Key en Settings.`,
        nextStep: step,
        done:     false,
        error:    err.message,
      });
    }
  } catch (err) {
    console.error("create-bot POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const q = QUESTIONS[0];
    return NextResponse.json({
      question: q.text,
      hint:     q.hint,
      step:     0,
      total:    QUESTIONS.length,
    });
  } catch (err) {
    console.error("create-bot GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
