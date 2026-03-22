/**
 * Employees API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";
import { taxService } from '@/services/tax/tax-service';

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const { data: employees, error } = await supabase
            .from('employees')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        return NextResponse.json({
            employees: employees || [],
            userId,
            companyId,
        });
    } catch (error) {
        console.error("Failed to fetch employees:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId } = ctx;
        const body = await req.json();

        if (!body.name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const { data: employee, error } = await supabase
            .from('employees')
            .insert({
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
                kommun: body.kommun || null,
                status: body.status || 'active',
                start_date: body.employment_date || body.start_date || new Date().toISOString().split('T')[0],
                user_id: userId,
            })
            .select()
            .single();

        if (error || !employee) {
            return NextResponse.json({ error: "Failed to create" }, { status: 500 });
        }

        return NextResponse.json({ employee });
    } catch (error) {
        console.error("Failed to create employee:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
