import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getConfig, getAllKBText } from "@/lib/storage";
import { rateLimitRoute } from "@/lib/rateLimit";

export async function POST(request) {
  if (rateLimitRoute(request, "chat", { max: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
  }
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const config    = await getConfig(userId);
    const knowledge = await getAllKBText(userId);

    if (!config.anthropicKey) {
      return NextResponse.json({ reply: "Configura tu Anthropic API Key en Settings." });
    }

    const agentName    = config.agentName    || "Asistente";
    const businessName = config.businessName || "tu negocio";
    const tone         = config.tone         || "amigable";
    const toneMap = {
      amigable: "amigable y cercano", profesional: "profesional y formal",
      energetico: "energetico y entusiasta", empatico: "empatico y calido",
      directo: "directo y conciso",
    };

    let system = `Eres ${agentName}, el asistente virtual de ${businessName}. Tono: ${toneMap[tone] || tone}.`;
    if (config.businessDesc)    system += `\nDescripcion: ${config.businessDesc}`;
    if (config.services)        system += `\nServicios: ${config.services}`;
    if (config.hours)           system += `\nHorario: ${config.hours}`;
    if (config.location)        system += `\nUbicacion: ${config.location}`;
    if (config.greeting)        system += `\nSaludo: "${config.greeting}"`;
    if (knowledge) system += `\n\nBASE DE CONOCIMIENTOS:\n${knowledge.slice(0, 30000)}`;
    system += "\nResponde de forma natural y breve (maximo 4 oraciones). Esto es un chat de prueba.";

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
    const reply = data.content?.[0]?.text || "Hola, en que te puedo ayudar?";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
