#!/usr/bin/env node
/**
 * backfill-ownership-hmac.js
 * ──────────────────────────
 * Adds hmac_sig to phone_mappings rows that were created before HMAC support.
 * Run once after migration, and again whenever WEBHOOK_SECRET is rotated.
 *
 * Usage:
 *   node scripts/backfill-ownership-hmac.js --dry-run
 *   node scripts/backfill-ownership-hmac.js
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY, WEBHOOK_SECRET
 */

import { createClient } from "@supabase/supabase-js";
import { computeOwnershipHmac } from "../lib/webhookAuth.js";

const DRY_RUN = process.argv.includes("--dry-run");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error("❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  process.exit(1);
}
if (!process.env.WEBHOOK_SECRET) {
  console.error("❌ WEBHOOK_SECRET must be set");
  process.exit(1);
}

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`Backfilling ownership HMACs — mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);

  // Fetch all rows (including those without hmac_sig)
  const { data: rows, error } = await db
    .from("phone_mappings")
    .select("phone_number_id, user_id, hmac_sig");

  if (error) { console.error("❌ Failed to fetch phone_mappings:", error.message); process.exit(1); }

  const needsBackfill = rows.filter(r => !r.hmac_sig);
  console.log(`  Total rows: ${rows.length} | Needs backfill: ${needsBackfill.length}`);

  let updated = 0;
  for (const row of needsBackfill) {
    const hmac = computeOwnershipHmac(row.phone_number_id, row.user_id);
    if (!hmac) { console.warn(`  ⚠️  Could not compute HMAC for ${row.phone_number_id}`); continue; }

    if (!DRY_RUN) {
      const { error: upErr } = await db
        .from("phone_mappings")
        .update({ hmac_sig: hmac })
        .eq("phone_number_id", row.phone_number_id);
      if (upErr) { console.error(`  ❌ Failed to update ${row.phone_number_id}:`, upErr.message); continue; }
    }

    console.log(`  ${DRY_RUN ? "[dry-run]" : "✅"} ${row.phone_number_id} → hmac set`);
    updated++;
  }

  console.log(`\nDone. ${updated} row(s) ${DRY_RUN ? "would be" : "were"} updated.`);
}

main().catch(err => { console.error("💥 Fatal:", err); process.exit(1); });
