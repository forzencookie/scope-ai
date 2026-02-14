/**
 * Employees API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';
import { taxService } from '@/services/tax-service';

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

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const employee = await userDb.employees.create({
            name: body.name,
            role: body.role || null,
            email: body.email || null,
            phone: body.phone || null,
            personal_number: body.personal_number || null,
            monthly_salary: Number(body.monthly_salary ?? body.salary) || 0,
            employment_type: body.employment_type || null,
            tax_rate: body.tax_rate != null ? Number(body.tax_rate) : await taxService.getAllTaxRates(new Date().getFullYear()).then(r => r?.marginalTaxRateApprox ?? 0.32),
            tax_table: body.tax_table != null ? Number(body.tax_table) : null,
            tax_column: body.tax_column != null ? Number(body.tax_column) : null,
            status: body.status || 'active',
            start_date: body.employment_date || body.start_date || new Date().toISOString().split('T')[0],
            user_id: userDb.userId,
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
