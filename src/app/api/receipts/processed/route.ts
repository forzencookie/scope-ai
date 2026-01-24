/**
 * Processed Receipts API
 *
 * GET: Fetches receipts from Supabase with RLS enforcement
 *
 * Security: Uses user-scoped DB access - RLS automatically filters
 */

import { NextResponse } from "next/server"
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
