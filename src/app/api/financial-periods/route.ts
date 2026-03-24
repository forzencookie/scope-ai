/**
 * Financial Periods API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/database/auth-server";

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
    const { data: periods, error } = await supabase
        .from('financial_periods')
        .select('*')
        .order('start_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
        periods: periods || [],
        userId,
        companyId,
    });
})
