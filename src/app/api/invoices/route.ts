
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server-db";

/**
 * Customer Invoices API
 * 
 * GET: Fetches invoices from Supabase
 * POST: Creates invoice from dashboard UI
 */

export async function GET() {
    try {
        const data = await db.get();
        return NextResponse.json({
            invoices: data.invoices || []
        });
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.customer || !body.amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const newInvoice = {
            ...body,
            id: body.id || `FAK-${Date.now()}`,
            status: body.status || 'Utkast',
            createdAt: new Date().toISOString()
        };

        // TODO: Add db.addInvoice when customer invoices table is created in Supabase
        // await db.addInvoice(newInvoice);

        return NextResponse.json({
            success: true,
            invoice: newInvoice
        });
    } catch (error) {
        console.error("Failed to create invoice:", error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
