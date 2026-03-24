/**
 * Payslip by ID API
 *
 * PUT: Update a payslip (e.g., mark as paid)
 * DELETE: Delete a draft payslip
 */

import { NextRequest } from "next/server";
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server";

export const PUT = withAuthParams(async (req: NextRequest, { supabase }, { id }) => {
    const body = await req.json();

    const { data: updated, error } = await supabase
        .from('payslips')
        .update(body)
        .eq('id', id)
        .select()
        .single();

    if (error || !updated) {
        return ApiResponse.notFound('Payslip not found');
    }

    return ApiResponse.success({ payslip: updated });
})

export const DELETE = withAuthParams(async (_req: NextRequest, { supabase }, { id }) => {
    // Only allow deletion of draft payslips
    const { data: existing, error: fetchError } = await supabase
        .from('payslips')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !existing) {
        return ApiResponse.notFound('Payslip not found');
    }
    if (existing.status !== 'Utkast') {
        return ApiResponse.badRequest('Kan bara ta bort utkast. Ändra status till utkast först.');
    }

    const { error: deleteError } = await supabase
        .from('payslips')
        .delete()
        .eq('id', id);

    if (deleteError) {
        return ApiResponse.serverError('Failed to delete');
    }

    return ApiResponse.success({});
})
