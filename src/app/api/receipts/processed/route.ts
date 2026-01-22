/**
 * Processed Receipts API
 *
 * GET: Fetches receipts from Supabase (read-only)
 * Writes go through /api/receive
 *
 * Security: Filters by authenticated user's company
 */

import { NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/api-auth"
import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get user's company_id for scoping
    const { data: user } = await supabase.auth.admin.getUserById(auth.userId)
    const companyId = user?.user?.user_metadata?.company_id

    // Fetch receipts scoped to user's company
    let query = supabase
      .from('receipts')
      .select('*')
      .order('captured_at', { ascending: false })

    // If user has a company, filter by it
    if (companyId) {
      query = query.eq('company_id', companyId)
    } else {
      // Fallback: filter by created_by user
      query = query.eq('created_by', auth.userId)
    }

    const { data: receipts, error } = await query

    if (error) {
      console.error('Error fetching receipts:', error)
      return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
    }

    return NextResponse.json({
      receipts: receipts?.map(r => ({ ...r, attachmentUrl: r.image_url })) || [],
      count: receipts?.length || 0,
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
