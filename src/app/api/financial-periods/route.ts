/**
 * Financial Periods API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

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
    } catch (error) {
        console.error("Failed to fetch financial periods:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
