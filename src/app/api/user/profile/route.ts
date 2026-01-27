/**
 * User Profile API
 * 
 * Returns the current user's profile including subscription tier.
 * Security: Tier is read from DB, not from client. Client can display
 * tier info but cannot use it to bypass server-side authorization.
 */

import { NextRequest } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { getSupabaseAdmin } from '@/lib/database/supabase'
import { isDemoTier, isPaidTier, type SubscriptionTier } from '@/lib/subscription'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await verifyAuth(request)
    if (!auth) {
      return ApiResponse.unauthorized('Authentication required')
    }

    // Query profile from Supabase using admin client
    const supabase = getSupabaseAdmin()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, role, subscription_tier, created_at, updated_at')
      .eq('id', auth.userId)
      .single()

    if (error || !profile) {
      console.error('[Profile API] Failed to fetch profile:', error)
      return ApiResponse.serverError('Failed to fetch profile')
    }

    // Normalize tier and add convenience flags
    const tier = (profile.subscription_tier === 'free' ? 'demo' : (profile.subscription_tier || 'demo')) as SubscriptionTier

    const normalizedProfile = {
      ...profile,
      subscription_tier: tier,
      // Convenience flags for client - derived server-side for consistency
      is_demo: isDemoTier(tier),
      is_paid: isPaidTier(tier),
    }

    return Response.json(normalizedProfile)
  } catch (error) {
    console.error('[Profile API] Unexpected error:', error)
    return ApiResponse.serverError('Internal server error')
  }
}
