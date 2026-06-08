import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getConfig } from "@/lib/storage";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { url, businessName, anthropicKey: keyFromBody } = await request.json();
    if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

    const config = await getConfig();
    const apiKey = keyFromBody || config.anthropicKey;
    if (!apiKey) return NextResponse.json({ error: "missing_key" }, { status: 400 });

    // 1) Normalize URL
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;

    // 2) Scrape the website
    let scrapedText = "";
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();

      // Parse with cheerio
      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);
      $("script, style, noscript, svg, iframe, nav, footer, header").remove();

      const title = $("title").text().trim();
      const metaDesc = $("meta[name='description']").attr("content") || "";
      let bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000);

      scrapedText = `Nombre del sitio: ${title}\nDescripción meta: ${metaDesc}\n\nContenido:\n${bodyText}`;
    } catch (e) {
      return NextResponse.json({ error: `No se pudo leer el sitio: ${e.message}` }, { status: 400 });
    }

    // 3) Ask Claude to extract structured info
    const prompt = `Analiza el siguiente contenido de un sitio web y extrae información para configurar un agente de WhatsApp para el negocio llamado "${businessName}".

CONTENIDO DEL SITIO WEB:
${scrapedText}

Devuelve ÚNICAMENTE un JSON válido con estos campos (sin markdown, sin texto extra):
{
  "businessDesc": "descripción del negocio en 1-2 oraciones",
  "purpose": "para qué serviría el agente (ej: responder preguntas, agendar citas, tomar pedidos)",
  "agentName": "nombre sugerido para el agente (nombre simple, ej: Sofia, Max, Ana)",
  "tone": "amigable | profesional | vendedor | empático (elige el más apropiado según el negocio)",
  "hours": "horario de atención si está en el sitio, sino 'Lunes a Viernes 9am-6pm'",
  "location": "ciudad/país si está en el sitio, sino 'No especificada'",
  "services": "lista de servicios o productos principales separados por coma",
  "faqs": "2-3 preguntas frecuentes probables para este negocio con sus respuestas",
  "extraInstructions": "instrucciones especiales adicionales relevantes para el bot"
}`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || "Error Claude API");

    const rawText = aiData.content?.[0]?.text || "{}";

    // Parse JSON from Claude response
    let answers;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      answers = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la respuesta de IA" }, { status: 500 });
    }

    return NextResponse.json({ success: true, answers, url: targetUrl });
  } catch (err) {
    console.error("Autofill error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
