#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rvavbkrhxwwwtrxotexm.supabase.co";
const SUPABASE_KEY = "sb_secret_Rc6xmTS2CyFwMccfCPCVg_o0fCGtNf";

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function checkDatabase() {
  try {
    console.log("[*] Checking Supabase database...\n");

    // Check bots table
    console.log("[*] Checking 'bots' table...");
    const { data: bots, error: botsError } = await db
      .from("bots")
      .select("*");

    if (botsError) {
      console.error("[ERROR] Error accessing bots table:", botsError.message);
      console.log("   This might be an RLS issue.\n");
    } else {
      console.log(`[OK] Found ${bots?.length || 0} record(s) in bots table`);
      if (bots && bots.length > 0) {
        console.log("\n   Bot records:");
        bots.forEach(bot => {
          console.log(`   - ID: ${bot.id}`);
          console.log(`     Agent: ${bot.agent_name}`);
          console.log(`     User ID: ${bot.user_id}`);
          console.log(`     Created: ${bot.created_at}`);
        });
      }
      console.log();
    }

    // Check users table
    console.log("[*] Checking 'users' table...");
    const { data: users, error: usersError } = await db
      .from("users")
      .select("*");

    if (usersError) {
      console.error("[ERROR] Error accessing users table:", usersError.message);
    } else {
      console.log(`[OK] Found ${users?.length || 0} record(s) in users table`);
      if (users && users.length > 0) {
        console.log("   User records:");
        users.forEach(user => {
          console.log(`   - ID: ${user.id}, Email: ${user.email}`);
        });
      }
      console.log();
    }

    // Summary
    console.log("=".repeat(60));
    console.log("DIAGNOSIS:");
    console.log("=".repeat(60));
    if (bots && bots.length > 0) {
      console.log("[OK] BOTS ARE SAVED IN DATABASE");
      console.log("[ERROR] BUT RLS POLICIES ARE BLOCKING RETRIEVAL");
      console.log("\nSOLUTION:");
      console.log("1. Go to https://supabase.com/dashboard");
      console.log("2. Open your project");
      console.log("3. Go to SQL Editor");
      console.log("4. Copy and paste SUPABASE_FIX_RLS.sql");
      console.log("5. Click Run");
      console.log("6. Test the app");
    } else {
      console.log("[ERROR] NO BOTS FOUND IN DATABASE");
      console.log("[!] Bots are not being saved, or RLS prevents viewing them");
      console.log("\nNEXT STEP: Run the above SQL fix anyway");
    }
    console.log();

  } catch (err) {
    console.error("[ERROR] Fatal error:", err);
    process.exit(1);
  }
}

checkDatabase();
