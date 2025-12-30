/**
 * AI Engine - Process Inbox Items
 * 
 * This endpoint scans unprocessed inbox items, analyzes them with OpenAI,
 * and creates corresponding entries in Invoices or Receipts.
 * The original inbox item is NOT deleted - it's linked to the created entity.
 */

import { NextResponse } from 'next/server'
import { db } from '@/lib/server-db'
import type { InboxItem } from '@/types'
import { extractInvoiceDataWithGPT } from '@/services/invoice-ocr'

async function processInboxItem(item: InboxItem): Promise<{ suggestion: string, documentType: 'receipt' | 'invoice', extractedData: any } | null> {
    // Skip if already processed or already has a suggestion
    if (item.aiStatus === 'processed' || item.aiSuggestion) return null

    // AI reads the raw text content (simulating OCR)
    console.log(`[AI] Analyzing email from ${item.sender}: "${item.title}"`)

    // Use GPT to extract ALL invoice information from text
    const extractedData = await extractInvoiceDataWithGPT(item)

    if (!extractedData) {
        console.log(`[AI] Could not extract invoice data`)
        return null
    }

    console.log(`[AI] Extracted:`, extractedData)

    // Determine if already paid (receipt) or needs payment (invoice)
    // But do NOT create anything yet - just suggest
    if (extractedData.isPaid) {
        // RECEIPT suggestion
        console.log(`[AI] Detected as RECEIPT (already paid) - suggesting`)
        return {
            suggestion: `Registrera som kvitto från ${extractedData.supplier} på ${extractedData.amount} kr`,
            documentType: 'receipt',
            extractedData
        }
    } else {
        // INVOICE suggestion
        console.log(`[AI] Detected as INVOICE (needs payment) - suggesting`)
        return {
            suggestion: `Registrera som leverantörsfaktura från ${extractedData.supplier} på ${extractedData.amount} kr`,
            documentType: 'invoice',
            extractedData
        }
    }
}

export async function POST() {
    try {
        // Get all inbox items from Supabase
        const allItems = await db.getInboxItems()
        console.log('[AI] Starting processing, inbox items:', allItems.length)

        const results: { itemId: string, suggestion: string, documentType: string }[] = []
        const errors: { itemId: string, error: string }[] = []

        // Find all pending items
        const pendingItems = allItems.filter(
            (item: InboxItem) => item.aiStatus === 'pending' || !item.aiStatus
        )

        console.log(`[AI] Found ${pendingItems.length} pending items to process`)

        if (pendingItems.length === 0) {
            return NextResponse.json({
                success: true,
                processed: 0,
                results: [],
                errors: []
            })
        }

        // Process items sequentially for Supabase (to avoid race conditions)
        for (const item of pendingItems) {
            try {
                console.log(`[AI] Item ${item.id}: status=${item.aiStatus}, category=${item.category}`)

                // Update status to processing
                await db.updateInboxItem(item.id, { aiStatus: 'processing' })

                const result = await processInboxItem(item)

                if (result) {
                    // Update item with AI suggestion (NOT creating record yet)
                    await db.updateInboxItem(item.id, {
                        aiStatus: 'pending', // Keep pending until user confirms
                        aiSuggestion: result.suggestion,
                        // Store extracted data for later use by api/inbox/process
                        documentData: {
                            ...item.documentData,
                            extractedData: result.extractedData,
                            suggestedType: result.documentType
                        },
                        category: 'faktura',
                    })

                    results.push({
                        itemId: item.id,
                        suggestion: result.suggestion,
                        documentType: result.documentType
                    })

                    console.log(`[AI] ✓ Suggested for ${item.id}: ${result.suggestion}`)
                } else {
                    // Non-invoice items - no suggestion
                    await db.updateInboxItem(item.id, { aiStatus: 'processed' })
                    console.log(`[AI] ⊘ Skipped non-invoice item ${item.id}`)
                }
            } catch (error) {
                // Mark as error but don't stop processing other items
                await db.updateInboxItem(item.id, { aiStatus: 'error' })
                const errorMsg = error instanceof Error ? error.message : 'Unknown error'
                errors.push({ itemId: item.id, error: errorMsg })
                console.error(`[AI] ✗ Error processing ${item.id}:`, errorMsg)
            }
        }

        console.log('[AI] All items completed. Processed:', results.length, 'Errors:', errors.length)

        return NextResponse.json({
            success: true,
            processed: results.length,
            results,
            errors: errors.length > 0 ? errors : undefined,
            totalPending: pendingItems.length,
        })
    } catch (error) {
        console.error('AI Processing Error:', error)
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
    }
}

export async function GET() {
    // Return status of all inbox items from Supabase
    const allItems = await db.getInboxItems()
    const dbData = await db.get()

    const stats = {
        total: allItems.length,
        pending: allItems.filter((i: InboxItem) => i.aiStatus === 'pending' || !i.aiStatus).length,
        processed: allItems.filter((i: InboxItem) => i.aiStatus === 'processed').length,
        invoicesCreated: dbData.supplierInvoices?.length || 0,
        receiptsCreated: dbData.receipts?.length || 0
    }
    return NextResponse.json(stats)
}
