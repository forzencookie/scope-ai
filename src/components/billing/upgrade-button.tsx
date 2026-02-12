"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, Crown, Zap } from 'lucide-react'

interface UpgradeButtonProps {
    tier: 'pro' | 'enterprise'
    currentTier?: string
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg'
    className?: string
}

const TIER_CONFIG = {
    pro: {
        label: 'Upgrade to Pro',
        icon: Zap,
        color: 'bg-blue-600 hover:bg-blue-700',
    },
    enterprise: {
        label: 'Upgrade to Enterprise',
        icon: Crown,
        color: 'bg-purple-600 hover:bg-purple-700',
    },
}

export function UpgradeButton({
    tier,
    currentTier,
    variant = 'default',
    size = 'default',
    className,
}: UpgradeButtonProps) {
    const router = useRouter()
    const config = TIER_CONFIG[tier]
    const Icon = config.icon

    // Don't show if user already has this tier or higher
    const tierOrder = ['free', 'pro', 'enterprise']
    const currentIndex = tierOrder.indexOf(currentTier || 'free')
    const targetIndex = tierOrder.indexOf(tier)

    if (currentIndex >= targetIndex) {
        return null
    }

    const handleUpgrade = () => {
        router.push(`/dashboard/checkout?type=subscription&tier=${tier}`)
    }

    return (
        <Button
            onClick={handleUpgrade}
            variant={variant}
            size={size}
            className={className}
        >
            <Icon className="h-4 w-4 mr-2" />
            {config.label}
        </Button>
    )
}

interface ManageSubscriptionButtonProps {
    hasSubscription?: boolean
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg'
    className?: string
}

export function ManageSubscriptionButton({
    hasSubscription = true,
    variant = 'outline',
    size = 'default',
    className,
}: ManageSubscriptionButtonProps) {
    const [loading, setLoading] = useState(false)

    if (!hasSubscription) {
        return null
    }

    const handleManage = async () => {
        setLoading(true)

        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
            })

            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                console.error('No portal URL returned')
                setLoading(false)
            }
        } catch (error) {
            console.error('Failed to create portal session:', error)
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleManage}
            disabled={loading}
            variant={variant}
            size={size}
            className={className}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <Sparkles className="h-4 w-4 mr-2" />
            )}
            Hantera prenumeration
        </Button>
    )
}
