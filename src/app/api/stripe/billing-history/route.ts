import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { getStripe } from '@/lib/stripe'
import { getSupabaseAdmin } from '@/lib/database/supabase'

/**
 * GET /api/stripe/billing-history
 *
 * Returns the user's billing history:
 * - Stripe invoices (subscription payments)
 * - Credit purchases from usercredits table
 * Combined and sorted by date descending.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)

        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const supabase = getSupabaseAdmin()

        // Get user's Stripe customer ID
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await supabase
            .from('profiles' as any)
            .select('stripe_customer_id')
            .eq('id', auth.userId)
            .single()

        const customerId = (profile as { stripe_customer_id?: string } | null)?.stripe_customer_id

        // Fetch credit purchases from our DB
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: credits } = await supabase
            .from('usercredits' as any)
            .select('id, credits_purchased, price_paid_cents, currency, stripe_payment_id, purchased_at')
            .eq('user_id', auth.userId)
            .order('purchased_at', { ascending: false })
            .limit(20)

        interface BillingItem {
            id: string
            date: string
            description: string
            amount: string
            status: 'Betald' | 'Obetald' | 'Väntande'
            type: 'subscription' | 'credits'
            invoiceUrl?: string
            receiptUrl?: string
        }

        const items: BillingItem[] = []

        // Add credit purchases
        if (credits) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const credit of (credits as unknown) as Array<{
                id: string
                credits_purchased: number
                price_paid_cents: number | null
                currency: string
                stripe_payment_id: string | null
                purchased_at: string
            }>) {
                const priceSek = credit.price_paid_cents
                    ? Math.round(credit.price_paid_cents / 100)
                    : 0
                items.push({
                    id: credit.id.slice(0, 8),
                    date: credit.purchased_at,
                    description: `AI Credits — ${(credit.credits_purchased / 1_000_000).toFixed(0)}M tokens`,
                    amount: `${priceSek} kr`,
                    status: 'Betald',
                    type: 'credits',
                })
            }
        }

        // Fetch Stripe invoices if customer exists
        if (customerId) {
            try {
                const stripe = getStripe()
                const invoices = await stripe.invoices.list({
                    customer: customerId,
                    limit: 20,
                })

                for (const invoice of invoices.data) {
                    const status: BillingItem['status'] =
                        invoice.status === 'paid' ? 'Betald' :
                        invoice.status === 'open' ? 'Obetald' : 'Väntande'

                    const amountSek = Math.round((invoice.amount_paid || invoice.amount_due || 0) / 100)

                    items.push({
                        id: invoice.number || invoice.id.slice(0, 8),
                        date: new Date(invoice.created * 1000).toISOString(),
                        description: invoice.lines.data[0]?.description || 'Scope AI Pro',
                        amount: `${amountSek} kr`,
                        status,
                        type: 'subscription',
                        invoiceUrl: invoice.hosted_invoice_url ?? undefined,
                        receiptUrl: invoice.invoice_pdf ?? undefined,
                    })
                }
            } catch (error) {
                console.error('[Billing History] Failed to fetch Stripe invoices:', error)
                // Continue without Stripe data — still show credit purchases
            }
        }

        // Sort by date descending
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Also return payment method info if available
        let paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null = null

        if (customerId) {
            try {
                const stripe = getStripe()
                const methods = await stripe.paymentMethods.list({
                    customer: customerId,
                    type: 'card',
                    limit: 1,
                })

                if (methods.data[0]?.card) {
                    const card = methods.data[0].card
                    paymentMethod = {
                        brand: card.brand,
                        last4: card.last4,
                        expMonth: card.exp_month,
                        expYear: card.exp_year,
                    }
                }
            } catch (error) {
                console.error('[Billing History] Failed to fetch payment method:', error)
            }
        }

        return NextResponse.json({ items, paymentMethod })

    } catch (error) {
        console.error('[Billing History] Error:', error)
        return ApiResponse.serverError('Failed to fetch billing history')
    }
}
