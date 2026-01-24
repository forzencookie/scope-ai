// @ts-nocheck
/**
 * Employees API
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

        const employees = await userDb.employees.list();
        
        return NextResponse.json({
            employees,
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch employees:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        if (!body.name || !body.role) {
            return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
        }

        const employee = await userDb.employees.create({
            name: body.name,
            role: body.role,
            email: body.email,
            salary: Number(body.salary) || 0,
            status: body.status || 'active',
            employment_date: body.employment_date || new Date().toISOString().split('T')[0]
        });

        if (!employee) {
            return NextResponse.json({ error: "Failed to create" }, { status: 500 });
        }

        return NextResponse.json({ employee });
    } catch (error) {
        console.error("Failed to create employee:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
