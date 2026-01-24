/**
 * Verifications API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from "@/lib/user-scoped-db";

export async function GET() {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const verifications = await userDb.verifications.list({ limit: 200 });
        
        return NextResponse.json({
            verifications,
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch verifications:", error);
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

        const saved = await userDb.verifications.create({
            date: body.date || new Date().toISOString().split('T')[0],
            description: body.description,
            rows: body.rows,
        });

        if (!saved) {
            return NextResponse.json({ error: "Failed to create" }, { status: 500 });
        }

        return NextResponse.json({ success: true, verification: saved });
    } catch (error) {
        console.error("Failed to create verification:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
