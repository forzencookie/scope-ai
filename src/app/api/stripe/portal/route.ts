import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { createPortalSession } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/database/supabase'

/**
 * POST /api/stripe/portal
 * 
 * Creates a Stripe Customer Portal session for managing subscription.
 * User can update payment method, view invoices, cancel subscription.
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)

        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const supabase = getSupabaseAdmin()

        // Get user's Stripe customer ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', auth.userId)
            .single()

        const customerId = (profile as any)?.stripe_customer_id

        if (!customerId) {
            return ApiResponse.badRequest('No active subscription found')
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const portalUrl = await createPortalSession(
            customerId,
            `${origin}/dashboard/settings`
        )

        return NextResponse.json({ url: portalUrl })

    } catch (error) {
        console.error('[Stripe Portal] Error:', error)
        return ApiResponse.serverError('Failed to create portal session')
    }
}
