import { NextResponse } from "next/server";
import { getGlobalLanding, setGlobalLanding } from "@/lib/storage";
import { auth, currentUser } from "@clerk/nextjs/server";

const SUPER_ADMIN = "yoshualeisorek17@gmail.com";

export async function GET() {
  const data = await getGlobalLanding();
  return NextResponse.json(data);
}

export async function POST(request) {
  const { userId } = await auth();
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;

  if (email !== SUPER_ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await request.json();
    await setGlobalLanding(data);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
}
