/**
 * Customer Invoices API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from "@/lib/user-scoped-db";

export async function GET() {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // For now, customer invoices uses supplierInvoices
        // TODO: Create separate customer_invoices table accessor
        const invoices = await userDb.supplierInvoices.list({ limit: 100 });
        
        return NextResponse.json({
            invoices,
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch invoices:", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        if (!body.customer || !body.amount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // TODO: Create proper customer_invoices accessor
        const newInvoice = {
            ...body,
            id: body.id || `FAK-${Date.now()}`,
            status: body.status || 'Utkast',
            createdAt: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            invoice: newInvoice
        });
    } catch (error) {
        console.error("Failed to create invoice:", error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}
