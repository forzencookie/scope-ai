"use client"

import { useCallback } from "react"

export interface PageContext {
    pageName: string
    initialPrompt: string
    autoSend?: boolean
    returnTo?: string
    actionTrigger?: {
        icon: 'document' | 'meeting' | 'receipt' | 'invoice' | 'decision' | 'shareholders' | 'audit'
        title: string
        subtitle?: string
        meta?: string
    }
}

export const AI_CHAT_EVENT = "open-ai-chat"

let _pendingAIContext: PageContext | null = null

export function setPendingAIContext(context: PageContext | null) {
    _pendingAIContext = context
}

export function consumePendingAIContext(): PageContext | null {
    const context = _pendingAIContext
    _pendingAIContext = null
    return context
}

export function useNavigateToAIChat() {
    const navigateToAI = useCallback((context: PageContext) => {
        const event = new CustomEvent(AI_CHAT_EVENT, { detail: context })
        window.dispatchEvent(event)
    }, [])

    return navigateToAI
}
