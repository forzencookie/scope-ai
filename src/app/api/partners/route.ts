/**
 * Partners API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from "@/lib/database/auth-server"

export const GET = withAuth(async (_request, { supabase, companyId }) => {
    let query = supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

    if (companyId) {
        query = query.eq('company_id', companyId);
    }

    const { data: partners, error } = await query;

    if (error) throw error;

    return NextResponse.json({ partners: partners || [] })
})

export const POST = withAuth(async (request, { supabase, userId, companyId }) => {
    const json = await request.json()

    const { data: partner, error } = await supabase
        .from('partners')
        .insert({
            ...json,
            company_id: json.company_id ?? companyId,
            user_id: userId,
        })
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({ partner })
})
