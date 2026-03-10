"use client"

import { useMemo, useCallback } from "react"
import { useCompany } from "@/providers/company-provider"
import {
    quickActions,
    quickActionCategories,
    type QuickAction,
    type QuickActionCategory,
} from "@/lib/ai/quick-actions"

// ============================================
// Simple fuzzy match — checks if all query chars appear in order
// ============================================
function fuzzyMatch(query: string, target: string): boolean {
    const q = query.toLowerCase()
    const t = target.toLowerCase()

    // Fast path: substring match
    if (t.includes(q)) return true

    // Fuzzy: all characters of query appear in order
    let qi = 0
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) qi++
    }
    return qi === q.length
}

function scoreMatch(query: string, action: QuickAction): number {
    const q = query.toLowerCase()

    // Exact label match = highest
    if (action.label.toLowerCase().startsWith(q)) return 100

    // Label contains query
    if (action.label.toLowerCase().includes(q)) return 80

    // Description match
    if (action.description.toLowerCase().includes(q)) return 60

    // Keyword match
    for (const kw of action.keywords) {
        if (kw.toLowerCase().includes(q)) return 40
    }

    // Fuzzy match on label
    if (fuzzyMatch(q, action.label)) return 20

    // Fuzzy match on keywords
    for (const kw of action.keywords) {
        if (fuzzyMatch(q, kw)) return 10
    }

    return 0
}

// ============================================
// Hook
// ============================================

export interface QuickActionsResult {
    /** All actions available for the current company */
    actions: QuickAction[]
    /** Actions filtered and sorted by search query */
    search: (query: string) => QuickAction[]
    /** Actions grouped by category */
    grouped: Record<QuickActionCategory, QuickAction[]>
    /** Category metadata */
    categories: typeof quickActionCategories
}

export function useQuickActions(): QuickActionsResult {
    const { companyType, hasFeature } = useCompany()

    // Filter actions by company type and feature availability
    const actions = useMemo(() => {
        return quickActions.filter(action => {
            // Check company type restriction
            if (action.companyTypes && action.companyTypes.length > 0) {
                if (!action.companyTypes.includes(companyType)) return false
            }

            // Check feature availability
            if (action.feature) {
                if (!hasFeature(action.feature)) return false
            }

            return true
        })
    }, [companyType, hasFeature])

    // Group by category
    const grouped = useMemo(() => {
        const groups: Record<QuickActionCategory, QuickAction[]> = {
            vanliga: [],
            bokforing: [],
            rapporter: [],
            loner: [],
            bolag: [],
        }

        for (const action of actions) {
            groups[action.category].push(action)
        }

        return groups
    }, [actions])

    // Search function — returns sorted matches
    const search = useCallback((query: string): QuickAction[] => {
        if (!query.trim()) return actions

        const scored = actions
            .map(action => ({ action, score: scoreMatch(query, action) }))
            .filter(({ score }) => score > 0)
            .sort((a, b) => b.score - a.score)

        return scored.map(({ action }) => action)
    }, [actions])

    return {
        actions,
        search,
        grouped,
        categories: quickActionCategories,
    }
}
