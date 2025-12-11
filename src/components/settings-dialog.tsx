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
  Shield,
  User,
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

const data = {
  nav: [
    { name: "Konto", icon: User },
    { name: "Företagsinformation", icon: Building2 },
    { name: "Integrationer", icon: Puzzle },
    { name: "Fakturering", icon: CreditCard },
    { name: "Notiser", icon: Bell },
    { name: "Utseende", icon: Paintbrush },
    { name: "Språk & region", icon: Globe },
    { name: "Tillgänglighet", icon: Keyboard },
    { name: "Säkerhet & sekretess", icon: Lock },
  ],
}

interface SettingsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState("Konto")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
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
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
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
              {activeTab === "Konto" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kontoinställningar</h3>
                  <p className="text-sm text-muted-foreground">Hantera ditt konto och profil.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Kontoinställningar kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Företagsinformation" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Företagsinformation</h3>
                  <p className="text-sm text-muted-foreground">Uppdatera ditt företags uppgifter och inställningar.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Företagsinformation kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Integrationer" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Integrationer</h3>
                  <p className="text-sm text-muted-foreground">Anslut externa tjänster och verktyg.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Integrationer kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Fakturering" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fakturering</h3>
                  <p className="text-sm text-muted-foreground">Hantera ditt abonnemang och betalningsmetoder.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Faktureringsinställningar kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Notiser" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notiser</h3>
                  <p className="text-sm text-muted-foreground">Anpassa hur och när du får notiser.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Notisinställningar kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Utseende" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Utseende</h3>
                  <p className="text-sm text-muted-foreground">Anpassa hur appen ser ut.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Utseendeinställningar kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Språk & region" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Språk & region</h3>
                  <p className="text-sm text-muted-foreground">Välj språk och regional formatering.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Språkinställningar kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Tillgänglighet" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tillgänglighet</h3>
                  <p className="text-sm text-muted-foreground">Anpassa appen för bättre tillgänglighet.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Tillgänglighetsinställningar kommer snart...</p>
                  </div>
                </div>
              )}
              {activeTab === "Säkerhet & sekretess" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Säkerhet & sekretess</h3>
                  <p className="text-sm text-muted-foreground">Hantera säkerhet och integritetsinställningar.</p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm">Säkerhetsinställningar kommer snart...</p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
