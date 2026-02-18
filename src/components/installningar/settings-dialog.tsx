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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
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

interface SettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultTab?: string
}

export function SettingsDialog({ open, onOpenChange, defaultTab }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState("Konto")
  const [isExpanded, setIsExpanded] = React.useState(true)
  const { company, updateCompany } = useCompany()
  const { addToast } = useToast()

  // Sync active tab with defaultTab when it changes
  React.useEffect(() => {
    if (defaultTab) {
      // Find matching tab case-insensitive or exact
      const matchedTab = data.nav.find(item =>
        item.name.toLowerCase() === defaultTab.toLowerCase() ||
        item.name === defaultTab
      )
      if (matchedTab) {
        setActiveTab(matchedTab.name)
      }
    }
  }, [defaultTab])

  // Avatar state
  const [avatarUrl, setAvatarUrl] = React.useState<string>("")

  // Local form state
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

  // Fetch profile (avatar) on mount
  React.useEffect(() => {
    fetch('/api/user/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url)
      })
      .catch(() => {})
  }, [])

  // Sync with company data when it loads
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

  const handleSave = () => {
    updateCompany(formData)
    addToast({
      title: "Inställningar sparade",
      description: "Dina ändringar har sparats.",
    })
  }

  // Render the active tab content
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        expandable
        onExpandedChange={setIsExpanded}
        className={cn(
          "overflow-hidden p-0",
          isExpanded
            ? "md:max-h-[90vh] md:max-w-[90vw] lg:max-w-[90vw]"
            : "md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
        )}
      >
        <DialogTitle className="sr-only">Inställningar</DialogTitle>
        <DialogDescription className="sr-only">
          Anpassa dina inställningar här.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={item.name === activeTab}
                          onClick={() => setActiveTab(item.name)}
                        >
                          <item.icon />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className={cn(
            "flex flex-1 flex-col overflow-hidden transition-all duration-300",
            isExpanded ? "h-[calc(90vh-2rem)]" : "h-[480px]"
          )}>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Inställningar</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {renderTabContent()}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
