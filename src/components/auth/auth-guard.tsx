"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
    children: React.ReactNode
    /** Where to redirect if not authenticated */
    redirectTo?: string
    /** Show loading spinner while checking auth */
    showLoading?: boolean
}

/**
 * AuthGuard - Client-side authentication wrapper
 *
 * This is a defense-in-depth measure. The middleware handles the primary
 * route protection, but this provides a better UX with loading states
 * and handles edge cases where the client state might be stale.
 */
export function AuthGuard({
    children,
    redirectTo = "/login",
    showLoading = true,
}: AuthGuardProps) {
    const { user, loading, isAuthenticated } = useAuth()
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        // Wait for auth to load
        if (loading) return

        // If not authenticated, redirect
        if (!isAuthenticated) {
            const currentPath = window.location.pathname
            const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`
            router.replace(loginUrl)
        } else {
            setIsChecking(false)
        }
    }, [loading, isAuthenticated, router, redirectTo])

    // Show loading while checking authentication
    if (loading || isChecking) {
        if (!showLoading) return null

        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Laddar...</p>
                </div>
            </div>
        )
    }

    // Not authenticated - will redirect, don't render children
    if (!isAuthenticated) {
        return null
    }

    // Authenticated - render children
    return <>{children}</>
}

/**
 * Hook to check if user is authenticated
 * Use this in components that need auth status without the guard wrapper
 */
export function useRequireAuth(redirectTo = "/login") {
    const { user, loading, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            const currentPath = window.location.pathname
            router.replace(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`)
        }
    }, [loading, isAuthenticated, router, redirectTo])

    return { user, loading, isAuthenticated }
}
