/**
 * FIXED: app/api/bots/route.js
 *
 * SECURITY FIXES:
 * 1. ✅ Added auth() check in GET — only authenticated users
 * 2. ✅ Pass explicit userId to getBots() — prevent user_id leakage
 * 3. ✅ Added authorization check in PATCH — verify bot belongs to user
 * 4. ✅ Added authorization check in DELETE — verify bot belongs to user
 * 5. ✅ All errors properly handled with status codes
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBots, setBots } from "@/lib/storage";

/**
 * GET /api/bots
 * Returns only the authenticated user's bots
 */
export async function GET() {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    // ✅ CRITICAL: Pass userId explicitly to getBots()
    // This ensures RLS filters work correctly in Supabase
    const bots = await getBots(userId);

    return NextResponse.json({ bots });
  } catch (err) {
    console.error("GET /api/bots error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bots
 * Updates status of a bot (activate/deactivate)
 */
export async function PATCH(request) {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status" },
        { status: 400 }
      );
    }

    // ✅ CRITICAL: Fetch user's bots with userId
    const bots = await getBots(userId);

    // ✅ CRITICAL: Verify the bot being updated belongs to this user
    // Prevents cross-tenant modification attacks
    const botExists = bots.some(b => b.id === id);
    if (!botExists) {
      console.warn(`⚠️ Unauthorized PATCH attempt: userId=${userId} tried to update bot id=${id}`);
      return NextResponse.json(
        { error: "Bot not found or unauthorized" },
        { status: 403 }
      );
    }

    // Update the bot's status
    const updated = bots.map(b =>
      b.id === id ? { ...b, status } : b
    );

    // ✅ CRITICAL: Save with userId to ensure RLS enforcement
    await setBots(updated, userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/bots error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bots
 * Deletes a bot
 */
export async function DELETE(request) {
  try {
    const { userId } = auth();

    // ✅ CRITICAL: Block unauthenticated requests
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized — must be logged in" },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // ✅ CRITICAL: Fetch user's bots with userId
    const bots = await getBots(userId);

    // ✅ CRITICAL: Verify the bot being deleted belongs to this user
    // Prevents cross-tenant deletion attacks
    const botToDelete = bots.find(b => b.id === id);
    if (!botToDelete) {
      console.warn(`⚠️ Unauthorized DELETE attempt: userId=${userId} tried to delete bot id=${id}`);
      return NextResponse.json(
        { error: "Bot not found or unauthorized" },
        { status: 403 }
      );
    }

    // Remove the bot from the list
    const updated = bots.filter(b => b.id !== id);

    // ✅ CRITICAL: Save with userId to ensure RLS enforcement
    await setBots(updated, userId);

    console.log(`✅ Bot deleted: id=${id}, userId=${userId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/bots error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

/**
 * SECURITY SUMMARY:
 *
 * BEFORE:
 * ❌ GET() - No auth check, getBots() without userId → returns ALL bots to ANY caller
 * ❌ PATCH() - No auth check, no ownership verification → ANY caller can modify ANY bot
 * ❌ DELETE() - No auth check, no ownership verification → ANY caller can delete ANY bot
 *
 * AFTER:
 * ✅ GET() - auth() check, getBots(userId) → only authenticated user's bots
 * ✅ PATCH() - auth() check, ownership verification → only user's own bot can be modified
 * ✅ DELETE() - auth() check, ownership verification → only user's own bot can be deleted
 *
 * These changes ensure:
 * 1. Multi-tenancy isolation is enforced at the API layer
 * 2. Database RLS policies work correctly with explicit userId
 * 3. Cross-tenant attacks (reading/modifying/deleting another user's data) are blocked
 * 4. All errors return proper HTTP status codes (401 Unauthorized, 403 Forbidden)
 * 5. Audit logs show attempted unauthorized access attempts
 */
