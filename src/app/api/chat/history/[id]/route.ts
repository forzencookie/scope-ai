/**
 * Chat History - Single Conversation with Messages
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { supabase, userId } = ctx;

        const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (!conversation) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        return NextResponse.json({
            ...conversation,
            messages: messages || [],
        });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
    }
}
