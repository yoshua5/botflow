import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSubscription } from "@/lib/storage";
import { getPlanById } from "@/lib/plans";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ plan: "free", planName: "Free" });

    const sub  = await getSubscription(userId);
    const plan = getPlanById(sub?.planId || "free");

    return NextResponse.json({
      plan:               plan.id,
      planName:           plan.name,
      status:             sub?.status || "inactive",
      cancelAtPeriodEnd:  sub?.cancelAtPeriodEnd || false,
      currentPeriodEnd:   sub?.currentPeriodEnd  || null,
      amount:             sub?.amount  || 0,
      currency:           sub?.currency || "usd",
      lastInvoiceDate:    sub?.lastInvoiceDate    || null,
      lastInvoiceAmount:  sub?.lastInvoiceAmount  || null,
      hasStripe:          !!sub?.stripeCustomerId,
      limits:             plan.limits,
    });
  } catch (err) {
    return NextResponse.json({ plan: "free", planName: "Free", error: err.message });
  }
}
