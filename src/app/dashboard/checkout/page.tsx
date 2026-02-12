'use client'

import { useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStripeClient } from '@/lib/stripe-client'

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const type = searchParams.get('type') // 'subscription' | 'credits'
    const tier = searchParams.get('tier') // 'pro' | 'enterprise'
    const tokens = searchParams.get('tokens') // e.g. '5000000'

    const fetchClientSecret = useCallback(async () => {
        if (type === 'credits' && tokens) {
            const response = await fetch('/api/stripe/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokens: Number(tokens), embedded: true }),
            })
            const data = await response.json()
            return data.clientSecret
        }

        // Default: subscription checkout
        const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tier: tier || 'pro', embedded: true }),
        })
        const data = await response.json()
        return data.clientSecret
    }, [type, tier, tokens])

    return (
        <div className="min-h-screen bg-stone-50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="mb-6"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Tillbaka
                </Button>

                <h1 className="text-2xl font-bold text-stone-900 mb-2">
                    {type === 'credits' ? 'Köp credits' : 'Uppgradera din plan'}
                </h1>
                <p className="text-stone-600 mb-8">
                    {type === 'credits'
                        ? 'Slutför ditt köp av extra AI-credits.'
                        : 'Slutför din uppgradering till en betald plan.'}
                </p>

                <div id="checkout" className="rounded-xl border bg-white overflow-hidden">
                    <EmbeddedCheckoutProvider
                        stripe={getStripeClient()}
                        options={{ fetchClientSecret }}
                    >
                        <EmbeddedCheckout />
                    </EmbeddedCheckoutProvider>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-stone-50">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-stone-400 mx-auto mb-3" />
                        <p className="text-stone-500">Laddar betalning...</p>
                    </div>
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    )
}
