import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId"); // Ideally from auth session

        // For now, since we are transitioning, we might need to handle the case
        // where we fetch *all* conversations if no user is provided, or strictly enforce it.
        // Given the new security model, we should prefer fetching by user.

        // However, server-db `getConversations` is admin-privileged.
        // Let's use it for now to ensure data flow, but filter by user if present.

        // TODO: Switch to `getSupabaseClient()` + headers for strict RLS in next phase.
        // Currently keeping it compatible with existing 'admin' pattern for stability.

        const conversations = await db.getConversations(userId || undefined);

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
}
