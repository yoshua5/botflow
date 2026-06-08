import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getKBImageData } from "@/lib/storage";

export async function GET(request, { params }) {
  // Require authentication — images are private per user
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const 