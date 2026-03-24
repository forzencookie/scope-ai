/**
 * Chat History - Single Conversation with Messages
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server";

export const GET = withAuthParams(async (_request: NextRequest, { supabase, userId }, { id }) => {
    const { data: conversation } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (!conversation) {
        return ApiResponse.notFound('Not found');
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
})
