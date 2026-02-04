/**
 * Processed Receipts API
 *
 * GET: Fetches receipts from Supabase with RLS enforcement
 * POST: Creates a new receipt
 *
 * Security: Uses user-scoped DB access - RLS automatically filters
 */

import { NextRequest, NextResponse } from "next/server"
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

export async function GET() {
  try {
    // Get user-scoped database access (enforces RLS)
    const userDb = await createUserScopedDb()

    if (!userDb) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch receipts - RLS automatically filters by user's company
    const receipts = await userDb.receipts.list({ limit: 100 })

    return NextResponse.json({
      receipts: receipts.map(r => ({ ...r, attachmentUrl: r.image_url })),
      count: receipts.length,
      userId: userDb.userId,
      companyId: userDb.companyId,
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
    const userDb = await createUserScopedDb()

    if (!userDb) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      user_id: userDb.userId,
      company_id: userDb.companyId,
    }

    const created = await userDb.receipts.create(receiptData)

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
