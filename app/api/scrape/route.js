import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getKBIndex, setKBIndex, setKBText } from "@/lib/storage";
import * as cheerio from "cheerio";

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

    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36" }
    });

    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status} ${res.statusText}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script, style, noscript, svg, iframe").remove();

    const title = $("title").text().trim();
    const description = $("meta[name='description']").attr("content") || "";
    
    // Get text and clean it
    let text = $("body").text();
    text = text.replace(/\s+/g, " ").trim();

    if (!text) {
      throw new Error("No se pudo extraer texto útil del sitio web");
    }

    const finalContent = `=== SITIO WEB: ${title || targetUrl} ===\nURL: ${targetUrl}\nDescripción: ${description}\n\nCONTENIDO:\n${text}`;

    const filename = targetUrl.replace(/^https?:\/\//i, "").split("/")[0] + ".txt";
    const id = `${Date.now()}-website`;

    const entry = {
      id,
      name: filename,
      type: "Sitio Web",
      size: `${Math.round(finalContent.length / 1024)} KB`,
      date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
      status: "PROCESANDO",
      textFile: null,
    };

    const index = await getKBIndex();
    index.unshift(entry);
    await setKBIndex(index);

    const textFile = `${id}.txt`;
    await setKBText(textFile, finalContent);
    
    const updatedIndex = await getKBIndex();
    const idx = updatedIndex.findIndex(f => f.id === id);
    if (idx !== -1) {
      updatedIndex[idx].status = "PROCESADO";
      updatedIndex[idx].textFile = textFile;
      updatedIndex[idx].preview = text.slice(0, 200).trim();
      await setKBIndex(updatedIndex);
    }

    return NextResponse.json({ success: true, file: entry });
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
