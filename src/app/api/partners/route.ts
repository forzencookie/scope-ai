/**
 * Partners API
 * 
 * SECURITY: Requires authentication and uses user-scoped database
 * Previously used anon client which bypassed RLS!
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

export async function GET(request: NextRequest) {
  // Verify authentication
  const auth = await verifyAuth(request)
  if (!auth) {
    return ApiResponse.unauthorized('Authentication required')
  }

  try {
    const db = await createUserScopedDb()
    if (!db) {
      return ApiResponse.unauthorized('Could not establish database connection')
    }
    const partners = await db.partners.list()

    return NextResponse.json({ partners })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const auth = await verifyAuth(request)
  if (!auth) {
    return ApiResponse.unauthorized('Authentication required')
  }

  try {
    const json = await request.json()
    const db = await createUserScopedDb()
    if (!db) {
      return ApiResponse.unauthorized('Could not establish database connection')
    }
    
    // Add user_id to the partner data
    const partner = await db.partners.create({
      ...json,
      user_id: auth.userId
    })

    return NextResponse.json({ partner })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
