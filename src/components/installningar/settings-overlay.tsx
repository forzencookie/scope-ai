"use client"

import * as React from "react"
import {
  Building2,
  CreditCard,
  Lock,
  Paintbrush,
  Puzzle,
  User,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui"
import { PageOverlay } from "@/components/shared"
import {
  AccountTab,
  CompanyTab,
  IntegrationsTab,
  BillingTab,
  AppearanceTab,
  SecurityTab,
} from "./settings-tabs"

const data = {
  nav: [
    { name: "Konto", icon: User },
    { name: "Företagsinformation", icon: Building2 },
    { name: "Integrationer", icon: Puzzle },
    { name: "Fakturering", icon: CreditCard },
    { name: "Utseende", icon: Paintbrush },
    { name: "Säkerhet & sekretess", icon: Lock },
  ],
}

interface SettingsOverlayProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTab?: string
}

/**
 * SettingsOverlay — Pure router. Each tab owns its own data and save logic.
 *
 * Konto → user profile (name, email, avatar) → /api/user/profile
 * Företagsinformation → company data (name, type, org nr) → CompanyProvider.saveChanges()
 *
 * These are separate domains with separate DB tables and separate save paths.
 */
export function SettingsOverlay({ open = false, onOpenChange, defaultTab }: SettingsOverlayProps) {
  const [activeTab, setActiveTab] = React.useState(() => {
    if (defaultTab) {
      const matched = data.nav.find(item =>
        item.name.toLowerCase() === defaultTab.toLowerCase() ||
        item.name === defaultTab
      )
      return matched?.name ?? "Konto"
    }
    return "Konto"
  })

  const renderTabContent = () => {
    switch (activeTab) {
      case "Konto":
        return <AccountTab />
      case "Företagsinformation":
        return <CompanyTab />
      case "Integrationer":
        return <IntegrationsTab />
      case "Fakturering":
        return <BillingTab />
      case "Utseende":
        return <AppearanceTab />
      case "Säkerhet & sekretess":
        return <SecurityTab />
      default:
        return null
    }
  }

  return (
    <PageOverlay
      isOpen={open}
      onClose={() => onOpenChange?.(false)}
      title="Inställningar"
      subtitle="Hantera ditt konto, företag och preferenser"
      className="p-0"
      fullContent={true}
    >
      <div className="flex h-full min-h-0 bg-background overflow-hidden">
        <SidebarProvider className="items-start h-full min-h-0">
          <Sidebar collapsible="none" className="w-64 border-r h-full bg-muted/20 shrink-0">
            <SidebarContent className="h-full">
              <SidebarGroup className="h-full">
                <SidebarGroupContent className="h-full">
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === activeTab}
                          onClick={() => setActiveTab(item.name)}
                          className="px-4 py-6"
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          <span className="font-medium">{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <span className="text-muted-foreground">Inställningar</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>

            <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
              <div className="max-w-3xl w-full">
                {renderTabContent()}
              </div>
            </div>
          </main>
        </SidebarProvider>
      </div>
    </PageOverlay>
  )
}
