const SUPABASE_URL = "https://rvavbkrhxwwwtrxotexm.supabase.co";
const SUPABASE_KEY = "sb_secret_Rc6xmTS2CyFwMccfCPCVg_o0fCGtNf";

async function verify() {
  try {
    // Check bots with email user_id
    const botsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/bots?user_id=eq.yoshualeisorek17@gmail.com&select=*`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    const bots = await botsRes.json();
    console.log("Bots found with email user_id:", bots.length);
    if (Array.isArray(bots)) {
      bots.forEach(b => console.log(`  - ${b.id}: ${b.agent_name}`));
    } else {
      console.log("Response:", bots);
    }

    // Check all bots
    const allBotsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/bots?select=id,user_id,agent_name`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    const allBots = await allBotsRes.json();
    console.log("\nTotal bots:", allBots.length);
    if (Array.isArray(allBots)) {
      allBots.forEach(b => console.log(`  - ${b.id}: ${b.agent_name} (${b.user_id})`));
    }

  } catch (err) {
    console.error("Error:", err.message);
  }
}

verify();
