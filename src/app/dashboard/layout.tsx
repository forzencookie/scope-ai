"use client"

import { GlobalSearch } from "@/components/layout/global-search"
import { ToastProvider } from "@/components/ui/toast"
import { useOnboarding } from "@/components/onboarding/onboarding-wizard"
import { CompanyProvider } from "@/providers/company-provider"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { ModelProvider } from "@/providers/model-provider"
import { AIDialogProvider } from "@/providers/ai-overlay-provider"
import { AIOverlay } from "@/components/ai"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RefreshCw, MessageSquare, Plus } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import React, { useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { UserTeamSwitcher } from "@/components/layout/user-team-switcher"
import { QueryProvider } from "@/providers/query-provider"
import { Building2, Box } from "lucide-react"
import { cn } from "@/lib/utils"
import { AIChatPanel } from "@/components/layout/ai-chat-panel"
import { SettingsDialog } from "@/components/installningar/settings-dialog"
import { useSearchParams } from "next/navigation"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

const defaultTeam = {
    id: 'default',
    name: 'Mitt Foretag',
    logo: Building2,
}

// Module-level navigation history store
const navigationStore = {
    historyStack: [] as string[],
    currentIndex: -1,
    isNavigating: false,
    listeners: new Set<() => void>(),

    subscribe(listener: () => void) {
        this.listeners.add(listener)
        return () => { this.listeners.delete(listener) }
    },

    notify() {
        this.listeners.forEach(l => l())
    },

    push(pathname: string) {
        if (this.isNavigating) {
            this.isNavigating = false
            return
        }
        if (this.currentIndex < this.historyStack.length - 1) {
            this.historyStack = this.historyStack.slice(0, this.currentIndex + 1)
        }
        if (this.historyStack[this.historyStack.length - 1] !== pathname) {
            this.historyStack.push(pathname)
            this.currentIndex = this.historyStack.length - 1
            this.notify()
        }
    },

    get canGoBack() {
        return this.currentIndex > 0
    },

    get canGoForward() {
        return this.currentIndex < this.historyStack.length - 1
    }
}

function useNavigationHistory() {
    const pathname = usePathname()
    const router = useRouter()
    const [canGoBack, setCanGoBack] = useState(false)
    const [canGoForward, setCanGoForward] = useState(false)

    const updateState = useCallback(() => {
        setCanGoBack(navigationStore.currentIndex > 0)
        setCanGoForward(navigationStore.currentIndex < navigationStore.historyStack.length - 1)
    }, [])

    useEffect(() => {
        return navigationStore.subscribe(updateState)
    }, [updateState])

    useEffect(() => {
        navigationStore.push(pathname)
        setTimeout(() => updateState(), 0)
    }, [pathname, updateState])

    const goBack = useCallback(() => {
        if (navigationStore.currentIndex > 0) {
            navigationStore.isNavigating = true
            navigationStore.currentIndex--
            router.push(navigationStore.historyStack[navigationStore.currentIndex])
            updateState()
        }
    }, [router, updateState])

    const goForward = useCallback(() => {
        if (navigationStore.currentIndex < navigationStore.historyStack.length - 1) {
            navigationStore.isNavigating = true
            navigationStore.currentIndex++
            router.push(navigationStore.historyStack[navigationStore.currentIndex])
            updateState()
        }
    }, [router, updateState])

    return { canGoBack, canGoForward, goBack, goForward }
}

function DashboardToolbar() {
    const { canGoBack, canGoForward, goBack, goForward } = useNavigationHistory()
    const { user } = useAuth()
    const [isRefreshing, setIsRefreshing] = useState(false)

    const currentUser = {
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Anvandare',
        email: user?.email || '',
        avatar: user?.user_metadata?.avatar_url || '',
    }

    const [teams] = useState([{ ...defaultTeam, logo: Box }])

    return (
        <div className="flex h-12 items-center px-4 md:px-6 w-full shrink-0 bg-background">
            {/* Navigation buttons */}
            <div className="flex items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={goBack}
                    disabled={!canGoBack}
                    title="Bakat"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={goForward}
                    disabled={!canGoForward}
                    title="Framat"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Search bar centered */}
            <div className="flex-1 flex justify-center px-4">
                <GlobalSearch />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        setIsRefreshing(true)
                        window.dispatchEvent(new CustomEvent("page-refresh"))
                        setTimeout(() => setIsRefreshing(false), 1200)
                    }}
                    title="Uppdatera"
                >
                    <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.dispatchEvent(new CustomEvent("ai-chat-show-history"))}
                    title="Chatthistorik"
                >
                    <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.dispatchEvent(new CustomEvent("ai-chat-new-conversation"))}
                    title="Ny chatt"
                >
                    <Plus className="h-4 w-4" />
                </Button>
                <div className="ml-1">
                    <UserTeamSwitcher user={currentUser} teams={teams} compact={true} />
                </div>
            </div>
        </div>
    )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { shouldRedirect, isLoading } = useOnboarding()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const settingsParam = searchParams?.get("settings")
    const [settingsOpen, setSettingsOpen] = useState(!!settingsParam)

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

    return (
        <div className="flex flex-col h-screen">
            {/* Top toolbar — full width */}
            <DashboardToolbar />

            {/* AI chat panel + main content */}
            <div className="flex flex-1 min-h-0">
                {/* AI Chat Panel — left side, always visible */}
                <div className="hidden md:flex flex-col w-[380px] xl:w-[440px] 2xl:w-[500px] shrink-0 p-2 pt-0">
                    {/* Outer layer — subtle grey */}
                    <div className="flex flex-col flex-1 min-h-0 rounded-xl bg-muted/50">
                        {/* Scooby header — sits on outer layer */}
                        <div className="flex items-center gap-2.5 px-4 py-3 shrink-0">
                            <ScopeAILogo className="h-7 w-7" />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold leading-none">Scooby</span>
                                <span className="text-[11px] text-muted-foreground leading-tight mt-0.5">AI Assistent</span>
                            </div>
                        </div>
                        {/* Inner layer — chat area, darker rounded bg */}
                        <div className="flex-1 min-h-0 mx-2 mb-2 rounded-lg bg-sidebar-accent overflow-hidden">
                            <AIChatPanel />
                        </div>
                    </div>
                </div>

                {/* Main content — right side */}
                <div className="flex-1 relative bg-background overflow-x-hidden overflow-y-auto">
                    {children}
                    <AIOverlay />
                </div>
            </div>

            <SettingsDialog
                open={settingsOpen}
                onOpenChange={handleSettingsOpenChange}
                defaultTab={settingsParam || undefined}
            />
        </div>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <QueryProvider>
                <TextModeProvider>
                    <ModelProvider>
                        <CompanyProvider>
                            <AIDialogProvider>
                                <ToastProvider>
                                    <DashboardContent>
                                        {children}
                                    </DashboardContent>
                                </ToastProvider>
                            </AIDialogProvider>
                        </CompanyProvider>
                    </ModelProvider>
                </TextModeProvider>
            </QueryProvider>
        </AuthGuard>
    )
}
