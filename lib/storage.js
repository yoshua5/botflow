/**
 * storage.js — Supabase-backed storage (with KV fallback for migration)
 *
 * Architecture:
 *   - Each bot has its OWN config row (bot_configs) — no more shared global config
 *   - Sensitive keys (access_token, anthropic_key) are AES-256 encrypted
 *   - ENCRYPTION_KEY lives in Vercel env vars, never in Supabase
 *   - Service Role Key used server-side → bypasses RLS safely
 *   - RLS policies protect all tables from cross-user access
 *
 * Migration: set USE_SUPABASE=true in env vars when ready to switch.
 *            During migration, KV is kept as fallback.
 */

import { supabase, ensureUser } from "./supabase.js";
import { encrypt, decrypt, safeEncrypt, safeDecrypt } from "./crypto.js";
import { computeOwnershipHmac } from "./webhookAuth.js"; // used in setPhoneMapping to generate ownership HMAC

// Auto-enable Supabase when credentials are present (no need for USE_SUPABASE=true flag)
const USE_SUPABASE = process.env.USE_SUPABASE === "true" ||
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

// ── Lazy KV import (old system, kept for fallback) ───────────
async function kv() {
  const mod = await import("@vercel/kv");
  return mod.kv;
}

// ── Auth helpers ─────────────────────────────────────────────
function getUid(explicitId) {
  if (explicitId) return explicitId;
  // ✅ NOTE: NextAuth context not available in non-async functions
  // Always require explicit userId to be passed from Route Handlers
  return "default";
}

async function getUserIdAndEnsure(explicitId) {
  const uid = getUid(explicitId);
  if (USE_SUPABASE && uid !== "default") {
    try {
      await ensureUser(uid, uid);
    } catch (e) {
      console.warn("⚠️ ensureUser failed (Supabase may be unavailable):", e.message);
    }
  }
  return uid;
}

// ── Local file helpers (fallback when Supabase is unavailable) ──
// Use /tmp in production (Vercel read-only filesystem), cwd in dev
function storageDir() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL ? "/tmp" : process.cwd();
}

async function localReadBots(uid) {
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const p = path.join(storageDir(), `botflow-bots_${uid}.json`);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { return []; }
}

async function localWriteBots(uid, bots) {
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    fs.writeFileSync(path.join(storageDir(), `botflow-bots_${uid}.json`), JSON.stringify(bots, null, 2));
  } catch (e) {
    console.error("❌ localWriteBots failed:", e.message);
  }
}

async function localReadConfig(uid) {
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const p = path.join(storageDir(), `botflow-config_${uid}.json`);
    if (!fs.existsSync(p)) return {};
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { return {}; }
}

async function localWriteConfig(uid, config) {
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    fs.writeFileSync(path.join(storageDir(), `botflow-config_${uid}.json`), JSON.stringify(config, null, 2));
  } catch (e) {
    console.error("❌ localWriteConfig failed:", e.message);
  }
}

// ── Env overrides (always applied on top) ────────────────────
function envOverrides() {
  const o = {};
  if (process.env.ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY)
    o.anthropicKey = process.env.ANTHROPIC_KEY || process.env.ANTHROPIC_API_KEY;
  if (process.env.WA_ACCESS_TOKEN)    o.accessToken     = process.env.WA_ACCESS_TOKEN;
  if (process.env.WA_PHONE_NUMBER_ID) o.phoneNumberId   = process.env.WA_PHONE_NUMBER_ID;
  if (process.env.WA_VERIFY_TOKEN)    o.verifyToken     = process.env.WA_VERIFY_TOKEN;
  if (process.env.WA_BUSINESS_ID)     o.waBusinessId    = process.env.WA_BUSINESS_ID;
  if (process.env.OPENAI_API_KEY)     o.openaiKey       = process.env.OPENAI_API_KEY;
  return o;
}

// ═══════════════════════════════════════════════════════════
// PHONE MAPPING
// ═══════════════════════════════════════════════════════════

export async function getUserIdByPhone(phoneId) {
  if (!phoneId) return null;

  if (USE_SUPABASE) {
    const db = supabase();
    const { data } = await db
      .from("phone_mappings")
      .select("user_id")
      .eq("phone_number_id", phoneId)
      .single();
    return data?.user_id || null;
  }

  // KV fallback
  const store = await kv();
  const val   = await store.get(`wa-phone:${phoneId}`);
  if (!val) return null;
  if (typeof val === "string") return val;
  return val.userId || null;
}

export async function getBotIdByPhone(phoneId) {
  if (!phoneId) return null;

  if (USE_SUPABASE) {
    const db = supabase();
    const { data } = await db
      .from("phone_mappings")
      .select("bot_id")
      .eq("phone_number_id", phoneId)
      .single();
    return data?.bot_id || null;
  }

  // KV fallback
  const store = await kv();
  const val   = await store.get(`wa-phone:${phoneId}`);
  if (!val || typeof val === "string") return null;
  return val.botId || null;
}

export async function setPhoneMapping(phoneId, userId, botId) {
  if (!phoneId || !userId || userId === "default") return;

  if (USE_SUPABASE) {
    const db = supabase();
    // Compute ownership HMAC so the webhook can verify this phone belongs to this user
    const hmacSig = computeOwnershipHmac(phoneId, userId);
    await db.from("phone_mappings").upsert(
      {
        phone_number_id: phoneId,
        user_id:         userId,
        bot_id:          botId || null,
        hmac_sig:        hmacSig,
      },
      { onConflict: "phone_number_id" }
    );
    // Also update the bot row
    if (botId) {
      await db.from("bots")
        .update({ phone_number_id: phoneId, updated_at: new Date().toISOString() })
        .eq("id", botId);
    }
    return;
  }

  // KV fallback
  const payload = botId ? { userId, botId } : { userId };
  const store   = await kv();
  await store.set(`wa-phone:${phoneId}`, payload);
}

/**
 * Retrieve the stored ownership HMAC for a phone number.
 * Used by the webhook to verify that incoming messages belong to the expected user.
 */
export async function getPhoneMappingHmac(phoneId) {
  if (!phoneId) return null;
  if (USE_SUPABASE) {
    const db = supabase();
    const { data } = await db
      .from("phone_mappings")
      .select("hmac_sig")
      .eq("phone_number_id", phoneId)
      .single();
    return data?.hmac_sig || null;
  }
  // KV doesn't store HMAC — ownership verification only applies in Supabase mode
  return null;
}

// ═══════════════════════════════════════════════════════════
// CONFIG (per-bot in Supabase, global in KV)
// ═══════════════════════════════════════════════════════════

/**
 * Get config for a user (and optionally a specific bot).
 * In Supabase mode: merges bot_configs + bot_secrets (decrypted).
 * Always applies env overrides on top.
 */
export async function getConfig(explicitId, botId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();

    // If botId provided, get that bot's config
    // Otherwise get the first active bot's config
    let configQuery = db
      .from("bot_configs")
      .select("*")
      .eq("user_id", uid);

    if (botId) {
      configQuery = configQuery.eq("bot_id", botId);
    }

    const { data: configs } = await configQuery.limit(1).single();

    // Get secrets for this bot
    let secretsQuery = db
      .from("bot_secrets")
      .select("*")
      .eq("user_id", uid);
    if (botId) secretsQuery = secretsQuery.eq("bot_id", botId);
    const { data: secrets } = await secretsQuery.limit(1).single();

    // Get bot metadata
    let botQuery = db.from("bots").select("*").eq("user_id", uid);
    if (botId) botQuery = botQuery.eq("id", botId);
    const { data: bot } = await botQuery.limit(1).single();

    const stored = {
      ...(configs || {}),
      // Map snake_case → camelCase
      agentName:        configs?.agent_name,
      businessName:     configs?.business_name || bot?.business_name,
      businessDesc:     configs?.business_desc,
      businessProfile:  configs?.business_profile,
      extraInstructions: configs?.extra_instructions,
      useEmojis:        configs?.use_emojis,
      shortAnswers:     configs?.short_answers,
      fullAddress:      configs?.full_address,
      contactEmail:     configs?.contact_email,
      pricePolicy:      configs?.price_policy,
      siteName:         configs?.site_name,
      faviconBase64:    configs?.favicon_base64,
      faviconMimeType:  configs?.favicon_mime_type,
      phoneNumberId:    bot?.phone_number_id,
      waBusinessId:     bot?.wa_business_id,
      displayPhone:     bot?.display_phone,
      // Decrypt secrets
      accessToken:      secrets ? decrypt(secrets.access_token_enc) : null,
      anthropicKey:     secrets ? decrypt(secrets.anthropic_key_enc) : null,
      openaiKey:        secrets ? decrypt(secrets.openai_key_enc) : null,
      verifyToken:      secrets?.verify_token,
      flow:             configs?.flow,
      appointments:     configs?.appointments,
      faqs:             configs?.faqs,
      catalog:          configs?.catalog,
    };

    // Remove nulls and apply env overrides
    Object.keys(stored).forEach(k => stored[k] === null && delete stored[k]);

    // If Supabase returned nothing useful, fall back to local file
    if (!configs && !bot) {
      const local = await localReadConfig(uid);
      return { ...local, ...envOverrides() };
    }

    return { ...stored, ...envOverrides() };
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  let stored = {};
  if (IS_VERCEL) {
    const store = await kv();
    stored = (await store.get(`botflow-config:${uid}`)) || {};
  } else {
    stored = await localReadConfig(uid);
  }
  return { ...stored, ...envOverrides() };
}

/**
 * Save config for a user/bot.
 * In Supabase: writes to bot_configs + bot_secrets (encrypted).
 */
export async function setConfig(config, explicitId, botId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();

    // Resolve botId if not provided
    let resolvedBotId = botId;
    if (!resolvedBotId) {
      const { data: bot } = await db
        .from("bots")
        .select("id")
        .eq("user_id", uid)
        .limit(1)
        .single();
      resolvedBotId = bot?.id;
    }

    if (!resolvedBotId) {
      // Supabase couldn't find a bot (likely invalid key) → fall back to local file
      console.warn("⚠️ setConfig: no Supabase bot found → saving config to local file");
      await localWriteConfig(uid, config);
      return;
    }

    // Save non-secret fields to bot_configs
    const configRow = {
      bot_id:           resolvedBotId,
      user_id:          uid,
      agent_name:       config.agentName,
      business_name:    config.businessName,
      business_desc:    config.businessDesc,
      business_profile: config.businessProfile,
      tone:             config.tone,
      language:         config.language,
      greeting:         config.greeting,
      extra_instructions: config.extraInstructions,
      use_emojis:       config.useEmojis,
      short_answers:    config.shortAnswers,
      faqs:             config.faqs || [],
      services:         config.services,
      hours:            config.hours,
      location:         config.location,
      full_address:     config.fullAddress,
      phone:            config.phone,
      website:          config.website,
      contact_email:    config.contactEmail,
      price_policy:     config.pricePolicy,
      instagram:        config.instagram,
      facebook:         config.facebook,
      tiktok:           config.tiktok,
      youtube:          config.youtube,
      catalog:          config.catalog || [],
      flow:             config.flow || { mode: "text" },
      appointments:     config.appointments || { enabled: false },
      site_name:        config.siteName,
      favicon_base64:   config.faviconBase64,
      favicon_mime_type: config.faviconMimeType,
      updated_at:       new Date().toISOString(),
    };

    // Remove undefined keys
    Object.keys(configRow).forEach(k => configRow[k] === undefined && delete configRow[k]);

    await db.from("bot_configs").upsert(configRow, { onConflict: "bot_id" });

    // Save encrypted secrets
    const secretRow = {
      bot_id:           resolvedBotId,
      user_id:          uid,
      updated_at:       new Date().toISOString(),
    };
    if (config.accessToken)  secretRow.access_token_enc  = safeEncrypt(config.accessToken);
    if (config.anthropicKey) secretRow.anthropic_key_enc = safeEncrypt(config.anthropicKey);
    if (config.openaiKey)    secretRow.openai_key_enc    = safeEncrypt(config.openaiKey);
    if (config.verifyToken)  secretRow.verify_token      = config.verifyToken;

    if (Object.keys(secretRow).length > 3) { // more than just bot_id + user_id + updated_at
      await db.from("bot_secrets").upsert(secretRow, { onConflict: "bot_id" });
    }

    // Update phone mapping if phone changed
    if (config.phoneNumberId) {
      await setPhoneMapping(config.phoneNumberId, uid, resolvedBotId);
    }

    return;
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) {
    const store = await kv();
    await store.set(`botflow-config:${uid}`, config);
    if (config.phoneNumberId) await setPhoneMapping(config.phoneNumberId, uid);
    return;
  }

  // Local dev — write JSON file
  await localWriteConfig(uid, config);
}

// ═══════════════════════════════════════════════════════════
// BOTS LIST
// ═══════════════════════════════════════════════════════════

export async function getBots(explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    const { data, error } = await db
      .from("bots")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ getBots Supabase error:", error.message, "→ falling back to local file");
      return localReadBots(uid);
    }

    console.log(`✅ getBots: Found ${(data || []).length} bots for user_id: ${uid}`);

    // Map DB row → app format
    return (data || []).map(b => ({
      id:                b.id,
      name:              b.name,
      agentName:         b.agent_name,
      businessName:      b.business_name,
      status:            b.status,
      phoneNumberId:     b.phone_number_id,
      waBusinessId:      b.wa_business_id,
      displayPhone:      b.display_phone,
      messageCount:      b.message_count,
      conversationCount: b.conversation_count,
      createdAt:         b.created_at,
    }));
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) {
    const store = await kv();
    return (await store.get(`botflow-bots:${uid}`)) || [];
  }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    return JSON.parse(fs.readFileSync(path.join(storageDir(), `botflow-bots_${uid}.json`), "utf-8"));
  } catch { return []; }
}

export async function setBots(bots, explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  console.log(`📝 setBots called: ${bots.length} bot(s), uid: ${uid}`);

  if (USE_SUPABASE) {
    const db = supabase();
    let supabaseOk = true;
    // Upsert each bot
    for (const b of bots) {
      const upsertData = {
        id:                b.id,
        user_id:           uid,
        name:              b.name || b.businessName || "Mi Bot",
        agent_name:        b.agentName || "Asistente",
        business_name:     b.businessName,
        status:            b.status || "ACTIVO",
        phone_number_id:   b.phoneNumberId || null,
        wa_business_id:    b.waBusinessId || null,
        display_phone:     b.displayPhone || null,
        message_count:     b.messageCount || 0,
        conversation_count: b.conversationCount || 0,
        updated_at:        new Date().toISOString(),
      };

      // Only set created_at on insert, not on update
      if (b.createdAt) {
        upsertData.created_at = b.createdAt;
      }

      console.log(`💾 Upserting bot:`, JSON.stringify(upsertData));
      const { error } = await db.from("bots").upsert(upsertData, { onConflict: "id" });
      if (error) {
        console.error(`❌ Error upserting bot ${b.id}:`, error.message, error.code);
        supabaseOk = false;
      } else {
        console.log(`✅ Bot upserted: ${b.id}, user_id: ${uid}`);
      }
    }

    if (!supabaseOk) {
      console.warn("⚠️ Supabase unavailable → saving bots to local file as fallback");
      await localWriteBots(uid, bots);
      return;
    }

    // Delete bots no longer in the list
    const ids = bots.map(b => b.id);
    if (ids.length > 0) {
      const deleteRes = await db.from("bots")
        .delete()
        .eq("user_id", uid)
        .not("id", "in", `(${ids.join(",")})`);
      if (deleteRes.error) {
        console.error(`⚠️ Error deleting old bots for user ${uid}:`, deleteRes.error.message);
      }
    }
    return;
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) {
    const store = await kv();
    await store.set(`botflow-bots:${uid}`, bots);
    return;
  }
  const fs   = (await import("fs")).default;
  const path = (await import("path")).default;
  fs.writeFileSync(path.join(storageDir(), `botflow-bots_${uid}.json`), JSON.stringify(bots, null, 2));
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════

export async function getKBIndex(explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    const { data } = await db
      .from("knowledge_files")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    return (data || []).map(f => ({
      id:          f.id,
      name:        f.name,
      type:        f.type,
      size:        f.size,
      date:        new Date(f.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
      status:      f.status,
      textFile:    f.text_file,
      preview:     f.preview,
      isImage:     f.is_image,
      mimeType:    f.mime_type,
      description: f.description || "",
    }));
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) {
    const store = await kv();
    return (await store.get(`kb-index:${uid}`)) || [];
  }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const p    = path.join(storageDir(), "knowledge-base", `index_${uid}.json`);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch { return []; }
}

export async function setKBIndex(index, explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    for (const f of index) {
      await db.from("knowledge_files").upsert({
        id:          f.id,
        user_id:     uid,
        name:        f.name,
        type:        f.type,
        size:        f.size,
        status:      f.status,
        text_file:   f.textFile,
        preview:     f.preview,
        is_image:    f.isImage || false,
        mime_type:   f.mimeType,
        description: f.description || null,
      }, { onConflict: "id" });
    }
    // Remove deleted files
    const ids = index.map(f => f.id);
    if (ids.length > 0) {
      await db.from("knowledge_files")
        .delete()
        .eq("user_id", uid)
        .not("id", "in", `(${ids.join(",")})`);
    } else {
      await db.from("knowledge_files").delete().eq("user_id", uid);
    }
    return;
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); await store.set(`kb-index:${uid}`, index); return; }
  const fs   = (await import("fs")).default;
  const path = (await import("path")).default;
  const dir  = path.join(storageDir(), "knowledge-base");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `index_${uid}.json`), JSON.stringify(index, null, 2));
}

export async function getKBText(key, explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    const { data } = await db
      .from("knowledge_content")
      .select("content")
      .eq("user_id", uid)
      .eq("file_key", key)
      .single();
    return data?.content || null;
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); return (await store.get(`kb:${uid}:${key}`)) || null; }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const p    = path.join(storageDir(), "knowledge-base", `${uid}_${key}`);
    return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : null;
  } catch { return null; }
}

export async function setKBText(key, text, explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);
  // Don't truncate image binary data (base64 can be several MB)
  const safe = key.startsWith("img:") ? text : (text.length > 200_000 ? text.slice(0, 200_000) + "\n[...truncado]" : text);

  if (USE_SUPABASE) {
    const db = supabase();
    await db.from("knowledge_content").upsert(
      { user_id: uid, file_key: key, content: safe },
      { onConflict: "user_id,file_key" }
    );
    return;
  }

  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); await store.set(`kb:${uid}:${key}`, safe); return; }
  const fs   = (await import("fs")).default;
  const path = (await import("path")).default;
  const dir  = path.join(storageDir(), "knowledge-base");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${uid}_${key}`), safe);
}

export async function deleteKBText(key, explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);
  if (USE_SUPABASE) {
    const db = supabase();
    await db.from("knowledge_content").delete().eq("user_id", uid).eq("file_key", key);
    return;
  }
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); await store.del(`kb:${uid}:${key}`); return; }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const p    = path.join(storageDir(), "knowledge-base", `${uid}_${key}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

export async function getAllKBText(explicitId) {
  const index = await getKBIndex(explicitId);
  const processed = index.filter(f => f.status === "PROCESADO" && f.textFile);
  if (processed.length === 0) return "";
  let allText = "";
  for (const file of processed) {
    const content = await getKBText(file.textFile, explicitId);
    if (content) allText += `\n\n${content}`;
  }
  if (allText.length > 40_000) allText = allText.slice(0, 40_000) + "\n\n[...truncado]";
  return allText.trim();
}

// ═══════════════════════════════════════════════════════════
// KNOWLEDGE BASE IMAGES
// ═══════════════════════════════════════════════════════════

export async function setKBImageData(id, { base64, mimeType, filename }, explicitId) {
  // Store image data as a knowledge_content entry with special key
  await setKBText(`img:${id}`, JSON.stringify({ base64, mimeType, filename }), explicitId);
}

export async function getKBImageData(id, explicitId) {
  const raw = await getKBText(`img:${id}`, explicitId);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function deleteKBImageData(id, explicitId) {
  await deleteKBText(`img:${id}`, explicitId);
}

export async function getKBImages(explicitId) {
  const index = await getKBIndex(explicitId);
  return index.filter(f =>
    f.status === "PROCESADO" && (
      f.isImage === true ||
      (f.type && f.type.startsWith("image/")) ||
      (f.mimeType && f.mimeType.startsWith("image/"))
    )
  );
}

// ═══════════════════════════════════════════════════════════
// RAW FILE BUFFER (local dev only — not needed in Supabase)
// ═══════════════════════════════════════════════════════════

export async function saveRawFile(id, buffer, explicitId) {
  if (USE_SUPABASE) return; // In Supabase, files are stored as content
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const uid  = getUid(explicitId);
    const dir  = path.join(storageDir(), "knowledge-base");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uid}_${id}`), buffer);
  } catch {}
}

export async function deleteRawFile(id, explicitId) {
  if (USE_SUPABASE) return;
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const uid  = getUid(explicitId);
    const p    = path.join(storageDir(), "knowledge-base", `${uid}_${id}`);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {}
}

// ═══════════════════════════════════════════════════════════
// CONVERSATIONS
// ═══════════════════════════════════════════════════════════

export async function getConversation(from, explicitId, botId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    let query = db
      .from("conversations")
      .select("messages")
      .eq("user_id", uid)
      .eq("from_phone", from);
    if (botId) query = query.eq("bot_id", botId);
    const { data } = await query.limit(1).single();
    return data?.messages || [];
  }

  // KV fallback
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) {
    const store = await kv();
    return (await store.get(`conv:${uid}:${from}`)) || [];
  }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    const p    = path.join(storageDir(), "knowledge-base", `conv_${uid}_${from}.json`);
    return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf-8")) : [];
  } catch { return []; }
}

export async function setConversation(from, messages, explicitId, botId) {
  const uid     = await getUserIdAndEnsure(explicitId);
  const trimmed = messages.slice(-10);

  if (USE_SUPABASE) {
    const db = supabase();
    await db.from("conversations").upsert(
      {
        user_id:    uid,
        bot_id:     botId || null,
        from_phone: from,
        messages:   trimmed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,bot_id,from_phone" }
    );
    return;
  }

  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) {
    const store = await kv();
    await store.set(`conv:${uid}:${from}`, trimmed, { ex: 60 * 60 * 24 });
    return;
  }
  const fs   = (await import("fs")).default;
  const path = (await import("path")).default;
  const dir  = path.join(storageDir(), "knowledge-base");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `conv_${uid}_${from}.json`), JSON.stringify(trimmed));
}

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════

function emptyAnalytics() {
  return { totalMessages: 0, totalConversations: 0, dailyCounts: {}, recentMessages: [] };
}

export async function getAnalytics(explicitId, botId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();

    // Aggregated counters from analytics table
    let query = db.from("analytics").select("*").eq("user_id", uid);
    if (botId) query = query.eq("bot_id", botId);
    else       query = query.is("bot_id", null);
    const { data } = await query.limit(1).single();

    // Recent messages from message_events (avoids race condition on JSONB column)
    let eventsQuery = db
      .from("message_events")
      .select("from_phone, message, bot_name, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (botId) eventsQuery = eventsQuery.eq("bot_id", botId);
    const { data: events } = await eventsQuery;

    const recentMessages = (events || []).map(e => ({
      from:    e.from_phone,
      message: e.message,
      botName: e.bot_name,
      date:    e.created_at.slice(0, 10),
      time:    e.created_at,
    }));

    if (!data) return { ...emptyAnalytics(), recentMessages };
    return {
      totalMessages:      data.total_messages,
      totalConversations: data.total_conversations,
      dailyCounts:        data.daily_counts || {},
      recentMessages,
    };
  }

  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) {
    const store = await kv();
    return (await store.get(`botflow-analytics:${uid}`)) || emptyAnalytics();
  }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    return JSON.parse(fs.readFileSync(path.join(storageDir(), `botflow-analytics_${uid}.json`), "utf-8"));
  } catch { return emptyAnalytics(); }
}

export async function setAnalytics(data, explicitId, botId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    await db.from("analytics").upsert(
      {
        user_id:             uid,
        bot_id:              botId || null,
        total_messages:      data.totalMessages || 0,
        total_conversations: data.totalConversations || 0,
        daily_counts:        data.dailyCounts || {},
        recent_messages:     data.recentMessages || [],
        updated_at:          new Date().toISOString(),
      },
      { onConflict: "user_id,bot_id" }
    );
    return;
  }

  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); await store.set(`botflow-analytics:${uid}`, data); return; }
  const fs   = (await import("fs")).default;
  const path = (await import("path")).default;
  fs.writeFileSync(path.join(storageDir(), `botflow-analytics_${uid}.json`), JSON.stringify(data, null, 2));
}

export async function trackMessage(from, message, botName, explicitId, botId) {
  const uid   = await getUserIdAndEnsure(explicitId);
  const today = new Date().toISOString().slice(0, 10);

  if (USE_SUPABASE) {
    const db = supabase();

    // Determine if this is a new conversation today (check message_events)
    const { count } = await db
      .from("message_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("bot_id", botId || null)
      .eq("from_phone", from)
      .gte("created_at", `${today}T00:00:00Z`);

    const isNewConv = count === 0;

    // Atomic counter increment — no race condition
    await db.rpc("increment_analytics", {
      p_user_id:     uid,
      p_bot_id:      botId || null,
      p_date:        today,
      p_is_new_conv: isNewConv,
    });

    // Log individual message event (for recent_messages queries)
    await db.from("message_events").insert({
      user_id:    uid,
      bot_id:     botId || null,
      from_phone: from,
      message:    message.slice(0, 120),
      bot_name:   botName,
      is_new_conv: isNewConv,
    });

    return;
  }

  // KV fallback — original read-modify-write (acceptable for single-user KV)
  const analytics = await getAnalytics(explicitId, botId);

  analytics.totalMessages = (analytics.totalMessages || 0) + 1;
  analytics.dailyCounts   = analytics.dailyCounts || {};
  analytics.dailyCounts[today] = (analytics.dailyCounts[today] || 0) + 1;

  const recentMsgs = analytics.recentMessages || [];
  const isNewConv  = !recentMsgs.some(m => m.from === from && m.date === today);
  if (isNewConv) analytics.totalConversations = (analytics.totalConversations || 0) + 1;

  recentMsgs.unshift({ from, message: message.slice(0, 120), botName, date: today, time: new Date().toISOString() });
  analytics.recentMessages = recentMsgs.slice(0, 50);

  await setAnalytics(analytics, explicitId, botId);
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

export async function getSubscription(explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    const { data } = await db
      .from("subscriptions")
      .select("*")
      .eq("user_id", uid)
      .single();
    if (!data) return null;
    return {
      plan:           data.plan,
      status:         data.status,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      currentPeriodEnd: data.current_period_end,
    };
  }

  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); return (await store.get(`subscription:${uid}`)) || null; }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    return JSON.parse(fs.readFileSync(path.join(storageDir(), `subscription_${uid}.json`), "utf-8"));
  } catch { return null; }
}

export async function setSubscription(data, explicitId) {
  const uid = await getUserIdAndEnsure(explicitId);

  if (USE_SUPABASE) {
    const db = supabase();
    await db.from("subscriptions").upsert(
      {
        user_id:                 uid,
        plan:                    data.plan,
        status:                  data.status,
        stripe_customer_id:      data.stripeCustomerId || data.customerId,
        stripe_subscription_id:  data.stripeSubscriptionId || data.subscriptionId,
        current_period_end:      data.currentPeriodEnd,
        updated_at:              new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    return;
  }

  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); await store.set(`subscription:${uid}`, data); return; }
  const fs   = (await import("fs")).default;
  const path = (await import("path")).default;
  fs.writeFileSync(path.join(storageDir(), `subscription_${uid}.json`), JSON.stringify(data, null, 2));
}

export async function getUserIdByStripeCustomer(customerId) {
  if (USE_SUPABASE) {
    const db = supabase();
    const { data } = await db
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .single();
    return data?.user_id || null;
  }
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); return await store.get(`stripe-customer:${customerId}`); }
  try {
    const fs   = (await import("fs")).default;
    const path = (await import("path")).default;
    return JSON.parse(fs.readFileSync(path.join(storageDir(), `stripe-customer_${customerId}.json`), "utf-8")).userId;
  } catch { return null; }
}

export async function setStripeCustomerMapping(customerId, userId) {
  if (USE_SUPABASE) return;
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); await store.set(`stripe-customer:${customerId}`, userId); return; }
  const fs   = (await import("fs")).default;
  const path = (await import("path")).default;
  fs.writeFileSync(path.join(storageDir(), `stripe-customer_${customerId}.json`), JSON.stringify({ userId }));
}

export async function getGlobalLanding() {
  const IS_VERCEL = !!process.env.KV_REST_API_URL;
  if (IS_VERCEL) { const store = await kv(); return (await store.get("botflow-landing")) || {}; }
  try {
    const fs = (await import("fs")).default;
    const path = (await import("path")).default;
    return JSON.parse(fs.readFileSync(path.join(storageDir(), "botflow-landing.json"), "utf-8"));
    } catch { return {}; }
}