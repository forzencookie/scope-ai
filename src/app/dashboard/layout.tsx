"use client"

import { AppSidebar, type SidebarMode } from "@/components/layout"
import { GlobalSearch } from "@/components/layout/global-search"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { ToastProvider } from "@/components/ui/toast"
import { useOnboarding } from "@/components/onboarding/onboarding-wizard"
import { LazyOnboardingWizard } from "@/components/shared"
import { CompanyProvider } from "@/providers/company-provider"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { ModelProvider } from "@/providers/model-provider"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, RefreshCw } from "lucide-react"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding()
    const [sidebarMode, setSidebarMode] = useState<SidebarMode>("navigation")

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
                {/* Grey toolbar spanning full width - scrolls with content */}
                <div className="h-12 bg-sidebar flex items-center shrink-0 mt-2">
                    {/* Left spacer - matches sidebar width */}
                    <div
                        className="h-full shrink-0"
                        style={{ width: "var(--sidebar-width)" }}
                    />
                    {/* Sidebar toggle */}
                    <SidebarTrigger className="ml-2" />
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

                {/* Main layout */}
                <div className="flex flex-1 w-full bg-sidebar">
                    <AppSidebar variant="inset" mode={sidebarMode} onModeChange={setSidebarMode} />
                    <SidebarInset>
                        <div className="w-full h-full">
                            {children}
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
        <TextModeProvider>
            <ModelProvider>
                <CompanyProvider>
                    <ToastProvider>
                        <DashboardContent>
                            {children}
                        </DashboardContent>
                    </ToastProvider>
                </CompanyProvider>
            </ModelProvider>
        </TextModeProvider>
    )
}

