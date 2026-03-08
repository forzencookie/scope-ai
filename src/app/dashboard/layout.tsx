"use client"

import { ToastProvider } from "@/components/ui/toast"
import { useOnboarding } from "@/components/onboarding/onboarding-wizard"
import { CompanyProvider } from "@/providers/company-provider"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { ModelProvider } from "@/providers/model-provider"
import { AIDialogProvider } from "@/providers/ai-overlay-provider"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import React, { useEffect } from "react"
import { QueryProvider } from "@/providers/query-provider"
import { ChatProvider } from "@/providers/chat-provider"
import { ChatHistorySidebar } from "@/components/layout/chat-history-sidebar"
import { MainContentArea } from "@/components/layout/main-content-area"
import { SettingsDialog } from "@/components/installningar/settings-dialog"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { shouldRedirect, isLoading } = useOnboarding()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const settingsParam = searchParams?.get("settings")
    const [settingsOpen, setSettingsOpen] = useState(!!settingsParam)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
        <ChatProvider>
            <div className="flex h-screen bg-muted">
                {/* Chat History Sidebar — left, on grey background */}
                <ChatHistorySidebar
                    onOpenSettings={() => setSettingsOpen(true)}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                {/* Main Content Area — right, rounded dark container */}
                <MainContentArea>
                    {children}
                </MainContentArea>
            </div>

            <SettingsDialog
                open={settingsOpen}
                onOpenChange={handleSettingsOpenChange}
                defaultTab={settingsParam || undefined}
            />
        </ChatProvider>
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
