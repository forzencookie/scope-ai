"use client"

import { useState, useCallback, useRef, useEffect } from "react"

// =============================================================================
// Types (mirrors API response)
// =============================================================================

export interface SearchResult {
    type: 'transaction' | 'invoice' | 'verification' | 'employee' | 'conversation'
    id: string
    label: string
    sublabel: string
    href: string
}

export interface SearchGroup {
    type: SearchResult['type']
    label: string
    results: SearchResult[]
}

export interface UseSearchReturn {
    query: string
    setQuery: (q: string) => void
    groups: SearchGroup[]
    total: number
    isSearching: boolean
}

// =============================================================================
// Hook
// =============================================================================

export function useSearch(): UseSearchReturn {
    const [query, setQuery] = useState("")
    const [groups, setGroups] = useState<SearchGroup[]>([])
    const [total, setTotal] = useState(0)
    const [isSearching, setIsSearching] = useState(false)

    const abortRef = useRef<AbortController | null>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const doSearch = useCallback(async (q: string) => {
        // Abort previous
        abortRef.current?.abort()

        if (!q || q.length < 2) {
            setGroups([])
            setTotal(0)
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        const controller = new AbortController()
        abortRef.current = controller

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
                signal: controller.signal,
            })

            if (!res.ok) {
                setGroups([])
                setTotal(0)
                return
            }

            const data = await res.json()
            setGroups(data.groups || [])
            setTotal(data.total || 0)
        } catch (e) {
            if (e instanceof DOMException && e.name === 'AbortError') return
            console.error('[useSearch] Error:', e)
            setGroups([])
            setTotal(0)
        } finally {
            setIsSearching(false)
        }
    }, [])

    // Debounced search
    const handleSetQuery = useCallback((q: string) => {
        setQuery(q)

        if (timerRef.current) clearTimeout(timerRef.current)

        if (!q || q.length < 2) {
            setGroups([])
            setTotal(0)
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        timerRef.current = setTimeout(() => doSearch(q), 300)
    }, [doSearch])

    // Cleanup
    useEffect(() => {
        return () => {
            abortRef.current?.abort()
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    return {
        query,
        setQuery: handleSetQuery,
        groups,
        total,
        isSearching,
    }
}
