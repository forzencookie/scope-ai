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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await supabase
        .from('profiles' as any)
        .select('stripe_customer_id')
        .eq('id', userId)
        .single()

    const profileData = profile as { stripe_customer_id?: string } | null
    if (profileData?.stripe_customer_id) {
        return profileData.stripe_customer_id
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    discountCode?: string  // Optional Stripe promotion code
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(options: CreateCheckoutOptions): Promise<string> {
    const { userId, email, tier, successUrl, cancelUrl, discountCode } = options

    const priceId = PRICE_IDS[tier]
    if (!priceId) {
        throw new Error(`No price ID configured for tier: ${tier}`)
    }

    // Get or create customer
    const customerId = await getOrCreateCustomer(userId, email)

    // Build session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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
    }

    // Add discount code if provided
    if (discountCode) {
        sessionConfig.discounts = [{ promotion_code: discountCode }]
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await supabase
        .from('profiles' as any)
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

    return (data as { id?: string } | null)?.id || null
}

// ============================================================================
// Credit Management
// ============================================================================

/**
 * Add purchased credits to a user's account
 */
export async function addUserCredits(
    userId: string,
    credits: number,
    stripePaymentId?: string,
    pricePaidCents?: number
): Promise<void> {
    const { getSupabaseAdmin } = await import('./database/supabase')
    const supabase = getSupabaseAdmin()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc('add_user_credits' as any, {
        p_user_id: userId,
        p_credits: credits,
        p_stripe_payment_id: stripePaymentId ?? null,
        p_price_paid_cents: pricePaidCents ?? null,
    } as any)

    if (error) {
        console.error('[Stripe] Failed to add credits:', error)
        throw new Error('Failed to add credits to user account')
    }

    console.log(`[Stripe] Added ${credits} credits to user ${userId}`)
}

/**
 * Get a user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<number> {
    const { getSupabaseAdmin } = await import('./database/supabase')
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase.rpc('get_user_credits', {
        p_user_id: userId,
    })

    if (error) {
        console.error('[Stripe] Failed to get credits:', error)
        return 0
    }

    return data || 0
}
