/**
 * Validation utilities for Chat API
 */

import { NextRequest } from 'next/server'

// Token limits for input validation
const MAX_INPUT_TOKENS = 3500
const AVG_CHARS_PER_TOKEN = 4

/**
 * Estimate the token count for a given text
 */
export function estimateTokenCount(text: string): number {
    const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) || []).length / Math.max(text.length, 1)
    const charsPerToken = nonAsciiRatio > 0.2 ? 2.5 : AVG_CHARS_PER_TOKEN
    return Math.ceil(text.length / charsPerToken)
}

/**
 * Validate that messages don't exceed token limits
 */
export function validateTokenLimits(messages: Array<{ role: string; content: string }>): { valid: boolean; error?: string } {
    let totalTokens = 0
    for (const message of messages) {
        totalTokens += estimateTokenCount(message.content || '')
    }
    if (totalTokens > MAX_INPUT_TOKENS) {
        return {
            valid: false,
            error: `Message content too long. Please reduce your message size. (Estimated ${totalTokens} tokens, max ${MAX_INPUT_TOKENS})`
        }
    }
    return { valid: true }
}

/**
 * Validate request origin for CSRF protection
 */
export function validateRequestOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    if (!origin && !referer) {
        const apiKey = request.headers.get('x-api-key')
        if (apiKey) return true
        if (process.env.NODE_ENV === 'development') return true
        return false
    }

    const requestOrigin = origin || (referer ? new URL(referer).origin : null)
    if (!requestOrigin) return process.env.NODE_ENV === 'development'

    try {
        const originHost = new URL(requestOrigin).host
        if (host && originHost === host) return true
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
        if (allowedOrigins.includes(requestOrigin) || allowedOrigins.includes(originHost)) return true
        if (process.env.NODE_ENV === 'development') return true
        return false
    } catch {
        return false
    }
}
