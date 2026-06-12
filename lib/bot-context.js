"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const BotContext = createContext({ selectedBot: null, setSelectedBot: () => {}, bots: [], loadBots: () => {} });

export function BotProvider({ children }) {
  const [bots, setBots]               = useState([]);
  const [selectedBot, _setSelectedBot] = useState(null);

  const loadBots = useCallback(async () => {
    try {
      const r = await fetch("/api/bots");
      const d = await r.json();
      const list = d.bots || [];
      setBots(list);

      // Restore or pick first
      const stored = typeof window !== "undefined" ? localStorage.getItem("selectedBotId") : null;
      const found  = stored ? list.find(b => b.id === stored) : null;
      _setSelectedBot(found || list[0] || null);
    } catch {}
  }, []);

  useEffect(() => { loadBots(); }, [loadBots]);

  function setSelectedBot(bot) {
    _setSelectedBot(bot);
    if (typeof window !== "undefined") {
      bot ? localStorage.setItem("selectedBotId", bot.id) : localStorage.removeItem("selectedBotId");
    }
  }

  return (
    <BotContext.Provider value={{ selectedBot, setSelectedBot, bots, loadBots }}>
      {children}
    </BotContext.Provider>
  );
}

export function useBotContext() {
  return useContext(BotContext);
}
