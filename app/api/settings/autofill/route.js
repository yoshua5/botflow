import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL requerida" }, { status: 400 });

    const config = await getConfig();
    const apiKey = config.anthropicKey;
    if (!apiKey) return NextResponse.json({ error: "missing_key" }, { status: 400 });

    // Normalize URL
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) targetUrl = "https://" + targetUrl;

    // Scrape the website
    let scrapedText = "";
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(12000),
      });
      const html = await res.text();
      const cheerio = await import("cheerio");
      const $ = cheerio.load(html);
      $("script, style, noscript, svg, iframe, nav, footer, header").remove();

      const title    = $("title").text().trim();
      const metaDesc = $("meta[name='description']").attr("content") || "";
      let bodyText   = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000);

      scrapedText = `Nombre del sitio: ${title}\nDescripción meta: ${metaDesc}\n\nContenido:\n${bodyText}`;
    } catch (e) {
      return NextResponse.json({ error: `No se pudo leer el sitio: ${e.message}` }, { status: 400 });
    }

    // Ask Claude to extract structured business profile info
    const prompt = `Analiza el siguiente contenido de un sitio web y extrae información para completar el perfil de negocio.

CONTENIDO DEL SITIO WEB:
${scrapedText}

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin texto extra):
{
  "businessProfile": "descripción detallada del negocio en 3-5 oraciones, qué ofrecen, qué los diferencia",
  "businessDesc": "descripción corta del negocio en 1-2 oraciones",
  "services": "lista de servicios o productos principales separados por coma",
  "hours": "horario de atención si está en el sitio, sino ''",
  "fullAddress": "dirección completa si está en el sitio, sino ''",
  "phone": "teléfono o WhatsApp si está en el sitio, sino ''",
  "location": "ciudad/país si se puede inferir, sino ''",
  "pricePolicy": "política de precios o condiciones de pago si está mencionado, sino ''",
  "contactEmail": "email de contacto si está en el sitio, sino ''",
  "instagram": "handle de Instagram (@...) si está en el sitio, sino ''",
  "facebook": "URL o nombre de Facebook si está en el sitio, sino ''",
  "agentName": "nombre sugerido para el asistente virtual (nombre simple como Sofia, Max, Ana)",
  "tone": "amigable | profesional | energético | empático | directo (elige el más apropiado)"
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
    let fields;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      fields = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      return NextResponse.json({ error: "No se pudo procesar la respuesta de IA" }, { status: 500 });
    }

    return NextResponse.json({ success: true, fields, url: targetUrl });
  } catch (err) {
    console.error("Settings autofill error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
