/**
 * Benefit Assignment by ID API
 *
 * DELETE: Remove an assigned employee benefit
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteAssignedBenefit } from "@/lib/formaner";

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const deleted = await deleteAssignedBenefit(id);

        if (!deleted) {
            return NextResponse.json({ error: "Benefit assignment not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete benefit assignment:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
