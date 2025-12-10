"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { ToastProvider } from "@/components/ui/toast"
import { OnboardingWizard, useOnboarding } from "@/components/onboarding-wizard"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { showOnboarding, completeOnboarding, skipOnboarding } = useOnboarding()

    return (
        <>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <div className="pb-20 md:pb-0 w-full max-w-7xl mx-auto">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
            <MobileBottomNav />
            <OnboardingWizard 
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
        <ToastProvider>
            <DashboardContent>
                {children}
            </DashboardContent>
        </ToastProvider>
    )
}
