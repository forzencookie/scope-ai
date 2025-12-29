import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server-db";

export async function GET(req: NextRequest) {
    try {
        const reports = await db.getTaxReports('vat');
        return NextResponse.json({ reports });
    } catch (error) {
        console.error("Failed to fetch VAT reports:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const report = await req.json();

        // Ensure we have a period_id
        if (!report.period_id) {
            return NextResponse.json({ error: "Missing period_id" }, { status: 400 });
        }

        const savedReport = await db.upsertTaxReport(report);

        // If status is 'submitted', update the financial period status too
        if (report.status === 'submitted') {
            await db.updateFinancialPeriodStatus(report.period_id, 'submitted');
        }

        return NextResponse.json({ success: true, report: savedReport });
    } catch (error) {
        console.error("Failed to save VAT report:", error);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
