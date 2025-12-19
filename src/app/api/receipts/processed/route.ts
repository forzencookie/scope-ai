/**
 * Processed Receipts API
 * 
 * GET: Fetches receipts from Supabase (read-only)
 * Writes go through /api/receive
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/server-db"

export async function GET() {
  try {
    const data = await db.get()
    const receipts = data.receipts || []

    return NextResponse.json({
      receipts,
      count: receipts.length,
      type: "processed"
    })

  } catch (error) {
    console.error('Error fetching receipts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    )
  }
}
