"use client"

import { ToastProvider } from "@/components/ui"
import { useOnboarding } from "@/components/onboarding/onboarding-wizard"
import { CompanyProvider } from "@/providers/company-provider"
import { ModelProvider } from "@/providers/model-provider"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import React, { useEffect, Suspense } from "react"
import { Loader2 } from "lucide-react"
import { QueryProvider } from "@/providers/query-provider"
import { ChatProvider, ChatSessionGate } from "@/providers/chat-provider"
import { ChatHistorySidebar } from "@/components/layout/chat-history-sidebar"
import { MainContentArea } from "@/components/layout/main-content-area"
import { SettingsOverlay } from "@/components/installningar/settings-overlay"
import { ScopeAILogo } from "@/components/ui"
import { nullToUndefined } from "@/lib/utils"

function DashboardContentInner({ children }: { children: React.ReactNode }) {
    const { shouldRedirect, isLoading } = useOnboarding()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
    const settingsParam = searchParams?.get("settings")
    const [settingsOpen, setSettingsOpen] = useState(!!settingsParam)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

    // Auto-collapse sidebar on small screens
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 1024px)')
        setSidebarCollapsed(mq.matches)
        const handler = (e: MediaQueryListEvent) => setSidebarCollapsed(e.matches)
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [])

    useEffect(() => {
        setSettingsOpen(!!settingsParam)
    }, [settingsParam])

    const handleSettingsOpenChange = (open: boolean) => {
        if (!open && settingsParam) {
            const params = new URLSearchParams(searchParams?.toString())
            params.delete("settings")
            router.replace(`${pathname}?${params.toString()}`)
        }
        setSettingsOpen(open)
    }

    useEffect(() => {
        if (!isLoading && shouldRedirect) {
            router.push('/onboarding')
        }
    }, [isLoading, shouldRedirect, router])

    useEffect(() => {
        const handleAINavigate = (e: CustomEvent<{ route: string; newTab?: boolean }>) => {
            const { route, newTab } = e.detail
            if (newTab) {
                window.open(route, '_blank')
            } else {
                router.push(route)
            }
        }

        window.addEventListener('ai-navigate', handleAINavigate as EventListener)
        return () => window.removeEventListener('ai-navigate', handleAINavigate as EventListener)
    }, [router])

    // 1. Mandatory Onboarding Check — show nothing until we know status, or while redirecting
    if (isLoading || shouldRedirect) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                    <ScopeAILogo className="h-8 w-8 text-primary" />
                </div>
            </div>
        )
    }

    return (
        <ChatProvider>
            <div className="flex h-screen bg-background dark:bg-[oklch(0.12_0_0)]">
                {/* Chat History Sidebar — left, on grey background */}
                <ChatHistorySidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    onOpenSettings={() => setSettingsOpen(true)}
                />

                {/* Main Content Area — keyed per conversation for fresh chat state */}
                <ChatSessionGate>
                    <MainContentArea>
                        {children}

                        <SettingsOverlay
                            open={settingsOpen}
                            onOpenChange={handleSettingsOpenChange}
                            defaultTab={nullToUndefined(settingsParam)}
                        />
                    </MainContentArea>
                </ChatSessionGate>
            </div>
        </ChatProvider>
    )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <DashboardContentInner>
                {children}
            </DashboardContentInner>
        </Suspense>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard showLoading={false}>
            <QueryProvider>
                <ModelProvider>
                    <CompanyProvider>
                        <ToastProvider>
                            <DashboardContent>
                                {children}
                            </DashboardContent>
                        </ToastProvider>
                    </CompanyProvider>
                </ModelProvider>
            </QueryProvider>
        </AuthGuard>
    )
}
