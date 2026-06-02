import { getKBImageData } from "@/lib/storage";

export async function GET(request, { params }) {
  const { id } = params;
  const data = await getKBImageData(id);
  if (!data) return new Response("Not found", { status: 404 });

  const buffer = Buffer.from(data.base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": data.mimeType || "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
