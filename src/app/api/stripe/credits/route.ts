import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { getOrCreateCustomer, getStripe } from '@/lib/stripe'
import { CREDIT_PACKAGES } from '@/lib/subscription'

/**
 * POST /api/stripe/credits
 * 
 * Creates a Stripe Checkout session for one-time credit purchase.
 * Uses dynamic pricing - no need to pre-create products in Stripe Dashboard.
 * Body: { tokens: number } - Must match a CREDIT_PACKAGES option
 */
export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)

        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const body = await request.json()
        const { tokens, embedded } = body

        // Validate tokens matches a package
        const creditPackage = CREDIT_PACKAGES.find(p => p.tokens === tokens)
        if (!creditPackage) {
            return ApiResponse.badRequest(
                `Invalid credit package. Valid options: ${CREDIT_PACKAGES.map(p => p.tokens).join(', ')}`
            )
        }

        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        // Get or create customer
        const customerId = await getOrCreateCustomer(auth.userId, auth.email)

        const stripe = getStripe()
        
        const lineItems = [
            {
                price_data: {
                    currency: 'sek',
                    product_data: {
                        name: `AI Credits - ${creditPackage.label}`,
                        description: `${creditPackage.label} för Scope AI-assistenten`,
                    },
                    unit_amount: creditPackage.price * 100, // Stripe uses öre (cents)
                },
                quantity: 1,
            },
        ]

        const metadata = {
            supabase_user_id: auth.userId,
            credit_tokens: tokens.toString(),
            credit_price_sek: creditPackage.price.toString(),
            purchase_type: 'credits',
        }

        if (embedded) {
            // Embedded checkout mode — return clientSecret
            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                ui_mode: 'embedded',
                mode: 'payment',
                line_items: lineItems,
                return_url: `${origin}/dashboard/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
                metadata,
            })

            return NextResponse.json({ clientSecret: session.client_secret })
        }

        // Standard redirect mode
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'payment',
            line_items: lineItems,
            success_url: `${origin}/dashboard?credits=success&tokens=${tokens}`,
            cancel_url: `${origin}/dashboard?credits=cancelled`,
            metadata,
        })

        if (!session.url) {
            throw new Error('Failed to create checkout session')
        }

        return NextResponse.json({
            url: session.url,
            sessionId: session.id,
        })

    } catch (error) {
        console.error('[Stripe Credits] Error:', error)
        return ApiResponse.serverError('Failed to create checkout session')
    }
}

/**
 * GET /api/stripe/credits
 * 
 * Returns available credit packages with prices.
 */
export async function GET() {
    return NextResponse.json({
        packages: CREDIT_PACKAGES.map(pkg => ({
            tokens: pkg.tokens,
            price: pkg.price,
            label: pkg.label,
            popular: pkg.popular || false,
            savings: pkg.savings,
        })),
    })
}
