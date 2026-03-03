/**
 * Payslip by ID API
 *
 * PUT: Update a payslip (e.g., mark as paid)
 * DELETE: Delete a draft payslip
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userDb = await createUserScopedDb();
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const updated = await userDb.payslips.update(id, body);

        if (!updated) {
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
        const userDb = await createUserScopedDb();
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Only allow deletion of draft payslips
        const existing = await userDb.payslips.getById(id);
        if (!existing) {
            return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
        }
        if (existing.status !== 'draft') {
            return NextResponse.json(
                { error: 'Kan bara ta bort utkast. Ändra status till utkast först.' },
                { status: 422 }
            );
        }

        const deleted = await userDb.payslips.delete(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete payslip:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
