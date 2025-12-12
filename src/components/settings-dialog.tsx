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
  Moon,
  Sun,
  Monitor,
  Check,
  Mail,
  Smartphone,
  MessageSquare,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  Key,
  LogOut,
  Eye,
  EyeOff,
  Laptop,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
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
import { Switch } from "@/components/ui/switch"
import { CompanyTypeSelector, CompanyTypeBadge } from "@/components/company-type-selector"
import { useCompany } from "@/providers/company-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Kontoinställningar</h3>
                    <p className="text-sm text-muted-foreground">Hantera ditt konto och profil.</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" alt="Profilbild" />
                      <AvatarFallback className="text-lg">JS</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <Button variant="outline" size="sm">Ändra bild</Button>
                      <p className="text-xs text-muted-foreground">JPG, PNG eller GIF. Max 2MB.</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Namn</Label>
                      <Input id="name" placeholder="Johan Svensson" defaultValue="Johan Svensson" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">E-post</Label>
                      <Input id="email" type="email" placeholder="johan@exempel.se" defaultValue="johan@exempel.se" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" type="tel" placeholder="070-123 45 67" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button size="sm">Spara ändringar</Button>
                  </div>
                </div>
              )}
              {activeTab === "Företagsinformation" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Företagsinformation</h3>
                    <p className="text-sm text-muted-foreground">Uppdatera ditt företags uppgifter och inställningar.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Företagsform</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Välj din företagsform för att anpassa funktioner och rapporter.
                      </p>
                      <CompanyTypeSelector showDescription={false} />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="company-name">Företagsnamn</Label>
                      <Input id="company-name" placeholder="Mitt Företag AB" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="org-nr">Organisationsnummer</Label>
                        <Input id="org-nr" placeholder="556123-4567" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vat-nr">Momsreg.nr</Label>
                        <Input id="vat-nr" placeholder="SE556123456701" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Adress</Label>
                      <Input id="address" placeholder="Storgatan 1, 111 22 Stockholm" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button size="sm">Spara ändringar</Button>
                  </div>
                </div>
              )}
              {activeTab === "Integrationer" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Integrationer</h3>
                    <p className="text-sm text-muted-foreground">Anslut externa tjänster och verktyg.</p>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { name: "Bankgirot", description: "Automatisk betalningshantering", connected: true },
                      { name: "Swish", description: "Ta emot betalningar via Swish", connected: true },
                      { name: "Fortnox", description: "Synkronisera med Fortnox", connected: false },
                      { name: "Google Kalender", description: "Synkronisera viktiga datum", connected: false },
                      { name: "Skatteverket", description: "Direktanslutning för deklarationer", connected: false },
                    ].map((integration) => (
                      <div key={integration.name} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="font-medium text-sm">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.description}</p>
                        </div>
                        <Button variant={integration.connected ? "outline" : "default"} size="sm">
                          {integration.connected ? "Ansluten" : "Anslut"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === "Fakturering" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Fakturering</h3>
                    <p className="text-sm text-muted-foreground">Hantera ditt abonnemang och betalningsmetoder.</p>
                  </div>
                  
                  <div className="rounded-lg border p-4 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Pro-plan</p>
                        <p className="text-sm text-muted-foreground">299 kr/månad</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">Aktiv</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Betalningsmetod</h4>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                          <p className="text-xs text-muted-foreground">Utgår 12/26</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Ändra</Button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-3">Faktureringshistorik</h4>
                    <div className="space-y-2">
                      {[
                        { date: "2024-01-01", amount: "299 kr", status: "Betald" },
                        { date: "2023-12-01", amount: "299 kr", status: "Betald" },
                        { date: "2023-11-01", amount: "299 kr", status: "Betald" },
                      ].map((invoice, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                          <span className="text-muted-foreground">{invoice.date}</span>
                          <span>{invoice.amount}</span>
                          <span className="text-green-600 dark:text-green-400">{invoice.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Notiser" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Notiser</h3>
                    <p className="text-sm text-muted-foreground">Anpassa hur och när du får notiser.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">E-postnotiser</h4>
                    <div className="space-y-3">
                      {[
                        { icon: FileText, label: "Nya fakturor", description: "När du får en ny faktura" },
                        { icon: AlertCircle, label: "Betalningspåminnelser", description: "Påminnelser om förfallna betalningar" },
                        { icon: TrendingUp, label: "Månadsrapporter", description: "Sammanfattning av månadens ekonomi" },
                        { icon: Calendar, label: "Viktiga datum", description: "Påminnelser om momsdeklaration m.m." },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <Switch defaultChecked={i < 2} />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Push-notiser</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Mobilnotiser</p>
                          <p className="text-xs text-muted-foreground">Få notiser på din mobil</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Utseende" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Utseende</h3>
                    <p className="text-sm text-muted-foreground">Anpassa hur appen ser ut.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Tema</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "light", label: "Ljust", icon: Sun },
                        { value: "dark", label: "Mörkt", icon: Moon },
                        { value: "system", label: "System", icon: Monitor },
                      ].map((theme) => (
                        <button
                          key={theme.value}
                          className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <theme.icon className="h-5 w-5" />
                          <span className="text-sm">{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Täthet</h4>
                    <Select defaultValue="normal">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Välj täthet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Kompakt</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="comfortable">Bekväm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Sidopanel</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Komprimerad sidopanel</p>
                        <p className="text-xs text-muted-foreground">Visa endast ikoner i sidopanelen</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Språk & region" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Språk & region</h3>
                    <p className="text-sm text-muted-foreground">Välj språk och regional formatering.</p>
                  </div>
                  
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Språk</Label>
                      <Select defaultValue="sv">
                        <SelectTrigger>
                          <SelectValue placeholder="Välj språk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sv">🇸🇪 Svenska</SelectItem>
                          <SelectItem value="en">🇬🇧 English</SelectItem>
                          <SelectItem value="no">🇳🇴 Norsk</SelectItem>
                          <SelectItem value="da">🇩🇰 Dansk</SelectItem>
                          <SelectItem value="fi">🇫🇮 Suomi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Valuta</Label>
                      <Select defaultValue="sek">
                        <SelectTrigger>
                          <SelectValue placeholder="Välj valuta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sek">SEK - Svenska kronor</SelectItem>
                          <SelectItem value="eur">EUR - Euro</SelectItem>
                          <SelectItem value="usd">USD - US Dollar</SelectItem>
                          <SelectItem value="nok">NOK - Norska kronor</SelectItem>
                          <SelectItem value="dkk">DKK - Danska kronor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Datumformat</Label>
                      <Select defaultValue="sv">
                        <SelectTrigger>
                          <SelectValue placeholder="Välj datumformat" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sv">2024-01-15 (ÅÅÅÅ-MM-DD)</SelectItem>
                          <SelectItem value="eu">15/01/2024 (DD/MM/ÅÅÅÅ)</SelectItem>
                          <SelectItem value="us">01/15/2024 (MM/DD/ÅÅÅÅ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Första dag i veckan</Label>
                      <Select defaultValue="monday">
                        <SelectTrigger>
                          <SelectValue placeholder="Välj första dag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Måndag</SelectItem>
                          <SelectItem value="sunday">Söndag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Tillgänglighet" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Tillgänglighet</h3>
                    <p className="text-sm text-muted-foreground">Anpassa appen för bättre tillgänglighet.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Reducera rörelse</p>
                        <p className="text-xs text-muted-foreground">Minska animationer och övergångar</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Hög kontrast</p>
                        <p className="text-xs text-muted-foreground">Öka kontrasten för bättre läsbarhet</p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Större text</p>
                        <p className="text-xs text-muted-foreground">Använd större textstorlek överallt</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Tangentbordsgenvägar</h4>
                    <div className="space-y-2 text-sm">
                      {[
                        { key: "⌘ + K", action: "Öppna sökfält" },
                        { key: "⌘ + N", action: "Ny transaktion" },
                        { key: "⌘ + ,", action: "Öppna inställningar" },
                        { key: "Esc", action: "Stäng dialog" },
                      ].map((shortcut, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                          <span className="text-muted-foreground">{shortcut.action}</span>
                          <kbd className="bg-muted px-2 py-1 rounded text-xs font-mono">{shortcut.key}</kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "Säkerhet & sekretess" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold">Säkerhet & sekretess</h3>
                    <p className="text-sm text-muted-foreground">Hantera säkerhet och integritetsinställningar.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Lösenord</h4>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">Nuvarande lösenord</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">Nytt lösenord</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                      <Button size="sm" className="w-fit">Ändra lösenord</Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Tvåfaktorsautentisering</h4>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">2FA är aktiverat</p>
                          <p className="text-xs text-muted-foreground">Via autentiseringsapp</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Hantera</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Aktiva sessioner</h4>
                    <div className="space-y-2">
                      {[
                        { device: "MacBook Pro", location: "Stockholm", current: true },
                        { device: "iPhone 15", location: "Stockholm", current: false },
                      ].map((session, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <Laptop className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {session.device}
                                {session.current && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(denna enhet)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{session.location}</p>
                            </div>
                          </div>
                          {!session.current && (
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <LogOut className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
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
