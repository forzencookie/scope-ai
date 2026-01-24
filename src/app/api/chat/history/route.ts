/**
 * Chat History API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

export async function GET() {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get conversations for the authenticated user only
        const conversations = await userDb.conversations.list({ limit: 50 });

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
}
