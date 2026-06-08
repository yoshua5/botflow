import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getKBIndex, setKBIndex, setKBText } from "@/lib/storage";
import { rateLimitRoute } from "@/lib/rateLimit";
import * as cheerio from "cheerio";

export async function POST(request) {
  if (rateLimitRoute(request, "scrape", { max: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Espera un momento." }, { status: 429 });
  }
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

    const body = await request.json();
    const url = (body?.url || "").trim();
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    // Input size guard
    if (url.length > 2048) return NextResponse.json({ error: "URL too long" }, { status: 400 });

    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    // ── SSRF protection: block private/internal IP ranges ──────
    let parsedUrl;
    try { parsedUrl = new URL(targetUrl); } catch {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }
    const hostname = parsedUrl.hostname.toLowerCase();
    // Block private IPs, localhost, cloud metadata endpoints
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^0\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,         // AWS/GCP/Azure metadata
      /^::1$/,               // IPv6 localhost
      /^fc00:/,              // IPv6 private
      /^fe80:/,              // IPv6 link-local
      /metadata\.google\.internal/,
      /metadata\.azure\.internal/,
    ];
    if (blockedPatterns.some(p => p.test(hostname))) {
      return NextResponse.json({ error: "URL no permitida" }, { status: 400 });
    }
    // Force HTTPS only
    if (parsedUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Solo se permiten URLs HTTPS" }, { status: 400 });
    }

    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Botflow/1.0 (+https://agentflow.com.mx)" },
      signal: AbortSignal.timeout(10000), // 10s timeout
      redirect: "follow",
    });

    // Check redirect destination isn't internal
    if (res.url) {
      try {
        const redirectHost = new URL(res.url).hostname.toLowerCase();
        if (blockedPatterns.some(p => p.test(redirectHost))) {
          return NextResponse.json({ error: "URL no permitida" }, { status: 400 });
        }
      } catch { /* ignore */ }
    }

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status} ${res.statusText}`);
    }

    // Limit response size to 2MB
    const contentLength = parseInt(res.headers.get("content-length") || "0");
    if (contentLength > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Pagina demasiado grande" }, { status: 400 });
    }
    const html = await res.text();
    if (html.length > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Pagina demasiado grande" }, { status: 400 });
    }

    const $ = cheerio.load(html);
    $("script, style, noscript, svg, iframe").remove();
    const title = $("title").text().trim();
    const description = $("meta[name='description']").attr("content") || "";
    let text = $("body").text().replace(/\s+/g, " ").trim();
    if (!text) throw new Error("No se pudo extraer texto util del sitio web");

    const finalContent = `=== SITIO WEB: ${title || targetUrl} ===\nURL: ${targetUrl}\nDescripcion: ${description}\n\nCONTENIDO:\n${text}`;
    const filename = targetUrl.replace(/^https?:\/\//i, "").split("/")[0] + ".txt";
    const id = `${Date.now()}-website`;

    const entry = {
      id, name: filename, type: "Sitio Web",
      size: `${Math.round(finalContent.length / 1024)} KB`,
      date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
      status: "PROCESANDO", textFile: null,
    };

    const index = await getKBIndex(userId);
    index.unshift(entry);
    await setKBIndex(index, userId);

    const textFile = `${id}.txt`;
    await setKBText(textFile, finalContent, userId);

    const updatedIndex = await getKBIndex(userId);
    const idx = updatedIndex.findIndex(f => f.id === id);
    if (idx !== -1) {
      updatedIndex[idx].status = "PROCESADO";
      updatedIndex[idx].textFile = textFile;
      updatedIndex[idx].preview = text.slice(0, 200).trim();
      await setKBIndex(updatedIndex, userId);
    }

    return NextResponse.json({ success: true, file: entry });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
