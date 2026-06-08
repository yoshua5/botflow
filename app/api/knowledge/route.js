import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getConfig,
  getKBIndex, setKBIndex,
  getKBText,  setKBText, deleteKBText,
  saveRawFile, deleteRawFile,
  setKBImageData, deleteKBImageData,
} from "@/lib/storage";

// ── Claude extraction: PDFs and images ────────────────────
async function extractWithClaude(buffer, mimeType, filename, anthropicKey) {
  if (!anthropicKey) {
    console.error("❌ extractWithClaude: anthropicKey vacío");
    return null;
  }

  const base64   = buffer.toString("base64");
  const isImage  = mimeType.startsWith("image/");
  const isPDF    = mimeType === "application/pdf";
  if (!isImage && !isPDF) return null;

  const prompt = `Extrae y transcribe TODO el texto de este archivo llamado "${filename}". Incluye todos los datos, precios, información importante. Sé completo y preciso. Solo devuelve el texto extraído, sin comentarios adicionales.`;

  const baseHeaders = {
    "Content-Type":    "application/json",
    "x-api-key":       anthropicKey,
    "anthropic-version": "2023-06-01",
  };

  const contentBlock = isPDF
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image",    source: { type: "base64", media_type: mimeType, data: base64 } };

  const makeRequest = async (headers) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        messages: [{ role: "user", content: [contentBlock, { type: "text", text: prompt }] }],
      }),
    });
    return res.json();
  };

  try {
    let data;
    if (isPDF) {
      data = await makeRequest(baseHeaders);
      if (data.error) {
        console.log("⚠️ PDF sin beta header falló, reintentando con beta...");
        data = await makeRequest({ ...baseHeaders, "anthropic-beta": "pdfs-2024-09-25" });
      }
    } else {
      data = await makeRequest(baseHeaders);
    }

    if (data.error) {
      console.error("❌ Claude extraction error:", JSON.stringify(data.error));
      return null;
    }
    return data.content?.[0]?.text || null;
  } catch (err) {
    console.error("❌ extractWithClaude exception:", err.message);
    return null;
  }
}

// ── Text extraction dispatcher ────────────────────────────
async function extractTextFromBuffer(buffer, mimeType, filename, anthropicKey) {
  const textTypes = ["text/plain", "text/csv", "text/markdown", "application/json"];
  if (textTypes.some(t => mimeType.startsWith(t)) || filename.match(/\.(txt|csv|md|json)$/i)) {
    return buffer.toString("utf-8");
  }

  if (mimeType === "application/pdf" || filename.match(/\.pdf$/i)) {
    try {
      const pdfParse = require("pdf-parse/lib/pdf-parse.js");
      const data = await pdfParse(buffer);
      if (data.text && data.text.trim().length > 0) {
        console.log(`📋 pdf-parse OK: ${data.text.length} chars`);
        return data.text;
      }
      throw new Error("pdf-parse returned empty text");
    } catch (pdfErr) {
      console.log(`⚠️ pdf-parse falló (${pdfErr.message}), usando Claude...`);
      return extractWithClaude(buffer, "application/pdf", filename, anthropicKey);
    }
  }

  if (mimeType.includes("word") || filename.match(/\.docx?$/i)) {
    try {
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      return extractWithClaude(buffer, "application/pdf", filename, anthropicKey);
    }
  }

  if (mimeType.startsWith("image/")) {
    return extractWithClaude(buffer, mimeType, filename, anthropicKey);
  }

  if (filename.match(/\.xlsx?$/i)) {
    try {
      const XLSX = require("xlsx");
      const wb = XLSX.read(buffer);
      let text = "";
      wb.SheetNames.forEach(name => {
        text += `\n[Hoja: ${name}]\n`;
        text += XLSX.utils.sheet_to_csv(wb.Sheets[name]);
      });
      return text;
    } catch {
      return `[Archivo Excel: ${filename}]`;
    }
  }

  return null;
}

// ── GET: list files ───────────────────────────────────────
export async function GET() {
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

    const index = await getKBIndex();
    return NextResponse.json({ files: index });
  } catch (err) {
    console.error("GET /api/knowledge error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: upload & process a file ────────────────────────
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

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const filename = file.name;
    const mimeType = file.type || "application/octet-stream";
    const buffer   = Buffer.from(await file.arrayBuffer());
    const sizeMB   = (buffer.length / 1024 / 1024).toFixed(2);
    const id       = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const botId    = formData.get("botId") || null;

    await saveRawFile(id, buffer);

    const isImage = mimeType.startsWith("image/");

    const entry = {
      id,
      name: filename,
      type: mimeType,
      size: sizeMB > 1 ? `${sizeMB} MB` : `${Math.round(buffer.length / 1024)} KB`,
      date: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
      status: "PROCESANDO",
      textFile: null,
      isImage,
      mimeType,
      ...(botId ? { botId } : {}),
    };

    const index = await getKBIndex();
    index.unshift(entry);
    await setKBIndex(index);

    const config = await getConfig();

    if (isImage) {
      // Save image binary data immediately so the bot can send it via WhatsApp
      const base64 = buffer.toString("base64");
      await setKBImageData(id, { base64, mimeType, filename });
      console.log(`🖼️ Imagen guardada en storage: ${filename}`);

      // Mark as PROCESADO right away — images don't need OCR to be sendable
      const idx0 = await getKBIndex();
      const i0   = idx0.findIndex(f => f.id === id);
      if (i0 !== -1) {
        idx0[i0].status  = "PROCESADO";
        idx0[i0].preview = `[Imagen: ${filename}]`;
        await setKBIndex(idx0);
      }

      // Run OCR in background to also extract text (best-effort)
      extractTextFromBuffer(buffer, mimeType, filename, config.anthropicKey).then(async (text) => {
        if (text && text.trim().length > 0) {
          const textFile = `${id}.txt`;
          await setKBText(textFile, `=== ${filename} ===\n\n${text}`);
          const idx2 = await getKBIndex();
          const i2   = idx2.findIndex(f => f.id === id);
          if (i2 !== -1) {
            idx2[i2].textFile = textFile;
            idx2[i2].preview  = text.slice(0, 200).trim();
            await setKBIndex(idx2);
          }
          console.log(`✅ OCR imagen OK: ${filename} — ${text.length} chars`);
        }
      }).catch(err => console.warn(`⚠️ OCR imagen omitido: ${err.message}`));

    } else {
      console.log(`📄 Extrayendo texto de: ${filename} (${mimeType})`);

      extractTextFromBuffer(buffer, mimeType, filename, config.anthropicKey).then(async (text) => {
        const idx = await getKBIndex();
        const i   = idx.findIndex(f => f.id === id);
        if (i !== -1) {
          if (text && text.trim().length > 0) {
            const textFile = `${id}.txt`;
            await setKBText(textFile, `=== ${filename} ===\n\n${text}`);
            idx[i].status   = "PROCESADO";
            idx[i].textFile = textFile;
            idx[i].preview  = text.slice(0, 200).trim();
            console.log(`✅ Procesado: ${filename} — ${text.length} caracteres`);
          } else {
            idx[i].status = "ERROR";
            console.error(`❌ Sin texto extraído para: ${filename}`);
          }
          await setKBIndex(idx);
        }
      }).catch(async (err) => {
        console.error(`❌ Error extrayendo ${filename}:`, err.message);
        const idx = await getKBIndex();
        const i   = idx.findIndex(f => f.id === id);
        if (i !== -1) { idx[i].status = "ERROR"; await setKBIndex(idx); }
      });
    }

    return NextResponse.json({ success: true, file: entry });
  } catch (err) {
    console.error("Knowledge upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── PATCH: update description on a KB entry ───────────────
export async function PATCH(request) {
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

    const { id, description } = await request.json();
    if (!id) return NextResponse.json({ error: "No id" }, { status: 400 });

    const index = await getKBIndex();
    const i = index.findIndex(f => f.id === id);
    if (i === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    index[i].description = description ?? "";
    await setKBIndex(index);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/knowledge error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── DELETE: remove a file ─────────────────────────────────
export async function DELETE(request) {
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

    const { id } = await request.json();
    const index  = await getKBIndex();
    const entry  = index.find(f => f.id === id);

    if (entry) {
      await deleteRawFile(entry.id);
      if (entry.textFile) await deleteKBText(entry.textFile);
      if (entry.isImage) await deleteKBImageData(entry.id);
    }

    const updated = index.filter(f => f.id !== id);
    await setKBIndex(updated);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/knowledge error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
