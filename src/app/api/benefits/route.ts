/**
 * Benefits API
 *
 * GET: List all available benefits and assigned benefits for the current year
 */

import { NextResponse } from "next/server";
import { listAvailableBenefits, getAllAssignedBenefits } from "@/lib/formaner";

export async function GET() {
    try {
        const currentYear = new Date().getFullYear();
        const [catalog, assigned] = await Promise.all([
            listAvailableBenefits(),
            getAllAssignedBenefits(currentYear),
        ]);

        return NextResponse.json({
            success: true,
            benefits: catalog,
            assigned,
            year: currentYear,
        });
    } catch (error) {
        console.error("Failed to fetch benefits:", error);
        return NextResponse.json({ error: "Failed to fetch benefits" }, { status: 500 });
    }
}
