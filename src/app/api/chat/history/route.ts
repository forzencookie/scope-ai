/**
 * Chat History API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextResponse } from "next/server";
import { getAuthContext } from '@/lib/database/auth';

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId } = ctx;

        // Get conversations for the authenticated user only
        const { data: conversations, error } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json(conversations || []);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
    }
}
