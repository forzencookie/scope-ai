/**
 * Processed Supplier Invoices API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { processSupplierInvoices, type NakedSupplierInvoice } from "@/services/processors/invoice-processor"
import { withAuth, ApiResponse } from "@/lib/database/auth-server"
import { nullToUndefined } from "@/lib/utils"

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
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
        ocrNumber: nullToUndefined(i.ocr),
    }))

    const processedInvoices = processSupplierInvoices(nakedInvoices)

    return NextResponse.json({
        invoices: processedInvoices,
        count: processedInvoices.length,
        userId,
        companyId,
    })
})

/**
 * POST - Create a new supplier invoice
 */
export const POST = withAuth(async (request, { supabase, companyId }) => {
    const body = await request.json()

    // Validate required fields
    if (!body.supplier) {
        return ApiResponse.badRequest('Supplier name is required')
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
        return ApiResponse.serverError('Failed to create invoice')
    }

    return NextResponse.json({
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
})
