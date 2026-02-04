"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { OnboardingPage } from "@/components/onboarding/onboarding-page"

export default function Onboarding() {
    const router = useRouter()

    const handleComplete = async () => {
        try {
            const response = await fetch('/api/onboarding/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' }),
            })

            if (response.ok) {
                router.push('/dashboard')
            }
        } catch (error) {
            console.error('[Onboarding] Error completing:', error)
            // Still redirect on error
            router.push('/dashboard')
        }
    }

    const handleSkip = async () => {
        try {
            await fetch('/api/onboarding/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'skip' }),
            })
        } catch (error) {
            console.error('[Onboarding] Error skipping:', error)
        }
        router.push('/dashboard')
    }

    return (
        <OnboardingPage
            onComplete={handleComplete}
            onSkip={handleSkip}
        />
    )
}
