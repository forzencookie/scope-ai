/**
 * Employees API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, ApiResponse } from "@/lib/database/auth-server";
import { taxService } from '@/services/tax/tax-service';

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
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
})

export const POST = withAuth(async (req, { supabase, userId }) => {
    const body = await req.json();

    if (!body.name) {
        return ApiResponse.badRequest("Name is required");
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
            status: body.status || 'Aktiv',
            start_date: body.employment_date || body.start_date || new Date().toISOString().split('T')[0],
            user_id: userId,
        })
        .select()
        .single();

    if (error || !employee) {
        return ApiResponse.serverError("Failed to create");
    }

    return NextResponse.json({ employee });
})
