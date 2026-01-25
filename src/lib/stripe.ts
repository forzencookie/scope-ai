/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Stripe Client and Helper Functions
 * 
 * Handles Stripe operations for subscription management.
 * Tiers: free (no subscription), pro, enterprise
 */

// TODO: Run migration to add stripe_customer_id, then regenerate types

import Stripe from 'stripe'

// ============================================================================
// Client Initialization (Lazy)
// ============================================================================

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
    if (!stripeInstance) {
        if (!process.env.STRIPE_SECRET_KEY) {
            console.warn('[Stripe] STRIPE_SECRET_KEY not set - payment features disabled')
            throw new Error('Stripe is not configured')
        }
        stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
            typescript: true,
        })
    }
    return stripeInstance
}

// Legacy export for backward compatibility (deprecated)
export const stripe = {
    get customers() { return getStripe().customers },
    get subscriptions() { return getStripe().subscriptions },
    get checkout() { return getStripe().checkout },
    get billingPortal() { return getStripe().billingPortal },
    get webhooks() { return getStripe().webhooks },
    constructEvent: (...args: Parameters<Stripe['webhooks']['constructEvent']>) =>
        getStripe().webhooks.constructEvent(...args),
}

// ============================================================================
// Price IDs (set in environment variables)
// ============================================================================

export const PRICE_IDS = {
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || '',
}

// Map Stripe price IDs to subscription tiers
export function getTierFromPriceId(priceId: string): 'pro' | 'enterprise' | 'free' {
    if (priceId === PRICE_IDS.pro) return 'pro'
    if (priceId === PRICE_IDS.enterprise) return 'enterprise'
    return 'free'
}

// ============================================================================
// Customer Management
// ============================================================================

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
    userId: string,
    email: string,
    name?: string
): Promise<string> {
    const { getSupabaseAdmin } = await import('./database/supabase')
    const supabase = getSupabaseAdmin()

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

    if ((profile as any)?.stripe_customer_id) {
        return (profile as any).stripe_customer_id
    }

    // Create new customer
    const customer = await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
            supabase_user_id: userId,
        },
    })

    // Store customer ID in profile
    await supabase
        .from('profiles' as any)
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId)

    return customer.id
}

// ============================================================================
// Checkout Session
// ============================================================================

export interface CreateCheckoutOptions {
    userId: string
    email: string
    tier: 'pro' | 'enterprise'
    successUrl: string
    cancelUrl: string
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(options: CreateCheckoutOptions): Promise<string> {
    const { userId, email, tier, successUrl, cancelUrl } = options

    const priceId = PRICE_IDS[tier]
    if (!priceId) {
        throw new Error(`No price ID configured for tier: ${tier}`)
    }

    // Get or create customer
    const customerId = await getOrCreateCustomer(userId, email)

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            supabase_user_id: userId,
            tier,
        },
        subscription_data: {
            metadata: {
                supabase_user_id: userId,
            },
        },
    })

    if (!session.url) {
        throw new Error('Failed to create checkout session')
    }

    return session.url
}

// ============================================================================
// Customer Portal
// ============================================================================

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export async function createPortalSession(
    customerId: string,
    returnUrl: string
): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    })

    return session.url
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Update user's subscription tier based on Stripe subscription status
 */
export async function updateUserTier(
    userId: string,
    tier: 'free' | 'pro' | 'enterprise'
): Promise<void> {
    const { getSupabaseAdmin } = await import('./database/supabase')
    const supabase = getSupabaseAdmin()

    await supabase
        .from('profiles' as any)
        .update({ subscription_tier: tier })
        .eq('id', userId)

    console.log(`[Stripe] Updated user ${userId} to tier: ${tier}`)
}

/**
 * Get user ID from Stripe customer ID
 */
export async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
    const { getSupabaseAdmin } = await import('./database/supabase')
    const supabase = getSupabaseAdmin()

    const { data } = await supabase
        .from('profiles' as any)
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

    return (data as any)?.id || null
}
