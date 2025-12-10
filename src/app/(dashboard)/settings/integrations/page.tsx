"use client"

import { useState } from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage, BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { 
    Puzzle, 
    CheckCircle2, 
    XCircle,
    RefreshCw,
    Settings,
    ExternalLink,
    Building2,
    CreditCard,
    FileText,
    Mail,
    Wallet,
    BarChart3,
    Clock,
} from "lucide-react"

// Integration data
const integrations = [
    {
        id: "seb",
        name: "SEB",
        description: "Automatisk hämtning av banktransaktioner",
        category: "bank",
        connected: true,
        lastSync: "Idag 14:30",
        logo: "🏦",
    },
    {
        id: "swedbank",
        name: "Swedbank",
        description: "Koppla ditt Swedbank-konto för automatisk import",
        category: "bank",
        connected: false,
        lastSync: null,
        logo: "🏦",
    },
    {
        id: "nordea",
        name: "Nordea",
        description: "Synkronisera transaktioner från Nordea",
        category: "bank",
        connected: false,
        lastSync: null,
        logo: "🏦",
    },
    {
        id: "skatteverket",
        name: "Skatteverket",
        description: "Automatisk inlämning av deklarationer",
        category: "government",
        connected: true,
        lastSync: "2024-12-01",
        logo: "🏛️",
    },
    {
        id: "bolagsverket",
        name: "Bolagsverket",
        description: "Årsredovisning och företagsuppgifter",
        category: "government",
        connected: false,
        lastSync: null,
        logo: "🏛️",
    },
    {
        id: "stripe",
        name: "Stripe",
        description: "Kortbetalningar och fakturering",
        category: "payments",
        connected: true,
        lastSync: "Idag 12:00",
        logo: "💳",
    },
    {
        id: "klarna",
        name: "Klarna",
        description: "Faktura och delbetalningar",
        category: "payments",
        connected: false,
        lastSync: null,
        logo: "💳",
    },
    {
        id: "gmail",
        name: "Gmail",
        description: "Automatisk import av kvitton från e-post",
        category: "email",
        connected: true,
        lastSync: "Idag 14:35",
        logo: "📧",
    },
    {
        id: "outlook",
        name: "Outlook",
        description: "Synkronisera e-postkvitton och fakturor",
        category: "email",
        connected: false,
        lastSync: null,
        logo: "📧",
    },
]

const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    bank: { label: "Banker", icon: <Building2 className="h-4 w-4" /> },
    accounting: { label: "Bokföring", icon: <FileText className="h-4 w-4" /> },
    government: { label: "Myndigheter", icon: <BarChart3 className="h-4 w-4" /> },
    payments: { label: "Betalningar", icon: <CreditCard className="h-4 w-4" /> },
    email: { label: "E-post", icon: <Mail className="h-4 w-4" /> },
}

export default function IntegrationsPage() {
    const [integrationsState, setIntegrationsState] = useState(integrations)
    const [syncing, setSyncing] = useState<string | null>(null)

    const toggleConnection = (id: string) => {
        setIntegrationsState(prev => prev.map(i => 
            i.id === id ? { 
                ...i, 
                connected: !i.connected,
                lastSync: !i.connected ? "Just nu" : null
            } : i
        ))
    }

    const handleSync = async (id: string) => {
        setSyncing(id)
        // Simulate sync
        await new Promise(resolve => setTimeout(resolve, 1500))
        setIntegrationsState(prev => prev.map(i => 
            i.id === id ? { ...i, lastSync: "Just nu" } : i
        ))
        setSyncing(null)
    }

    const connectedCount = integrationsState.filter(i => i.connected).length

    // Group integrations by category
    const groupedIntegrations = Object.entries(categoryConfig).map(([key, config]) => ({
        category: key,
        ...config,
        integrations: integrationsState.filter(i => i.category === key)
    }))

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/settings">Inställningar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Integrationer</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 flex flex-col bg-background">
                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold flex items-center gap-2">
                                <Puzzle className="h-6 w-6" />
                                Integrationer
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Koppla externa tjänster för automatisk datasynkronisering
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border/50">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">{connectedCount} anslutna</span>
                        </div>
                    </div>

                    {/* Integration categories */}
                    <div className="space-y-8">
                        {groupedIntegrations.map((group) => (
                            <div key={group.category}>
                                <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
                                    {group.icon}
                                    {group.label}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {group.integrations.map((integration) => (
                                        <div 
                                            key={integration.id}
                                            className={`rounded-lg border p-4 transition-colors ${
                                                integration.connected 
                                                    ? "border-green-500/30 bg-green-500/5" 
                                                    : "border-border/50 hover:bg-muted/30"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{integration.logo}</span>
                                                    <div>
                                                        <h3 className="font-medium">{integration.name}</h3>
                                                        {integration.connected && (
                                                            <div className="flex items-center gap-1 text-xs text-green-600">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Ansluten
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {integration.description}
                                            </p>
                                            {integration.connected && integration.lastSync && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                                                    <Clock className="h-3 w-3" />
                                                    Senast synkad: {integration.lastSync}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                {integration.connected ? (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleSync(integration.id)}
                                                            disabled={syncing === integration.id}
                                                        >
                                                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${syncing === integration.id ? "animate-spin" : ""}`} />
                                                            {syncing === integration.id ? "Synkar..." : "Synka"}
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                        >
                                                            <Settings className="h-3.5 w-3.5 mr-1" />
                                                            Inställningar
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-500/10"
                                                            onClick={() => toggleConnection(integration.id)}
                                                        >
                                                            <XCircle className="h-3.5 w-3.5 mr-1" />
                                                            Koppla från
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => toggleConnection(integration.id)}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                                        Anslut
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </>
    )
}
