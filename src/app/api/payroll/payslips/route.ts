import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server-db";

export async function GET() {
    try {
        const payslips = await db.getPayslips();
        return NextResponse.json({ payslips });
    } catch (error) {
        console.error("Failed to fetch payslips:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const saved = await db.addPayslip(body);
        return NextResponse.json({ success: true, payslip: saved });
    } catch (error) {
        console.error("Failed to create payslip:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
