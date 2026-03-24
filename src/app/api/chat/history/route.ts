/**
 * Chat History API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/database/auth-server";

export const GET = withAuth(async (_request, { supabase, userId }) => {
    // Get conversations for the authenticated user only
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(50);

    if (error) throw error;

    return NextResponse.json(conversations || []);
})
