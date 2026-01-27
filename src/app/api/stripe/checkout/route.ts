import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { createCheckoutSession, PRICE_IDS } from '@/lib/stripe'

/**
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe Checkout session for subscription upgrade.
 * Body: { tier: 'pro' | 'enterprise', discountCode?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)

        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const body = await request.json()
        const { tier, discountCode } = body

        if (!tier || !['pro', 'enterprise'].includes(tier)) {
            return ApiResponse.badRequest('Invalid tier. Must be "pro" or "enterprise"')
        }

        // Check if price IDs are configured
        if (!PRICE_IDS[tier as 'pro' | 'enterprise']) {
            return ApiResponse.serverError(`Price ID not configured for tier: ${tier}`)
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const checkoutUrl = await createCheckoutSession({
            userId: auth.userId,
            email: auth.email,
            tier: tier as 'pro' | 'enterprise',
            successUrl: `${origin}/dashboard/settings?payment=success`,
            cancelUrl: `${origin}/dashboard/settings?payment=cancelled`,
            discountCode: discountCode || undefined,
        })

        return NextResponse.json({ url: checkoutUrl })

    } catch (error) {
        console.error('[Stripe Checkout] Error:', error)
        return ApiResponse.serverError('Failed to create checkout session')
    }
}
