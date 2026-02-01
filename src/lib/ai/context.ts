"use client"

import { useCallback } from "react"

// Page types that can be mentioned in AI chat
export type AIPageType =
    | "inkomstdeklaration"
    | "agi"
    | "moms"
    | "arsredovisning"
    | "arsbokslut"
    | "ne-bilaga"
    | "lonebesked"
    | "k10"
    | "faktura"
    | "kvitto"
    | "transaktion"
    | "verifikation"
    | "resultatrakning"
    | "balansrakning"


export interface PageContext {
    /** Display name of the page/module */
    pageName: string
    /** Technical page type identifier */
    pageType: AIPageType
    /** The initial prompt to send */
    initialPrompt: string
    /** Whether to auto-send the message on arrival */
    autoSend?: boolean
    /** Action trigger display (shows chip instead of raw prompt) */
    actionTrigger?: {
        icon: 'document' | 'meeting' | 'receipt' | 'invoice' | 'decision' | 'shareholders' | 'audit'
        title: string
        subtitle?: string
        meta?: string
    }
}

/**
 * Build a URL to the AI chat page with context
 * Example: /dashboard/ai-robot?prompt=Generate...&pageType=agi&pageName=AGI&autoSend=true
 */
export function buildAIChatUrl(context: PageContext): string {
    const params = new URLSearchParams()

    params.set("prompt", context.initialPrompt)
    params.set("pageType", context.pageType)
    params.set("pageName", context.pageName)

    if (context.autoSend) {
        params.set("autoSend", "true")
    }

    return `/dashboard/ai-robot?${params.toString()}`
}

/**
 * Custom event for opening AI chat with context
 */
export const AI_CHAT_EVENT = "open-ai-chat"

/**
 * Pending AI context store.
 * When the sidebar isn't mounted yet, context is stored here
 * and consumed when the AI chat sidebar mounts.
 */
let _pendingAIContext: PageContext | null = null

export function setPendingAIContext(context: PageContext | null) {
    _pendingAIContext = context
}

export function consumePendingAIContext(): PageContext | null {
    const context = _pendingAIContext
    _pendingAIContext = null
    return context
}

/**
 * Hook to navigate to AI chat with context
 * Now instead of navigating to a page, it dispatches an event that the sidebar listens to.
 */
export function useNavigateToAIChat() {
    const navigateToAI = useCallback((context: PageContext) => {
        const event = new CustomEvent(AI_CHAT_EVENT, { detail: context })
        window.dispatchEvent(event)
    }, [])

    return navigateToAI
}

// Predefined AI prompts for each page type
export const AI_PROMPTS: Record<AIPageType, { title: string; prompt: string }> = {
    inkomstdeklaration: {
        title: "Inkomstdeklaration",
        prompt: "Generera INK2-deklaration baserat på bokföringen för innevarande beskattningsår."
    },
    agi: {
        title: "AGI",
        prompt: "Skapa arbetsgivardeklaration (AGI) för innevarande period baserat på lönedata."
    },
    moms: {
        title: "Momsdeklaration",
        prompt: "Generera momsdeklaration baserat på verifikationer för aktuell period."
    },
    arsredovisning: {
        title: "Årsredovisning",
        prompt: "Skapa årsredovisning med resultat- och balansräkning baserat på bokföringen."
    },
    arsbokslut: {
        title: "Årsbokslut",
        prompt: "Generera årsbokslut med periodiseringar och bokslutsposter."
    },
    "ne-bilaga": {
        title: "NE-bilaga",
        prompt: "Skapa NE-bilaga för enskild näringsidkare baserat på bokföringen."
    },
    lonebesked: {
        title: "Lönebesked",
        prompt: "Skapa ett nytt lönebesked för vald anställd."
    },
    k10: {
        title: "K10",
        prompt: "Beräkna gränsbelopp och generera K10-blankett för kvalificerade andelar."
    },
    faktura: {
        title: "Faktura",
        prompt: "Hjälp mig med fakturan."
    },
    kvitto: {
        title: "Kvitto",
        prompt: "Hjälp mig med kvittot."
    },
    transaktion: {
        title: "Transaktion",
        prompt: "Hjälp mig med transaktionen."
    },
    verifikation: {
        title: "Verifikation",
        prompt: "Hjälp mig med verifikationen."
    },
    resultatrakning: {
        title: "Resultaträkning",
        prompt: "Analysera resultaträkningen och identifiera viktiga trender eller avvikelser."
    },
    balansrakning: {
        title: "Balansräkning",
        prompt: "Analysera balansräkningen och bedöm bolagets finansiella ställning."
    },

}

/**
 * Get the default AI context for a page type
 */
export function getDefaultAIContext(pageType: AIPageType, autoSend = true): PageContext {
    const config = AI_PROMPTS[pageType]
    return {
        pageName: config.title,
        pageType,
        initialPrompt: config.prompt,
        autoSend
    }
}
