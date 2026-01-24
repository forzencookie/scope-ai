// @ts-nocheck
/**
 * Processed Supplier Invoices API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextResponse } from "next/server"
import { processSupplierInvoices, type NakedSupplierInvoice } from "@/services/invoice-processor"
import { createUserScopedDb } from "@/lib/user-scoped-db"

export async function GET() {
  try {
    // Get user-scoped database access (enforces RLS)
    const userDb = await createUserScopedDb()
    
    if (!userDb) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoices - RLS automatically filters by user's company
    const dbInvoices = await userDb.supplierInvoices.list({ limit: 100 })

    // Transform to NakedSupplierInvoice format for processing
    const nakedInvoices: NakedSupplierInvoice[] = dbInvoices.map(i => ({
      id: i.id,
      invoiceNumber: i.invoice_number || '',
      supplierName: i.supplier_name,
      amount: Number(i.amount) || 0,
      totalAmount: Number(i.total_amount) || 0,
      dueDate: i.due_date || '',
      invoiceDate: i.issue_date || '',
      status: i.status || 'mottagen',
      ocrNumber: i.ocr || undefined,
    }))

    const processedInvoices = processSupplierInvoices(nakedInvoices)

    return NextResponse.json({
      invoices: processedInvoices,
      count: processedInvoices.length,
      userId: userDb.userId,
      companyId: userDb.companyId,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
