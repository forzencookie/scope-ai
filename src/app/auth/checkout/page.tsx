'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function CheckoutRedirectContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  
  const plan = searchParams.get('plan')

  useEffect(() => {
    async function redirectToCheckout() {
      if (!plan || !['pro', 'enterprise'].includes(plan)) {
        router.push('/choose-plan')
        return
      }

      try {
        const response = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: plan }),
        })
        
        const data = await response.json()
        
        if (data.url) {
          window.location.href = data.url
        } else {
          setError('Could not create checkout session')
          setTimeout(() => router.push('/choose-plan'), 3000)
        }
      } catch {
        setError('Something went wrong')
        setTimeout(() => router.push('/choose-plan'), 3000)
      }
    }

    redirectToCheckout()
  }, [plan, router])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <p className="text-red-600 mb-2">{error}</p>
        <p className="text-stone-500 text-sm">Redirecting to plan selection...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-stone-600 mb-4" />
      <p className="text-stone-600">Preparing your checkout...</p>
    </div>
  )
}

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    }>
      <CheckoutRedirectContent />
    </Suspense>
  )
}
