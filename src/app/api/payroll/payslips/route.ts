/**
 * Payslips API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

export async function GET() {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payslips = await userDb.payslips.list();
        
        return NextResponse.json({
            payslips,
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch payslips:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const saved = await userDb.payslips.create(body);

        if (!saved) {
            return NextResponse.json({ error: "Failed to create" }, { status: 500 });
        }

        return NextResponse.json({ success: true, payslip: saved });
    } catch (error) {
        console.error("Failed to create payslip:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
