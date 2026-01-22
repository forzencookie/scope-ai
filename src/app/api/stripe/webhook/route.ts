import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, getTierFromPriceId, updateUserTier, getUserIdFromCustomer } from '@/lib/stripe'
import Stripe from 'stripe'

/**
 * POST /api/stripe/webhook
 * 
 * Handles Stripe webhooks for subscription events.
 * Updates user tier automatically on payment/cancellation.
 */
export async function POST(request: NextRequest) {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
        console.error('[Stripe Webhook] No signature provided')
        return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
        console.error('[Stripe Webhook] Webhook secret not configured')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`)

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                await handleCheckoutCompleted(session)
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionUpdated(subscription)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionDeleted(subscription)
                break
            }

            default:
                console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })

    } catch (error) {
        console.error('[Stripe Webhook] Error processing event:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}

// ============================================================================
// Event Handlers
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.supabase_user_id
    const tier = session.metadata?.tier as 'pro' | 'enterprise' | undefined

    if (!userId) {
        console.error('[Stripe Webhook] No user ID in session metadata')
        return
    }

    if (tier) {
        await updateUserTier(userId, tier)
        console.log(`[Stripe Webhook] Checkout completed - upgraded user ${userId} to ${tier}`)
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string
    const userId = await getUserIdFromCustomer(customerId)

    if (!userId) {
        console.error('[Stripe Webhook] No user found for customer:', customerId)
        return
    }

    // Check subscription status
    if (subscription.status === 'active' || subscription.status === 'trialing') {
        // Get the price ID from the subscription
        const priceId = subscription.items.data[0]?.price.id
        if (priceId) {
            const tier = getTierFromPriceId(priceId)
            await updateUserTier(userId, tier)
            console.log(`[Stripe Webhook] Subscription updated - user ${userId} now has ${tier}`)
        }
    } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
        await updateUserTier(userId, 'free')
        console.log(`[Stripe Webhook] Subscription inactive - downgraded user ${userId} to free`)
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string
    const userId = await getUserIdFromCustomer(customerId)

    if (!userId) {
        console.error('[Stripe Webhook] No user found for customer:', customerId)
        return
    }

    // Downgrade to free tier
    await updateUserTier(userId, 'free')
    console.log(`[Stripe Webhook] Subscription deleted - downgraded user ${userId} to free`)
}
