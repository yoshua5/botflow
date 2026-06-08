import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rvavbkrhxwwwtrxotexm.supabase.co";
const SUPABASE_KEY = "sb_secret_Rc6xmTS2CyFwMccfCPCVg_o0fCGtNf";

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

async function test() {
  try {
    console.log("Testing Supabase connection...\n");

    // Test: Fetch bots with email user_id
    console.log("Fetching bots with user_id = 'yoshualeisorek17@gmail.com':");
    const { data: bots, error: botsError } = await db
      .from("bots")
      .select("*")
      .eq("user_id", "yoshualeisorek17@gmail.com");

    if (botsError) {
      console.error("ERROR:", botsError.message);
      console.error("Code:", botsError.code);
    } else {
      console.log(`Found ${bots?.length || 0} bots`);
      if (bots && bots.length > 0) {
        bots.forEach((b) => {
          console.log(`- ${b.id}: ${b.agent_name}`);
        });
      }
    }

    // Test: Fetch ALL bots
    console.log("\nFetching ALL bots (no filter):");
    const { data: allBots, error: allError } = await db
      .from("bots")
      .select("id, user_id, agent_name");

    if (allError) {
      console.error("ERROR:", allError.message);
    } else {
      console.log(`Found ${allBots?.length || 0} total bots`);
      if (allBots && allBots.length > 0) {
        allBots.forEach((b) => {
          console.log(`- ${b.id}: ${b.agent_name} (user_id: ${b.user_id})`);
        });
      }
    }

  } catch (err) {
    console.error("Fatal error:", err.message);
  }
}

test();
