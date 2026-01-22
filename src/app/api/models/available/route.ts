import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { getAvailableModels, getUserTier, TIER_LIMITS, getMonthlyUsage } from '@/lib/model-auth'

/**
 * GET /api/models/available
 * 
 * Returns the list of AI models available to the authenticated user
 * based on their subscription tier, along with usage information.
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)

        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const userId = auth.userId

        // Get user's available models based on tier
        const [availableModels, userTier, usage] = await Promise.all([
            getAvailableModels(userId),
            getUserTier(userId),
            getMonthlyUsage(userId)
        ])

        const limits = TIER_LIMITS[userTier]

        return NextResponse.json({
            models: availableModels.map(m => ({
                id: m.id,
                name: m.name,
                provider: m.provider,
                tier: m.tier,
                description: m.description
            })),
            tier: userTier,
            usage: {
                tokensUsed: usage?.tokensUsed || 0,
                tokensLimit: limits.tokensPerMonth,
                tokensRemaining: Math.max(0, limits.tokensPerMonth - (usage?.tokensUsed || 0)),
                requestsCount: usage?.requestsCount || 0,
                requestsLimit: limits.requestsPerDay,
                periodStart: usage?.periodStart || new Date(),
                periodEnd: usage?.periodEnd || new Date()
            }
        })

    } catch (error) {
        console.error('Models API error:', error)
        return ApiResponse.serverError('Failed to fetch available models')
    }
}
