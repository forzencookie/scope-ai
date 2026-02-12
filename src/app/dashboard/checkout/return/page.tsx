'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SessionStatus {
    status: string
    customerEmail: string | null
    paymentStatus: string
}

function ReturnContent() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const [session, setSession] = useState<SessionStatus | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!sessionId) {
            setLoading(false)
            return
        }

        async function fetchStatus() {
            try {
                const response = await fetch(
                    `/api/stripe/checkout/status?session_id=${sessionId}`
                )
                const data = await response.json()
                setSession(data)
            } catch (error) {
                console.error('[Checkout Return] Failed to fetch status:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchStatus()
    }, [sessionId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-stone-400 mx-auto mb-3" />
                    <p className="text-stone-500">Verifierar betalning...</p>
                </div>
            </div>
        )
    }

    const isSuccess = session?.status === 'complete'

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="max-w-md w-full mx-auto px-4 text-center">
                {isSuccess ? (
                    <>
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-stone-900 mb-2">
                            Betalning genomförd!
                        </h1>
                        <p className="text-stone-600 mb-1">
                            Tack för ditt köp.
                        </p>
                        {session.customerEmail && (
                            <p className="text-sm text-stone-500 mb-8">
                                En bekräftelse skickas till {session.customerEmail}.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-stone-900 mb-2">
                            Något gick fel
                        </h1>
                        <p className="text-stone-600 mb-8">
                            Betalningen kunde inte slutföras. Försök igen eller kontakta support.
                        </p>
                    </>
                )}

                <div className="flex flex-col gap-3">
                    <Button asChild>
                        <Link href="/dashboard/settings">
                            Gå till inställningar
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild>
                        <Link href="/dashboard">
                            Gå till dashboard
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function CheckoutReturnPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-stone-50">
                    <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                </div>
            }
        >
            <ReturnContent />
        </Suspense>
    )
}
