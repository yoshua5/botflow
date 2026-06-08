const SUPABASE_URL = "https://rvavbkrhxwwwtrxotexm.supabase.co";
const SUPABASE_KEY = "sb_secret_Rc6xmTS2CyFwMccfCPCVg_o0fCGtNf";

async function checkBots() {
  try {
    console.log("Checking bots table...");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/bots?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Bots found:", data.length);

    if (data.length > 0) {
      console.log("\nBots in database:");
      data.forEach(bot => {
        console.log(`- ${bot.id}: ${bot.agent_name} (user: ${bot.user_id})`);
      });
    } else {
      console.log("No bots found - possible RLS issue or bots not saved");
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkBots();
