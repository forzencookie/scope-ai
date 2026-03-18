/**
 * Processed Supplier Invoices API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { processSupplierInvoices, type NakedSupplierInvoice } from "@/services/processors/invoice-processor"
import { getAuthContext } from "@/lib/database/auth-server"

export async function GET() {
  try {
    const ctx = await getAuthContext()

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, userId, companyId } = ctx;

    // Fetch invoices - RLS automatically filters by user's company
    const { data: dbInvoices, error } = await supabase
        .from('supplier_invoices')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(100)

    if (error) console.error('[SupplierInvoices] list error:', error)

    // Transform to NakedSupplierInvoice format for processing
    const nakedInvoices: NakedSupplierInvoice[] = (dbInvoices || []).map(i => ({
      id: i.id,
      invoiceNumber: i.invoice_number || '',
      supplierName: i.supplier_name || 'Unknown',
      amount: Number(i.amount ?? i.total_amount) || 0,
      issueDate: i.issue_date || i.created_at || '',
      dueDate: i.due_date || '',
      ocrNumber: i.ocr || undefined,
    }))

    const processedInvoices = processSupplierInvoices(nakedInvoices)

    return NextResponse.json({
      invoices: processedInvoices,
      count: processedInvoices.length,
      userId,
      companyId,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

/**
 * POST - Create a new supplier invoice
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext()

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, companyId } = ctx;

    const body = await request.json()

    // Validate required fields
    if (!body.supplier) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
    }

    // Generate unique ID
    const invoiceId = `SI-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`

    // Parse amounts
    const amount = parseFloat(body.amount) || 0
    const vatAmount = parseFloat(body.vatAmount) || 0
    const totalAmount = amount + vatAmount

    // Create the invoice
    const { data: invoice, error } = await supabase
        .from('supplier_invoices')
        .insert({
          id: invoiceId,
          company_id: companyId,
          supplier_name: body.supplier,
          invoice_number: body.invoiceNumber || null,
          amount: amount,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          due_date: body.dueDate || null,
          issue_date: body.issueDate || new Date().toISOString().split('T')[0],
          status: body.status || 'mottagen',
          ocr: body.ocr || null,
          document_url: body.documentUrl || null,
        })
        .select()
        .single()

    if (error) console.error('[SupplierInvoices] create error:', error)

    if (!invoice) {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        supplier: invoice.supplier_name,
        invoiceNumber: invoice.invoice_number,
        amount: invoice.amount,
        vatAmount: invoice.vat_amount,
        totalAmount: invoice.total_amount,
        dueDate: invoice.due_date,
        issueDate: invoice.issue_date,
        status: invoice.status,
        ocr: invoice.ocr,
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier invoice:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}
