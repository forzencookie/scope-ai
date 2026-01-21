import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { verifyAuth, ApiResponse } from "@/lib/api-auth";

/**
 * GET /api/chat/history
 * Returns the authenticated user's chat conversations
 *
 * SECURITY: User ID is derived from session, not query params
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication - user ID comes from session, not query params
        const auth = await verifyAuth(request);
        if (!auth) {
            return ApiResponse.unauthorized("Authentication required");
        }

        // Get conversations for the authenticated user only
        const conversations = await db.getConversations(auth.userId);

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return ApiResponse.serverError("Failed to fetch conversations");
    }
}
