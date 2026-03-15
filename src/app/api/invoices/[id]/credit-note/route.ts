/**
 * Credit Note API
 *
 * POST /api/invoices/[id]/credit-note
 *
 * Creates a credit note (kreditfaktura) for an existing customer invoice.
 * - Generates credit note number (KF-YYYY-NNNN)
 * - Creates bookkeeping entry (reverses original sale)
 * - Links credit note to original invoice
 *
 * Body: { reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/database/auth'
import { createCreditNoteEntry } from '@/lib/bookkeeping/entries/sales'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const ctx = await getAuthContext()
        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { supabase, userId, companyId } = ctx
        const { id: invoiceId } = await params
        const body = await request.json().catch(() => ({}))
        const reason = body.reason || 'Kreditering'

        // Fetch original invoice
        const { data: invoice } = await supabase
            .from('customer_invoices')
            .select('*')
            .eq('id', invoiceId)
            .single()

        if (!invoice) {
            return NextResponse.json({ error: 'Faktura hittades inte' }, { status: 404 })
        }

        // Don't allow credit notes on drafts
        if (invoice.status === 'Utkast') {
            return NextResponse.json({ error: 'Kan inte kreditera en utkastfaktura — radera den istället' }, { status: 400 })
        }

        // Generate credit note number
        const year = new Date().getFullYear()
        const { data: existingCreditNotes } = await supabase
            .from('customer_invoices')
            .select('invoice_number')
            .like('invoice_number', `KF-${year}-%`)
            .order('invoice_number', { ascending: false })
            .limit(1)

        let nextNum = 1
        if (existingCreditNotes && existingCreditNotes.length > 0) {
            const lastNum = parseInt(existingCreditNotes[0].invoice_number.split('-')[2]) || 0
            nextNum = lastNum + 1
        }
        const creditNoteNumber = `KF-${year}-${String(nextNum).padStart(4, '0')}`

        // Create bookkeeping journal entry
        const totalAmount = Number(invoice.total_amount) || 0
        const vatAmount = Number(invoice.vat_amount) || 0
        const vatRate = totalAmount > 0 && vatAmount > 0
            ? Math.round((vatAmount / (totalAmount - vatAmount)) * 100) as 25 | 12 | 6
            : 0

        const journalEntry = createCreditNoteEntry({
            date: new Date().toISOString().split('T')[0],
            description: `${reason} — ${invoice.customer_name} (${invoice.invoice_number})`,
            grossAmount: totalAmount,
            vatRate: vatRate || undefined,
            creditNoteNumber,
        })

        // Create the credit note as a new invoice record
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const creditNoteData: any = {
            invoice_number: creditNoteNumber,
            customer_name: invoice.customer_name,
            customer_email: invoice.customer_email,
            customer_address: invoice.customer_address,
            customer_org_number: invoice.customer_org_number,
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            subtotal: -(Number(invoice.subtotal) || 0),
            vat_amount: -vatAmount,
            total_amount: -totalAmount,
            status: 'Krediterad',
            currency: invoice.currency || 'SEK',
            items: {
                type: 'credit_note',
                originalInvoiceId: invoice.id,
                originalInvoiceNumber: invoice.invoice_number,
                reason,
                journalEntry: {
                    description: journalEntry.description,
                    rows: journalEntry.rows,
                },
            },
            user_id: userId,
            company_id: companyId || '',
        }

        const { data: created, error } = await supabase
            .from('customer_invoices')
            .insert(creditNoteData)
            .select()
            .single()

        if (error) console.error('[CreditNote] create error:', error)

        if (!created) {
            return NextResponse.json({ error: 'Kunde inte skapa kreditfaktura' }, { status: 500 })
        }

        // Update original invoice status to 'Krediterad'
        await supabase
            .from('customer_invoices')
            .update({ status: 'Krediterad' })
            .eq('id', invoice.id)

        return NextResponse.json({
            success: true,
            creditNote: {
                id: created.id,
                creditNoteNumber,
                originalInvoiceNumber: invoice.invoice_number,
                amount: -totalAmount,
                reason,
            },
            journalEntry: {
                description: journalEntry.description,
                rows: journalEntry.rows,
            },
        })
    } catch (error) {
        console.error('[CreditNote] Error:', error)
        return NextResponse.json({ error: 'Kunde inte skapa kreditfaktura' }, { status: 500 })
    }
}
