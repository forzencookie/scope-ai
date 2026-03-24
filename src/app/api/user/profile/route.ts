/**
 * User Profile API
 * 
 * Returns the current user's profile including subscription tier.
 * Security: Tier is read from DB, not from client. Client can display
 * tier info but cannot use it to bypass server-side authorization.
 */

import { NextRequest } from 'next/server'
import { verifyAuth, ApiResponse } from "@/lib/database/auth-server"
import { createServerClient } from '@/lib/database/server'
import { isPaidTier, type SubscriptionTier } from '@/lib/subscription'
import type { Database } from '@/types/database'

const ALLOWED_UPDATES = ['full_name', 'avatar_emoji'] as const

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return ApiResponse.unauthorized('Authentication required')
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    for (const key of ALLOWED_UPDATES) {
      if (key in body) updates[key] = body[key]
    }

    if (Object.keys(updates).length === 0) {
      return ApiResponse.badRequest('No valid fields to update')
    }

    const supabase = await createServerClient()
    const { error } = await supabase
      .from('profiles')
      .update(updates as Database['public']['Tables']['profiles']['Update'])
      .eq('id', auth.userId)

    if (error) {
      console.error('[Profile API] Failed to update profile:', error)
      return ApiResponse.serverError('Failed to update profile')
    }

    return Response.json({})
  } catch (error) {
    console.error('[Profile API] Unexpected error:', error)
    return ApiResponse.serverError('Internal server error')
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await verifyAuth(request)
    if (!auth) {
      return ApiResponse.unauthorized('Authentication required')
    }

    // Query profile from Supabase using admin client
    const supabase = await createServerClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, avatar_emoji, role, subscription_tier, created_at, updated_at')
      .eq('id', auth.userId)
      .single()

    if (error || !profile) {
      console.error('[Profile API] Failed to fetch profile:', error)
      return ApiResponse.serverError('Failed to fetch profile')
    }

    // Normalize tier and add convenience flags
    const rawTier = profile.subscription_tier ?? 'pro'
    const tier = (['pro', 'max'].includes(rawTier) ? rawTier : 'pro') as SubscriptionTier

    const normalizedProfile = {
      ...profile,
      subscription_tier: tier,
      // Convenience flag for client - derived server-side for consistency
      is_paid: true, // All users are paid
    }

    return Response.json(normalizedProfile)
  } catch (error) {
    console.error('[Profile API] Unexpected error:', error)
    return ApiResponse.serverError('Internal server error')
  }
}
