import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getConfig, getAllKBText } from "@/lib/storage";

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

    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const config    = await getConfig();
    const knowledge = await getAllKBText();

    if (!config.anthropicKey) {
      return NextResponse.json({ reply: "⚠️ Configura tu Anthropic API Key en Settings → WhatsApp." });
    }

    const agentName    = config.agentName    || "Asistente";
    const businessName = config.businessName || "tu negocio";
    const tone         = config.tone         || "amigable";

    const toneMap = {
      amigable: "amigable y cercano", profesional: "profesional y formal",
      energético: "energético y entusiasta", empático: "empático y cálido",
      directo: "directo y conciso",
    };

    let system = `Eres ${agentName}, el asistente virtual de ${businessName}. Tono: ${toneMap[tone] || tone}.`;
    if (config.businessDesc)    system += `\nDescripción: ${config.businessDesc}`;
    if (config.businessProfile) system += `\nPerfil: ${config.businessProfile}`;
    if (config.services)        system += `\nServicios: ${config.services}`;
    if (config.hours)           system += `\nHorario: ${config.hours}`;
    if (config.location)        system += `\nUbicación: ${config.location}`;
    if (config.pricePolicy)     system += `\nPrecios: ${config.pricePolicy}`;
    if (config.greeting)        system += `\nSaludo: "${config.greeting}"`;

    if (config.catalog?.length) {
      system += "\n\nCATÁLOGO:";
      config.catalog.filter(c => c.name).forEach(c => {
        system += `\n• ${c.name}${c.price ? ` — ${c.price}` : ""}${c.description ? `: ${c.description}` : ""}`;
      });
    }

    if (knowledge) system += `\n\nBASE DE CONOCIMIENTOS:\n${knowledge.slice(0, 30000)}`;

    system += "\nResponde de forma natural y breve (máximo 4 oraciones). Esto es un chat de prueba desde el panel de administración.";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text || "No pude generar una respuesta.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat test error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
