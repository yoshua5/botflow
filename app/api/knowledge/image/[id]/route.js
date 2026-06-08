import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getKBImageData } from "@/lib/storage";

export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  if (!id || id.length > 200 || /[^a-zA-Z0-9._-]/.test(id)) {
    return new Response("Invalid id", { status: 400 });
  }

  const data = await getKBImageData(id, userId);
  if (!data) return new Response("Not found", { status: 404 });

  const buffer = Buffer.from(data.base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": data.mimeType || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
