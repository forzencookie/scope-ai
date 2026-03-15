/**
 * Payslip by ID API
 *
 * PUT: Update a payslip (e.g., mark as paid)
 * DELETE: Delete a draft payslip
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from '@/lib/database/auth';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase } = ctx;
        const { id } = await params;
        const body = await req.json();

        const { data: updated, error } = await supabase
            .from('payslips')
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error || !updated) {
            return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, payslip: updated });
    } catch (error) {
        console.error("Failed to update payslip:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAuthContext();
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase } = ctx;
        const { id } = await params;

        // Only allow deletion of draft payslips
        const { data: existing, error: fetchError } = await supabase
            .from('payslips')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
        }
        if (existing.status !== 'draft') {
            return NextResponse.json(
                { error: 'Kan bara ta bort utkast. Ändra status till utkast först.' },
                { status: 422 }
            );
        }

        const { error: deleteError } = await supabase
            .from('payslips')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete payslip:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
