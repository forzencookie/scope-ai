/**
 * Processed Receipts API
 *
 * GET: Fetches receipts from Supabase with RLS enforcement
 * POST: Creates a new receipt
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/database/auth-server"

export async function GET() {
  try {
    const ctx = await getAuthContext()

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, userId, companyId } = ctx;

    // Fetch receipts - RLS automatically filters by user's company
    const { data: receipts, error } = await supabase
        .from('receipts')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(100)

    if (error) console.error('[Receipts] list error:', error)

    return NextResponse.json({
      receipts: (receipts || []).map(r => ({ ...r, attachmentUrl: r.image_url })),
      count: (receipts || []).length,
      userId,
      companyId,
    })

  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { supabase, userId, companyId } = ctx;

    const body = await req.json()

    // Parse amount - handle "123 kr" format
    let amount = 0
    if (typeof body.amount === 'string') {
      amount = parseFloat(body.amount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    } else if (typeof body.amount === 'number') {
      amount = body.amount
    }

    // Parse VAT amount
    let vatAmount = 0
    if (body.moms) {
      if (typeof body.moms === 'string') {
        vatAmount = parseFloat(body.moms.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      } else if (typeof body.moms === 'number') {
        vatAmount = body.moms
      }
    }

    const receiptData = {
      id: crypto.randomUUID(),
      supplier: body.supplier || null,
      date: body.date || new Date().toISOString().split('T')[0],
      amount: amount,
      total_amount: amount,
      category: body.category || null,
      status: body.status || 'pending',
      image_url: body.imageUrl || null,
      file_url: body.fileUrl || null,
      source: 'manual',
      metadata: vatAmount > 0 ? { vatAmount } : null,
      user_id: userId,
      company_id: companyId,
    }

    const { data: created, error } = await supabase
        .from('receipts')
        .insert(receiptData)
        .select()
        .single()

    if (error) console.error('[Receipts] create error:', error)

    if (!created) {
      return NextResponse.json({ error: 'Failed to save receipt' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      receipt: {
        ...created,
        attachmentUrl: created.image_url,
      }
    })

  } catch (error) {
    console.error('Error creating receipt:', error)
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    )
  }
}
