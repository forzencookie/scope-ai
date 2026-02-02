/**
 * Chat History - Single Conversation with Messages
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conversation = await userDb.conversations.getById(id);
        if (!conversation) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const messages = await userDb.messages.listByConversation(id);

        return NextResponse.json({
            ...conversation,
            messages,
        });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
    }
}
