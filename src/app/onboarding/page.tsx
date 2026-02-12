"use client"

import { useRouter } from "next/navigation"
import { CompanyProvider } from "@/providers/company-provider"
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
        <CompanyProvider>
            <OnboardingPage
                onComplete={handleComplete}
                onSkip={handleSkip}
            />
        </CompanyProvider>
    )
}
