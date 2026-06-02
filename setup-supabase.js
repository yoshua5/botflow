#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

const ENV_PATH = path.join(__dirname, ".env.local");
const SQL_PATH = path.join(__dirname, "SUPABASE_RLS_SETUP.sql");

async function main() {
  console.log("\n🔐 BOTFLOW SUPABASE SETUP\n");
  console.log("This script will:\n");
  console.log("1. Read your Supabase credentials");
  console.log("2. Update .env.local with real values");
  console.log("3. Show you the SQL to execute in Supabase");
  console.log("\n" + "=".repeat(60) + "\n");

  // Step 1: Get Supabase credentials
  console.log("📋 STEP 1: Get your Supabase credentials\n");
  console.log("Go to: https://supabase.com");
  console.log("1. Log in and select your 'botflow' project");
  console.log("2. Click Settings (bottom left) → API tab");
  console.log("3. Copy the following values:\n");

  const supabaseUrl = await question(
    "Enter SUPABASE_URL (e.g., https://abc123.supabase.co): "
  );
  if (!supabaseUrl.includes("supabase.co")) {
    console.log("❌ Invalid URL format. Must contain 'supabase.co'");
    process.exit(1);
  }

  const serviceKey = await question(
    "Enter SUPABASE_SERVICE_KEY (long JWT starting with eyJ...): "
  );
  if (!serviceKey.startsWith("eyJ")) {
    console.log("❌ Invalid Service Key format. Must start with 'eyJ'");
    process.exit(1);
  }

  // Step 2: Optional Meta credentials
  console.log("\n📋 STEP 2: Meta/WhatsApp credentials (optional)\n");
  const metaSecret = await question(
    "Enter META_APP_SECRET (or press Enter to skip): "
  );
  const waToken = await question(
    "Enter WA_VERIFY_TOKEN (or press Enter to skip): "
  );

  // Step 3: Update .env.local
  console.log("\n⚙️  STEP 3: Updating .env.local...\n");

  let envContent = fs.readFileSync(ENV_PATH, "utf-8");

  envContent = envContent.replace(
    /SUPABASE_URL=.*/,
    `SUPABASE_URL=${supabaseUrl}`
  );
  envContent = envContent.replace(
    /SUPABASE_SERVICE_KEY=.*/,
    `SUPABASE_SERVICE_KEY=${serviceKey}`
  );

  if (metaSecret) {
    envContent = envContent.replace(
      /META_APP_SECRET=.*/,
      `META_APP_SECRET=${metaSecret}`
    );
  }

  if (waToken) {
    envContent = envContent.replace(
      /WA_VERIFY_TOKEN=.*/,
      `WA_VERIFY_TOKEN=${waToken}`
    );
  }

  fs.writeFileSync(ENV_PATH, envContent);
  console.log("✅ .env.local updated successfully\n");

  // Step 4: Show SQL to execute
  console.log("⚙️  STEP 4: SQL to execute in Supabase\n");
  console.log("Now you need to execute the RLS policies in Supabase.\n");
  console.log("1. Go to your Supabase dashboard");
  console.log("2. Click SQL Editor (left sidebar)");
  console.log("3. Click 'New Query'");
  console.log("4. Copy & paste the SQL from below:");
  console.log("\n" + "=".repeat(60) + "\n");

  const sqlContent = fs.readFileSync(SQL_PATH, "utf-8");
  console.log(sqlContent);

  console.log("\n" + "=".repeat(60) + "\n");
  console.log("5. Click 'Run' button (top right)");
  console.log("6. Wait for ✅ Success\n");

  // Step 5: Next steps
  console.log("🎯 NEXT STEPS:\n");
  console.log("1. Execute the SQL above in Supabase SQL Editor");
  console.log("2. Run locally: npm run dev");
  console.log("3. Check browser console for any SUPABASE errors");
  console.log("4. Add env vars to Vercel:");
  console.log("   - Go to vercel.com → your project → Settings → Environment Variables");
  console.log("   - Add: SUPABASE_URL, SUPABASE_SERVICE_KEY, ENCRYPTION_KEY, WEBHOOK_SECRET, USE_SUPABASE");
  console.log("5. Deploy: git push to main");
  console.log("6. Test multi-tenancy: Create bots with 2 different users\n");

  console.log("✨ Setup complete! Run 'npm run dev' to start.\n");

  rl.close();
}

main().catch(console.error);
