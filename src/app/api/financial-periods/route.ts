/**
 * Financial Periods API
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

        // Use raw client for tables not yet in typed accessors
        const { data: periods, error } = await userDb.client
            .from('financial_periods')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            periods: periods || [],
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch financial periods:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
