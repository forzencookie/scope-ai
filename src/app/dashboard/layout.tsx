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
import { CompanyProvider } from "@/providers/company-provider"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { ModelProvider } from "@/providers/model-provider"
import { AIDialogProvider } from "@/providers/ai-overlay-provider"
import { AIOverlay } from "@/components/ai"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MessageSquare, Plus, RefreshCw, Home, BookOpen, PieChart, Users, Building2, Menu } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import React, { useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { UserTeamSwitcher } from "@/components/layout/user-team-switcher"
import { QueryProvider } from "@/providers/query-provider"
import { Box } from "lucide-react"
import { cn } from "@/lib/utils"

// Default team based on company provider
const defaultTeam = {
  id: 'default',
  name: 'Mitt Företag',
  logo: Building2,
  plan: 'Free',
}

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

// Mobile nav link component
function MobileNavLink({ href, icon: Icon, children, pathname }: { href: string, icon: React.ComponentType<{ className?: string }>, children: React.ReactNode, pathname: string }) {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
        <Link 
            href={href} 
            className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            )}
        >
            <Icon className="h-4 w-4" />
            {children}
        </Link>
    )
}

function DashboardToolbar({ setSidebarMode }: { sidebarMode: SidebarMode; setSidebarMode: (mode: SidebarMode) => void }) {
    const { canGoBack, canGoForward, goBack, goForward } = useNavigationHistory()
    const { user } = useAuth()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const pathname = usePathname()
    const prevPathnameRef = React.useRef(pathname)
    
    // Auto-close menu on navigation (using ref to avoid setState in effect)
    useEffect(() => {
        if (prevPathnameRef.current !== pathname) {
            prevPathnameRef.current = pathname
            setIsMobileMenuOpen(false)
        }
    }, [pathname])

    // Minimal user object for the switcher
    const currentUser = {
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare',
        email: user?.email || '',
        avatar: user?.user_metadata?.avatar_url || '',
    }

    const [teams] = useState([{ ...defaultTeam, logo: Box }])

    return (
        <div className="flex flex-col">
            {/* Desktop Toolbar Row */}
            <div className="hidden md:flex h-12 items-center px-2">
                {/* Sidebar toggle */}
                <SidebarTrigger />
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
                {/* Search bar centered */}
                <div className="flex-1 flex justify-center px-4">
                    <GlobalSearch />
                </div>
                {/* Right side actions */}
                <div className="flex items-center gap-1 mr-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.dispatchEvent(new CustomEvent("page-refresh"))}
                        title="Uppdatera"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
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

            {/* Mobile Toolbar Row */}
            <div className="flex md:hidden h-12 items-center px-2">
                {/* Mobile: Menu toggle */}
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <ChevronLeft className="h-5 w-5 rotate-[-90deg]" /> : <Menu className="h-5 w-5" />}
                </Button>

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

                {/* Spacer */}
                <div className="flex-1" />

                {/* Right side actions */}
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

                {/* Profile */}
                <div className="scale-90 origin-right">
                    <UserTeamSwitcher user={currentUser} teams={teams} compact={true} />
                </div>
            </div>

            {/* Mobile Push-Down Navigation Menu */}
            <div className={cn(
                "grid transition-all duration-300 ease-in-out md:hidden", 
                isMobileMenuOpen ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"
            )}>
                <div className="overflow-hidden">
                    <div className="px-2 pt-1 pb-3 flex flex-col gap-1">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Navigering
                        </div>
                        <MobileNavLink href="/dashboard" icon={Home} pathname={pathname}>Hem</MobileNavLink>
                        <MobileNavLink href="/dashboard/bokforing" icon={BookOpen} pathname={pathname}>Bokföring</MobileNavLink>
                        <MobileNavLink href="/dashboard/rapporter" icon={PieChart} pathname={pathname}>Rapporter</MobileNavLink>
                        <MobileNavLink href="/dashboard/loner" icon={Users} pathname={pathname}>Löner</MobileNavLink>
                        <MobileNavLink href="/dashboard/agare" icon={Building2} pathname={pathname}>Bolagsstyrning</MobileNavLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { shouldRedirect, isLoading } = useOnboarding()
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>("navigation")
    const router = useRouter()

    // Redirect to onboarding page if needed
    useEffect(() => {
        if (!isLoading && shouldRedirect) {
            router.push('/onboarding')
        }
    }, [isLoading, shouldRedirect, router])

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

                {/* Main layout */}
                <div className="flex flex-1 w-full bg-sidebar mt-2">
                    <AppSidebar variant="inset" mode={sidebarMode} onModeChange={setSidebarMode} className="hidden md:flex" />
                    <SidebarInset>
                        {/* Toolbar inside content area */}
                        <DashboardToolbar sidebarMode={sidebarMode} setSidebarMode={setSidebarMode} />
                        
                        <div className="relative w-full h-full px-0 md:px-[5%]">
                            {children}
                            {/* AI Overlay - shows when AI is processing */}
                            <AIOverlay />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>

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

