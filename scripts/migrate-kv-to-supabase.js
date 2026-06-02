#!/usr/bin/env node
/**
 * migrate-kv-to-supabase.js
 * ─────────────────────────
 * Migrates all existing data from Vercel KV to Supabase.
 *
 * Usage:
 *   node scripts/migrate-kv-to-supabase.js --dry-run   (preview, no writes)
 *   node scripts/migrate-kv-to-supabase.js              (execute migration)
 *
 * Required env vars (copy from .env.local or Vercel):
 *   KV_REST_API_URL, KV_REST_API_TOKEN
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   ENCRYPTION_KEY
 *   WEBHOOK_SECRET (optional — ownership HMACs)
 *
 * Run AFTER applying supabase/schema.sql.
 * Run BEFORE setting USE_SUPABASE=true.
 */

import { createClient as createKV } from "@vercel/kv";
import { createClient as createSupabase } from "@supabase/supabase-js";
import crypto from "crypto";
import { encrypt } from "../lib/crypto.js";
import { computeOwnershipHmac } from "../lib/webhookAuth.js";

// ── Config ────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE  = process.argv.includes("--verbose");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  process.exit(1);
}
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error("❌ KV_REST_API_URL and KV_REST_API_TOKEN must be set");
  process.exit(1);
}
if (!process.env.ENCRYPTION_KEY) {
  console.error("❌ ENCRYPTION_KEY must be set — API keys will not be migrated securely");
  process.exit(1);
}

const kv = createKV({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
const db = createSupabase(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const stats = {
  users: 0, bots: 0, configs: 0, secrets: 0,
  phoneMappings: 0, kb: 0, conversations: 0,
  analytics: 0, subscriptions: 0, errors: [],
};

function log(msg) { console.log(`  ${msg}`); }
function logVerbose(msg) { if (VERBOSE) console.log(`    [verbose] ${msg}`); }
function logError(msg, err) {
  const detail = `${msg}: ${err?.message || err}`;
  console.error(`  ❌ ${detail}`);
  stats.errors.push(detail);
}

// ── Helpers ───────────────────────────────────────────────────

async function kvScan(pattern) {
  // Scan all keys matching pattern (Vercel KV uses SCAN under the hood)
  const keys = [];
  let cursor = 0;
  do {
    const [nextCursor, batch] = await kv.scan(cursor, { match: pattern, count: 100 });
    keys.push(...batch);
    cursor = nextCursor;
  } while (cursor !== 0);
  return keys;
}

function extractUserId(key, prefix) {
  return key.slice(prefix.length); // e.g. "botflow-config:user_abc" → "user_abc"
}

async function upsertUser(userId, email) {
  if (DRY_RUN) { log(`[dry-run] Would upsert user: ${userId}`); return; }
  const { error } = await db.from("users").upsert(
    { id: userId, email: email || null, updated_at: new Date().toISOString() },
    { onConflict: "id" }
  );
  if (error) throw error;
}

// ── Migration steps ───────────────────────────────────────────

async function migrateConfigs() {
  console.log("\n📋 Migrating bot configs...");
  const keys = await kvScan("botflow-config:*");
  log(`Found ${keys.length} config key(s)`);

  for (const key of keys) {
    const userId = extractUserId(key, "botflow-config:");
    try {
      const config = await kv.get(key);
      if (!config) { logVerbose(`Empty config for ${userId}, skipping`); continue; }

      // Ensure user row exists
      if (!DRY_RUN) await upsertUser(userId, config.email);
      stats.users++;

      // Find or create a bot for this user (KV had one bot per user)
      const botId = config.botId || `bot-migrated-${userId}`;

      if (!DRY_RUN) {
        // Create bot row
        const { error: botErr } = await db.from("bots").upsert({
          id:             botId,
          user_id:        userId,
          name:           config.businessName || "Mi Bot",
          agent_name:     config.agentName || "Asistente",
          business_name:  config.businessName,
          status:         "ACTIVO",
          phone_number_id: config.phoneNumberId || null,
          wa_business_id: config.waBusinessId || null,
          display_phone:  config.displayPhone || null,
          message_count:  0,
          conversation_count: 0,
        }, { onConflict: "id" });
        if (botErr) throw botErr;

        // Create bot_config row (non-sensitive fields)
        const { error: cfgErr } = await db.from("bot_configs").upsert({
          bot_id:           botId,
          user_id:          userId,
          agent_name:       config.agentName,
          business_name:    config.businessName,
          business_desc:    config.businessDesc,
          business_profile: config.businessProfile,
          tone:             config.tone,
          language:         config.language,
          greeting:         config.greeting,
          extra_instructions: config.extraInstructions,
          use_emojis:       config.useEmojis ?? true,
          short_answers:    config.shortAnswers ?? true,
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
        }, { onConflict: "bot_id" });
        if (cfgErr) throw cfgErr;

        // Create bot_secrets row (sensitive fields — encrypted)
        const secretRow = { bot_id: botId, user_id: userId };
        if (config.accessToken)  secretRow.access_token_enc  = encrypt(config.accessToken);
        if (config.anthropicKey) secretRow.anthropic_key_enc = encrypt(config.anthropicKey);
        if (config.openaiKey)    secretRow.openai_key_enc    = encrypt(config.openaiKey);
        if (config.verifyToken)  secretRow.verify_token      = config.verifyToken;

        if (Object.keys(secretRow).length > 2) {
          const { error: secErr } = await db.from("bot_secrets").upsert(secretRow, { onConflict: "bot_id" });
          if (secErr) throw secErr;
          stats.secrets++;
        }
      }

      log(`✅ User ${userId} → bot ${botId}`);
      stats.bots++;
      stats.configs++;
    } catch (err) {
      logError(`Failed to migrate config for ${userId}`, err);
    }
  }
}

async function migrateBotLists() {
  console.log("\n🤖 Migrating bot lists...");
  const keys = await kvScan("botflow-bots:*");
  log(`Found ${keys.length} bot list key(s)`);

  for (const key of keys) {
    const userId = extractUserId(key, "botflow-bots:");
    try {
      const bots = await kv.get(key);
      if (!Array.isArray(bots) || bots.length === 0) continue;

      for (const b of bots) {
        if (!DRY_RUN) {
          await upsertUser(userId);
          const { error } = await db.from("bots").upsert({
            id:                b.id,
            user_id:           userId,
            name:              b.name || b.businessName || "Mi Bot",
            agent_name:        b.agentName || "Asistente",
            business_name:     b.businessName,
            status:            b.status || "ACTIVO",
            phone_number_id:   b.phoneNumberId || null,
            wa_business_id:    b.waBusinessId || null,
            display_phone:     b.displayPhone || null,
            message_count:     b.messageCount || 0,
            conversation_count: b.conversationCount || 0,
          }, { onConflict: "id" });
          if (error) throw error;
        }
        log(`✅ Bot ${b.id} for user ${userId}`);
        stats.bots++;
      }
    } catch (err) {
      logError(`Failed to migrate bots for ${userId}`, err);
    }
  }
}

async function migratePhoneMappings() {
  console.log("\n📞 Migrating phone mappings...");
  const keys = await kvScan("wa-phone:*");
  log(`Found ${keys.length} phone mapping(s)`);

  for (const key of keys) {
    const phoneId = key.slice("wa-phone:".length);
    try {
      const val = await kv.get(key);
      if (!val) continue;
      const userId = typeof val === "string" ? val : val.userId;
      const botId  = typeof val === "object" ? val.botId : null;
      if (!userId) continue;

      const hmacSig = computeOwnershipHmac(phoneId, userId);

      if (!DRY_RUN) {
        const { error } = await db.from("phone_mappings").upsert({
          phone_number_id: phoneId,
          user_id:         userId,
          bot_id:          botId || null,
          hmac_sig:        hmacSig,
        }, { onConflict: "phone_number_id" });
        if (error) throw error;
      }

      log(`✅ Phone ${phoneId} → user ${userId} bot ${botId || "(none)"}`);
      stats.phoneMappings++;
    } catch (err) {
      logError(`Failed to migrate phone mapping ${phoneId}`, err);
    }
  }
}

async function migrateKnowledgeBase() {
  console.log("\n📚 Migrating knowledge base...");
  const indexKeys = await kvScan("kb-index:*");
  log(`Found ${indexKeys.length} KB index(es)`);

  for (const key of indexKeys) {
    const userId = extractUserId(key, "kb-index:");
    try {
      const index = await kv.get(key);
      if (!Array.isArray(index)) continue;

      for (const f of index) {
        if (!DRY_RUN) {
          await db.from("knowledge_files").upsert({
            id:        f.id,
            user_id:   userId,
            name:      f.name,
            type:      f.type,
            size:      f.size,
            status:    f.status,
            text_file: f.textFile,
            preview:   f.preview,
            is_image:  f.isImage || false,
            mime_type: f.mimeType,
          }, { onConflict: "id" });

          // Migrate content if available
          if (f.textFile) {
            const content = await kv.get(`kb:${userId}:${f.textFile}`);
            if (content) {
              await db.from("knowledge_content").upsert(
                { user_id: userId, file_key: f.textFile, content: String(content) },
                { onConflict: "user_id,file_key" }
              );
            }
          }
        }
        logVerbose(`KB file: ${f.name} (${f.id})`);
        stats.kb++;
      }
      log(`✅ KB for user ${userId}: ${index.length} file(s)`);
    } catch (err) {
      logError(`Failed to migrate KB for ${userId}`, err);
    }
  }
}

async function migrateConversations() {
  console.log("\n💬 Migrating conversations...");
  const keys = await kvScan("conv:*");
  log(`Found ${keys.length} conversation(s)`);

  for (const key of keys) {
    // Key format: conv:<userId>:<fromPhone>
    const parts = key.split(":");
    if (parts.length < 3) continue;
    const userId    = parts[1];
    const fromPhone = parts.slice(2).join(":"); // phone might contain ":"

    try {
      const messages = await kv.get(key);
      if (!Array.isArray(messages) || messages.length === 0) continue;

      if (!DRY_RUN) {
        const { error } = await db.from("conversations").upsert({
          user_id:    userId,
          bot_id:     null, // KV didn't track bot_id in conv key
          from_phone: fromPhone,
          messages:   messages.slice(-10),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: "user_id,bot_id,from_phone" });
        if (error) throw error;
      }

      logVerbose(`Conv ${userId}/${fromPhone}: ${messages.length} message(s)`);
      stats.conversations++;
    } catch (err) {
      logError(`Failed to migrate conversation ${key}`, err);
    }
  }
  log(`✅ Migrated ${stats.conversations} conversation(s)`);
}

async function migrateSubscriptions() {
  console.log("\n💳 Migrating subscriptions...");
  const keys = await kvScan("subscription:*");
  log(`Found ${keys.length} subscription(s)`);

  for (const key of keys) {
    const userId = extractUserId(key, "subscription:");
    try {
      const sub = await kv.get(key);
      if (!sub) continue;

      if (!DRY_RUN) {
        await upsertUser(userId);
        const { error } = await db.from("subscriptions").upsert({
          user_id:                userId,
          stripe_customer_id:     sub.stripeCustomerId || sub.customerId,
          stripe_subscription_id: sub.stripeSubscriptionId || sub.subscriptionId,
          plan:                   sub.plan || "free",
          status:                 sub.status,
          current_period_end:     sub.currentPeriodEnd,
        }, { onConflict: "user_id" });
        if (error) throw error;
      }

      log(`✅ Subscription for user ${userId}: plan=${sub.plan}`);
      stats.subscriptions++;
    } catch (err) {
      logError(`Failed to migrate subscription for ${userId}`, err);
    }
  }
}

async function verifyMigration() {
  if (DRY_RUN) return;
  console.log("\n🔍 Verifying migration...");

  const { count: userCount } = await db.from("users").select("id", { count: "exact", head: true });
  const { count: botCount }  = await db.from("bots").select("id", { count: "exact", head: true });
  const { count: cfgCount }  = await db.from("bot_configs").select("id", { count: "exact", head: true });
  const { count: secCount }  = await db.from("bot_secrets").select("id", { count: "exact", head: true });
  const { count: convCount } = await db.from("conversations").select("id", { count: "exact", head: true });
  const { count: subCount }  = await db.from("subscriptions").select("id", { count: "exact", head: true });

  console.log(`\n  Supabase row counts:`);
  console.log(`    users:          ${userCount}`);
  console.log(`    bots:           ${botCount}`);
  console.log(`    bot_configs:    ${cfgCount}`);
  console.log(`    bot_secrets:    ${secCount}`);
  console.log(`    conversations:  ${convCount}`);
  console.log(`    subscriptions:  ${subCount}`);
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("═".repeat(60));
  console.log(`  AGENTFLOW: KV → Supabase Migration`);
  console.log(`  Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE — data will be written"}`);
  console.log("═".repeat(60));

  if (!DRY_RUN) {
    console.log("\n⚠️  This will write to Supabase. Press Ctrl+C within 5 seconds to abort.");
    await new Promise(r => setTimeout(r, 5000));
  }

  await migrateConfigs();
  await migrateBotLists();
  await migratePhoneMappings();
  await migrateKnowledgeBase();
  await migrateConversations();
  await migrateSubscriptions();
  await verifyMigration();

  console.log("\n" + "═".repeat(60));
  console.log("  Migration Summary");
  console.log("═".repeat(60));
  console.log(`  Users:          ${stats.users}`);
  console.log(`  Bots:           ${stats.bots}`);
  console.log(`  Configs:        ${stats.configs}`);
  console.log(`  Secrets:        ${stats.secrets} (encrypted)`);
  console.log(`  Phone mappings: ${stats.phoneMappings}`);
  console.log(`  KB files:       ${stats.kb}`);
  console.log(`  Conversations:  ${stats.conversations}`);
  console.log(`  Subscriptions:  ${stats.subscriptions}`);
  console.log(`  Errors:         ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n  ❌ Errors:");
    stats.errors.forEach(e => console.log(`     • ${e}`));
    console.log("\n  Fix the errors above before activating USE_SUPABASE=true");
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log("\n  ✅ Dry run complete. Run without --dry-run when ready.");
  } else {
    console.log("\n  ✅ Migration complete!");
    console.log("\n  Next steps:");
    console.log("    1. Run: node scripts/backfill-ownership-hmac.js");
    console.log("    2. Set USE_SUPABASE=true in Vercel env vars");
    console.log("    3. Deploy and monitor logs for 30 minutes");
  }
}

main().catch(err => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
