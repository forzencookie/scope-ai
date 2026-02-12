'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function CheckoutRedirectContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const plan = searchParams.get('plan')

  useEffect(() => {
    if (!plan || !['pro', 'enterprise'].includes(plan)) {
      router.push('/choose-plan')
      return
    }

    router.push(`/dashboard/checkout?type=subscription&tier=${plan}`)
  }, [plan, router])

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
