import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";

export async function GET() {
    try {
        const periods = await db.getFinancialPeriods();
        return NextResponse.json({ periods });
    } catch (error) {
        console.error("Failed to fetch financial periods:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
