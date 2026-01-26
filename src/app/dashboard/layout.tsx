"use client"

import { AppSidebar, type SidebarMode } from "@/components/layout"
import { GlobalSearch } from "@/components/layout/global-search"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar"
import { ToastProvider } from "@/components/ui/toast"
import { useOnboarding } from "@/components/onboarding/onboarding-wizard"
import { LazyOnboardingWizard } from "@/components/shared"
import { CompanyProvider } from "@/providers/company-provider"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { ModelProvider } from "@/providers/model-provider"
import { AIDialogProvider } from "@/providers/ai-overlay-provider"
import { AIOverlay } from "@/components/ai"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DemoBanner } from "@/components/shared/demo-banner"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MessageSquare, Plus, RefreshCw } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useCallback } from "react"

// Module-level navigation history store (persists across component remounts)
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

        // If we're not at the end of the stack, truncate forward history
        if (this.currentIndex < this.historyStack.length - 1) {
            this.historyStack = this.historyStack.slice(0, this.currentIndex + 1)
        }

        // Don't add duplicate consecutive entries
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

// Custom hook to track navigation history
function useNavigationHistory() {
    const pathname = usePathname()
    const router = useRouter()

    // Use actual state for canGoBack/canGoForward to trigger proper re-renders
    const [canGoBack, setCanGoBack] = useState(false)
    const [canGoForward, setCanGoForward] = useState(false)

    // Update state from store
    const updateState = useCallback(() => {
        setCanGoBack(navigationStore.currentIndex > 0)
        setCanGoForward(navigationStore.currentIndex < navigationStore.historyStack.length - 1)
    }, [])

    // Subscribe to store changes
    useEffect(() => {
        return navigationStore.subscribe(updateState)
    }, [updateState])

    // Track pathname changes
    useEffect(() => {
        navigationStore.push(pathname)
        // Defer state update to avoid synchronous cascading renders
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

function DashboardToolbar({ sidebarMode: _sidebarMode, setSidebarMode: _setSidebarMode }: { sidebarMode: SidebarMode; setSidebarMode: (mode: SidebarMode) => void }) {
    const { state } = useSidebar()
    const isCollapsed = state === "collapsed"
    const { canGoBack, canGoForward, goBack, goForward } = useNavigationHistory()

    return (
        <div className="h-12 bg-sidebar flex items-center shrink-0 mt-2">
            {/* Left spacer - matches sidebar width, hidden when collapsed */}
            {!isCollapsed && (
                <div
                    className="h-full shrink-0 transition-all duration-200"
                    style={{ width: "var(--sidebar-width)" }}
                />
            )}
            {/* Sidebar toggle */}
            <SidebarTrigger className="ml-2" />
            {/* Navigation buttons */}
            <div className="flex items-center gap-0.5 ml-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={goBack}
                    disabled={!canGoBack}
                    title="Bakåt"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full"
                    onClick={goForward}
                    disabled={!canGoForward}
                    title="Framåt"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            {/* Search bar centered over main content area */}
            <div className="flex-1 flex justify-center px-4">
                <GlobalSearch />
            </div>
            {/* Right side actions */}
            <div className="flex items-center gap-1 mr-4">
                {/* Refresh button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.dispatchEvent(new CustomEvent("page-refresh"))}
                    title="Uppdatera"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
                {/* Chat history - switches to AI mode and shows history */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        setSidebarMode("ai-chat")
                        window.dispatchEvent(new CustomEvent("ai-chat-show-history"))
                    }}
                    title="Chatthistorik"
                >
                    <MessageSquare className="h-4 w-4" />
                </Button>
                {/* New chat - switches to AI mode and starts new conversation */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                        setSidebarMode("ai-chat")
                        window.dispatchEvent(new CustomEvent("ai-chat-new-conversation"))
                    }}
                    title="Ny chatt"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding()
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>("navigation")
    const router = useRouter()

    // Listen for AI navigation events
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
        return () => {
            window.removeEventListener('ai-navigate', handleAINavigate as EventListener)
        }
    }, [router])

    return (
        <>
            <SidebarProvider
                className="flex-col"
                style={
                    {
                        "--sidebar-width": sidebarMode === "ai-chat" ? "400px" : "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                {/* Demo mode banner */}
                <DemoBanner />
                
                {/* Grey toolbar spanning full width - scrolls with content */}
                <DashboardToolbar sidebarMode={sidebarMode} setSidebarMode={setSidebarMode} />

                {/* Main layout */}
                <div className="flex flex-1 w-full bg-sidebar">
                    <AppSidebar variant="inset" mode={sidebarMode} onModeChange={setSidebarMode} />
                    <SidebarInset>
                        <div className="relative w-full h-full px-4 md:px-[5%]">
                            {children}
                            {/* AI Overlay - shows when AI is processing */}
                            <AIOverlay />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>

            <LazyOnboardingWizard
                isOpen={showOnboarding}
                onClose={skipOnboarding}
                onComplete={completeOnboarding}
            />
        </>
    )
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
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
        </AuthGuard>
    )
}

