"use client"

import * as React from "react"
import {
  Bell,
  Building2,
  CreditCard,
  Globe,
  Keyboard,
  Lock,
  Paintbrush,
  Puzzle,
  User,
  Mail,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useCompany } from "@/providers/company-provider"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { PageOverlay } from "@/components/shared"
import {
  AccountTab,
  CompanyTab,
  IntegrationsTab,
  BillingTab,
  NotificationsTab,
  AppearanceTab,
  LanguageTab,
  EmailTab,
  AccessibilityTab,
  SecurityTab,
} from "./settings-tabs"

const data = {
  nav: [
    { name: "Konto", icon: User },
    { name: "Företagsinformation", icon: Building2 },
    { name: "Integrationer", icon: Puzzle },
    { name: "Fakturering", icon: CreditCard },
    { name: "Notiser", icon: Bell },
    { name: "Utseende", icon: Paintbrush },
    { name: "Språk & region", icon: Globe },
    { name: "E-post", icon: Mail },
    { name: "Tillgänglighet", icon: Keyboard },
    { name: "Säkerhet & sekretess", icon: Lock },
  ],
}

interface SettingsOverlayProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTab?: string
}

/**
 * SettingsOverlay - Immersive settings view that takes over the main content area.
 * Replaces the traditional SettingsDialog.
 */
export function SettingsOverlay({ open = false, onOpenChange, defaultTab }: SettingsOverlayProps) {
  const [activeTab, setActiveTab] = React.useState("Konto")
  const { company, updateCompany, saveChanges, isSaving } = useCompany()
  const { addToast } = useToast()

  // Sync active tab with defaultTab when it changes
  React.useEffect(() => {
    if (defaultTab) {
      const matchedTab = data.nav.find(item =>
        item.name.toLowerCase() === defaultTab.toLowerCase() ||
        item.name === defaultTab
      )
      if (matchedTab) {
        setActiveTab(matchedTab.name)
      }
    }
  }, [defaultTab])

  const [avatarUrl, setAvatarUrl] = React.useState<string>("")
  const [formData, setFormData] = React.useState({
    name: "",
    orgNumber: "",
    vatNumber: "",
    address: "",
    email: "",
    phone: "",
    contactPerson: "",
    bankgiro: "",
    plusgiro: "",
  })

  React.useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        orgNumber: company.orgNumber || "",
        vatNumber: company.vatNumber || "",
        address: company.address || "",
        email: company.email || "",
        phone: company.phone || "",
        contactPerson: company.contactPerson || "",
        bankgiro: company.bankgiro || "",
        plusgiro: company.plusgiro || "",
      })
    }
  }, [company])

  const handleSave = async () => {
    updateCompany(formData)
    
    // Explicitly call the Server Action through the provider
    const result = await saveChanges()
    
    if (result.success) {
      addToast({
        title: "Inställningar sparade",
        description: "Dina ändringar har sparats.",
      })
    } else {
      addToast({
        title: "Kunde inte spara",
        description: result.error || "Ett oväntat fel uppstod.",
        variant: "destructive",
      })
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "Konto":
        return <AccountTab formData={formData} setFormData={setFormData} onSave={handleSave} avatarUrl={avatarUrl} onAvatarChange={setAvatarUrl} />
      case "Företagsinformation":
        return <CompanyTab formData={formData} setFormData={setFormData} onSave={handleSave} />
      case "Integrationer":
        return <IntegrationsTab />
      case "Fakturering":
        return <BillingTab />
      case "Notiser":
        return <NotificationsTab />
      case "Utseende":
        return <AppearanceTab />
      case "Språk & region":
        return <LanguageTab />
      case "E-post":
        return <EmailTab />
      case "Tillgänglighet":
        return <AccessibilityTab />
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
      scoobyPrompt="Hjälp mig att ändra mina inställningar"
      className="p-0" // Remove default padding to allow sidebar layout
    >
      <div className="flex h-full min-h-[600px]">
        <SidebarProvider className="items-start h-full">
          <Sidebar collapsible="none" className="w-64 border-r h-full bg-muted/20">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
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
          
          <main className="flex-1 flex flex-col min-h-0 bg-background">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-6">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Inställningar</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-2xl mx-auto w-full">
                {renderTabContent()}
              </div>
            </div>
          </main>
        </SidebarProvider>
      </div>
    </PageOverlay>
  )
}
