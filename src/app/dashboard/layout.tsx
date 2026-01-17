"use client"

import { AppSidebar } from "@/components/layout"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { ToastProvider } from "@/components/ui/toast"
import { useOnboarding } from "@/components/onboarding/onboarding-wizard"
import { LazyOnboardingWizard } from "@/components/shared"
import { CompanyProvider } from "@/providers/company-provider"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { AIChatProvider } from "@/providers/ai-chat-provider"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding()

    return (
        <>
            <SidebarProvider
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <div className="w-full max-w-7xl mx-auto">
                        {children}
                    </div>
                </SidebarInset>
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
            <CompanyProvider>
                <AIChatProvider>
                    <ToastProvider>
                        <DashboardContent>
                            {children}
                        </DashboardContent>
                    </ToastProvider>
                </AIChatProvider>
            </CompanyProvider>
        </TextModeProvider>
    )
}
