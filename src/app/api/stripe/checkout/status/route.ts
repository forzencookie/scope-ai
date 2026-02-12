import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/api-auth'
import { getStripe } from '@/lib/stripe'

/**
 * GET /api/stripe/checkout/status?session_id=X
 *
 * Retrieves the status of a Stripe Checkout session.
 * Used by the return page after embedded checkout completes.
 */
export async function GET(request: NextRequest) {
    try {
        const sessionId = request.nextUrl.searchParams.get('session_id')

        if (!sessionId) {
            return ApiResponse.badRequest('Missing session_id parameter')
        }

        const stripe = getStripe()
        const session = await stripe.checkout.sessions.retrieve(sessionId)

        return NextResponse.json({
            status: session.status,
            customerEmail: session.customer_details?.email ?? null,
            paymentStatus: session.payment_status,
        })
    } catch (error) {
        console.error('[Stripe Checkout Status] Error:', error)
        return ApiResponse.serverError('Failed to retrieve checkout session status')
    }
}
