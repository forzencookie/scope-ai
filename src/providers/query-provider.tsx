"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"

/**
 * Query Provider with optimized defaults for the app
 * 
 * Features:
 * - Smart stale time (data stays fresh for 30s)
 * - Background refetching on window focus
 * - Retry with exponential backoff
 * - Garbage collection for unused queries
 */

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Data stays fresh for 5 minutes — manual refresh button handles on-demand updates
                staleTime: 5 * 60 * 1000,
                // Cache unused data for 10 minutes before garbage collection
                gcTime: 10 * 60 * 1000,
                // Never refetch just because the user switched browser tabs
                refetchOnWindowFocus: false,
                // Refetch on mount only if data is actually stale
                refetchOnMount: true,
                // Retry failed requests 2 times with exponential backoff
                retry: 2,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            },
            mutations: {
                // Retry mutations once
                retry: 1,
            },
        },
    })
}

// Browser: create query client once per app
let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
    if (typeof window === "undefined") {
        // Server: always make a new query client
        return makeQueryClient()
    } else {
        // Browser: make a new query client if we don't already have one
        if (!browserQueryClient) browserQueryClient = makeQueryClient()
        return browserQueryClient
    }
}

export interface QueryProviderProps {
    children: ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
    // NOTE: Avoid useState when initializing the query client if you don't
    // have a suspense boundary between this and the code that might suspend.
    const [queryClient] = useState(() => getQueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}

// Export for use in hooks
export { getQueryClient }
