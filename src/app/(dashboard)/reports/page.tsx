"use client"

import { useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
    Tooltip, 
    TooltipContent, 
    TooltipTrigger, 
    TooltipProvider 
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
    PieChart, 
    FileBarChart, 
    FileText, 
    Building2, 
    BarChart3,
    Search, 
    Settings, 
    CheckCircle2, 
    Clock, 
    Download, 
    Send, 
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    TrendingUp,
    Wallet,
    Shield,
    Droplets
} from "lucide-react"

// Tab configuration
const tabs = [
    { id: "momsdeklaration", label: "Momsdeklaration", icon: FileText },
    { id: "inkomstdeklaration", label: "Inkomstdeklaration", icon: FileText },
    { id: "arsredovisning", label: "Årsredovisning", icon: FileBarChart },
]

// Data for each section
const vatPeriods = [
    { period: "Q4 2024", dueDate: "12 feb 2025", status: "upcoming", salesVat: 125000, inputVat: 45000, netVat: 80000 },
    { period: "Q3 2024", dueDate: "12 nov 2024", status: "submitted", salesVat: 118500, inputVat: 42300, netVat: 76200 },
    { period: "Q2 2024", dueDate: "12 aug 2024", status: "submitted", salesVat: 132000, inputVat: 48500, netVat: 83500 },
    { period: "Q1 2024", dueDate: "12 maj 2024", status: "submitted", salesVat: 98000, inputVat: 35200, netVat: 62800 },
]

const declarationItems = [
    { label: "Rörelseintäkter", value: 1850000 },
    { label: "Rörelsekostnader", value: -1420000 },
    { label: "Rörelseresultat", value: 430000, highlight: true },
    { label: "Finansiella intäkter", value: 2500 },
    { label: "Finansiella kostnader", value: -8500 },
    { label: "Resultat före skatt", value: 424000, highlight: true },
    { label: "Skatt (20,6%)", value: -87344 },
    { label: "Årets resultat", value: 336656, highlight: true },
]

const ink2Fields = [
    { field: "1.1", label: "Nettoomsättning", value: 1850000 },
    { field: "1.4", label: "Övriga rörelseintäkter", value: 0 },
    { field: "2.1", label: "Råvaror och förnödenheter", value: -320000 },
    { field: "2.4", label: "Övriga externa kostnader", value: -580000 },
    { field: "2.5", label: "Personalkostnader", value: -520000 },
    { field: "2.7", label: "Avskrivningar", value: -45000 },
    { field: "3.1", label: "Ränteintäkter", value: 2500 },
    { field: "3.3", label: "Räntekostnader", value: -8500 },
    { field: "4.1", label: "Bokfört resultat", value: 379000 },
]

const reportSections = [
    { name: "Förvaltningsberättelse", status: "complete", description: "Verksamhetsbeskrivning och väsentliga händelser" },
    { name: "Resultaträkning", status: "complete", description: "Intäkter, kostnader och årets resultat" },
    { name: "Balansräkning", status: "complete", description: "Tillgångar, skulder och eget kapital" },
    { name: "Noter", status: "incomplete", description: "Tilläggsupplysningar och redovisningsprinciper" },
    { name: "Underskrifter", status: "pending", description: "Styrelsens underskrifter" },
]

const contributionPeriods = [
    { month: "December 2024", dueDate: "12 jan 2025", status: "upcoming", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "November 2024", dueDate: "12 dec 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "Oktober 2024", dueDate: "12 nov 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "September 2024", dueDate: "12 okt 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "Augusti 2024", dueDate: "12 sep 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
]

const kpis = [
    { label: "Omsättning", value: "1,85 mkr", change: "+12%", positive: true, icon: TrendingUp },
    { label: "Resultat", value: "379 tkr", change: "+8%", positive: true, icon: Wallet },
    { label: "Soliditet", value: "42%", change: "+3%", positive: true, icon: Shield },
    { label: "Kassalikviditet", value: "156%", change: "-2%", positive: false, icon: Droplets },
]

const monthlyRevenue = [
    { month: "Jan", revenue: 142000, expenses: 98000, profit: 44000 },
    { month: "Feb", revenue: 156000, expenses: 112000, profit: 44000 },
    { month: "Mar", revenue: 148000, expenses: 105000, profit: 43000 },
    { month: "Apr", revenue: 165000, expenses: 118000, profit: 47000 },
    { month: "Maj", revenue: 172000, expenses: 125000, profit: 47000 },
    { month: "Jun", revenue: 158000, expenses: 108000, profit: 50000 },
    { month: "Jul", revenue: 134000, expenses: 95000, profit: 39000 },
    { month: "Aug", revenue: 145000, expenses: 102000, profit: 43000 },
    { month: "Sep", revenue: 168000, expenses: 120000, profit: 48000 },
    { month: "Okt", revenue: 175000, expenses: 128000, profit: 47000 },
    { month: "Nov", revenue: 162000, expenses: 115000, profit: 47000 },
    { month: "Dec", revenue: 125000, expenses: 88000, profit: 37000 },
]

const expenseCategories = [
    { category: "Personal", amount: 520000, percentage: 37 },
    { category: "Lokalkostnader", amount: 180000, percentage: 13 },
    { category: "Marknadsföring", amount: 95000, percentage: 7 },
    { category: "IT & Teknik", amount: 125000, percentage: 9 },
    { category: "Övriga kostnader", amount: 500000, percentage: 34 },
]

// Get contextual info for each tab
function getTabInfo(tabId: string) {
    switch (tabId) {
        case "momsdeklaration":
            return "Senast uppdaterad: idag 14:32"
        case "inkomstdeklaration":
            return "Senast uppdaterad: igår 09:15"
        case "arsredovisning":
            return "Senast uppdaterad: 3 dec 2024"
        default:
            return ""
    }
}

// Momsdeklaration content
function MomsdeklarationContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Nästa deklaration</p>
                    <p className="text-2xl font-semibold mt-1">Q4 2024</p>
                    <p className="text-sm text-muted-foreground mt-1">Deadline: 12 feb 2025</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Beräknad moms att betala</p>
                    <p className="text-2xl font-semibold mt-1">80 000 kr</p>
                    <p className="text-sm text-green-600 mt-1">Utgående: 125 000 kr</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Ingående moms</p>
                    <p className="text-2xl font-semibold mt-1">45 000 kr</p>
                    <p className="text-sm text-muted-foreground mt-1">Avdragsgill</p>
                </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40">
                    <h2 className="font-medium">Momsperioder</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40 text-left text-muted-foreground">
                            <th className="px-4 py-3 font-medium">Period</th>
                            <th className="px-4 py-3 font-medium">Deadline</th>
                            <th className="px-4 py-3 font-medium">Utgående moms</th>
                            <th className="px-4 py-3 font-medium">Ingående moms</th>
                            <th className="px-4 py-3 font-medium">Att betala</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {vatPeriods.map((item) => (
                            <tr key={item.period} className="border-b border-border/40 hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">{item.period}</td>
                                <td className="px-4 py-3 text-muted-foreground">{item.dueDate}</td>
                                <td className="px-4 py-3">{item.salesVat.toLocaleString("sv-SE")} kr</td>
                                <td className="px-4 py-3">{item.inputVat.toLocaleString("sv-SE")} kr</td>
                                <td className="px-4 py-3 font-medium">{item.netVat.toLocaleString("sv-SE")} kr</td>
                                <td className="px-4 py-3">
                                    {item.status === "upcoming" ? (
                                        <span className="inline-flex items-center gap-1.5 text-amber-600">
                                            <Clock className="h-3.5 w-3.5" />
                                            Kommande
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-green-600">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Inskickad
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                            <Download className="h-4 w-4" />
                                        </button>
                                        {item.status === "upcoming" && (
                                            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                <Send className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </div>
        </main>
    )
}

// Inkomstdeklaration content
function InkomstdeklarationContent() {
    const [activeView, setActiveView] = useState<"summary" | "ink2">("summary")

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveView("summary")}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeView === "summary"
                            ? "bg-white text-black shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Översikt
                </button>
                <button
                    onClick={() => setActiveView("ink2")}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        activeView === "ink2"
                            ? "bg-white text-black shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    INK2 (Blankett)
                </button>
            </div>

            {activeView === "summary" ? (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Beskattningsår</p>
                            <p className="text-2xl font-semibold mt-1">2024</p>
                            <p className="text-sm text-muted-foreground mt-1">Räkenskapsår: jan - dec</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Beräknad bolagsskatt</p>
                            <p className="text-2xl font-semibold mt-1">87 344 kr</p>
                            <p className="text-sm text-muted-foreground mt-1">Skattesats: 20,6%</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <p className="text-lg font-semibold">Ej inlämnad</p>
                            </div>
                            <p className="text-sm text-amber-600 mt-1">Deadline: 1 jul 2025</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900">AI-assisterad deklaration</p>
                            <p className="text-sm text-blue-700 mt-1">Vår AI kan automatiskt fylla i din inkomstdeklaration baserat på dina bokförda transaktioner och underlag.</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                            <h2 className="font-medium">Resultaträkning - förhandsgranskning</h2>
                            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                <Download className="h-4 w-4" />
                                Ladda ner
                            </button>
                        </div>
                        <div className="divide-y divide-border/40">
                            {declarationItems.map((item) => (
                                <div key={item.label} className={`px-4 py-3 flex items-center justify-between ${item.highlight ? 'bg-muted/30 font-medium' : ''}`}>
                                    <span className="text-sm">{item.label}</span>
                                    <span className={`text-sm ${item.value < 0 ? 'text-red-600' : ''}`}>
                                        {item.value.toLocaleString('sv-SE')} kr
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Beskattningsår</p>
                            <p className="text-2xl font-semibold mt-1">2024</p>
                            <p className="text-sm text-muted-foreground mt-1">Inkomstdeklaration 2</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Bokfört resultat</p>
                            <p className="text-2xl font-semibold mt-1">379 000 kr</p>
                            <p className="text-sm text-green-600 mt-1">Före skattemässiga justeringar</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <p className="text-lg font-semibold">Utkast</p>
                            </div>
                            <p className="text-sm text-amber-600 mt-1">Deadline: 1 jul 2025</p>
                        </div>
                    </div>

                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                            <h2 className="font-medium">INK2 – Fält</h2>
                            <div className="flex items-center gap-2">
                                <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                    <Download className="h-4 w-4" />
                                    Exportera SRU
                                </button>
                                <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ml-4">
                                    <Send className="h-4 w-4" />
                                    Skicka till Skatteverket
                                </button>
                            </div>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/40 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium w-24">Fält</th>
                                    <th className="px-4 py-3 font-medium">Beskrivning</th>
                                    <th className="px-4 py-3 font-medium text-right">Belopp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ink2Fields.map((item) => (
                                    <tr key={item.field} className="border-b border-border/40 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-muted-foreground">{item.field}</td>
                                        <td className="px-4 py-3">{item.label}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${item.value < 0 ? 'text-red-600' : ''}`}>
                                            {item.value.toLocaleString('sv-SE')} kr
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            </div>
        </main>
    )
}

// Årsredovisning content
function ArsredovisningContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Räkenskapsår</p>
                    <p className="text-2xl font-semibold mt-1">2024</p>
                    <p className="text-sm text-muted-foreground mt-1">2024-01-01 – 2024-12-31</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Bolagsform</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <p className="text-lg font-semibold">Aktiebolag (AB)</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">K2-regelverk</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-5 w-5 text-amber-500" />
                        <p className="text-lg font-semibold">Under arbete</p>
                    </div>
                    <p className="text-sm text-amber-600 mt-1">Deadline: 30 jun 2025</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-900">AI-genererad årsredovisning</p>
                    <p className="text-sm text-blue-700 mt-1">Låt vår AI skapa en komplett årsredovisning enligt K2-regelverket baserat på din bokföring. Alla siffror hämtas automatiskt.</p>
                </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                    <h2 className="font-medium">Delar av årsredovisningen</h2>
                    <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <Download className="h-4 w-4" />
                        Ladda ner utkast
                    </button>
                </div>
                <div className="divide-y divide-border/40">
                    {reportSections.map((section) => (
                        <div key={section.name} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">{section.name}</p>
                                    <p className="text-sm text-muted-foreground">{section.description}</p>
                                </div>
                            </div>
                            <div>
                                {section.status === "complete" ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Klar
                                    </span>
                                ) : section.status === "incomplete" ? (
                                    <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                                        <Clock className="h-4 w-4" />
                                        Ofullständig
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        Väntar
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </div>
        </main>
    )
}

// Företagsstatistik content
function ForetagsstatistikContent() {
    const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue))
    
    // Professional monochromatic blue/gray palette
    const barColors = [
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
        { solid: '#3b82f6', stripe: '#60a5fa' }, // blue-500/blue-400
        { solid: '#6366f1', stripe: '#818cf8' }, // indigo-500/indigo-400
    ]

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <div className="grid grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon
                    return (
                        <div key={kpi.label} className="bg-card border border-border/40 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                                <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-semibold mt-1">{kpi.value}</p>
                            <div className={`flex items-center gap-1 mt-1 text-sm ${kpi.positive ? 'text-green-600' : 'text-red-600'}`}>
                                {kpi.positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {kpi.change} vs förra året
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border/40 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium">Omsättning per månad</h2>
                        <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex items-end gap-1 flex-1 min-h-[144px]">
                        {monthlyRevenue.map((m, index) => {
                            const colors = barColors[index % barColors.length]
                            return (
                                <Tooltip key={m.month}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex-1 flex flex-col rounded-t-lg min-h-[4px] overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                            style={{ height: `${(m.revenue / maxRevenue) * 100}%` }}
                                        >
                                            {/* Striped top portion */}
                                            <div 
                                                className="flex-[2]"
                                                style={{ 
                                                    background: `repeating-linear-gradient(
                                                        -45deg,
                                                        ${colors.solid},
                                                        ${colors.solid} 2px,
                                                        ${colors.stripe} 2px,
                                                        ${colors.stripe} 4px
                                                    )`
                                                }}
                                            />
                                            {/* Solid bottom portion with rounded top - negative margin to overlap */}
                                            <div 
                                                className="flex-[3] rounded-t-lg -mt-2 relative z-10" 
                                                style={{ backgroundColor: colors.solid }}
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent 
                                        side="top" 
                                        className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-3 border-2 border-dashed"
                                        style={{ borderColor: colors.solid }}
                                    >
                                        <div>
                                            <p className="font-medium text-xs mb-2" style={{ color: colors.solid }}>{m.month} 2024</p>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Intäkter</span>
                                                    <span className="font-medium text-foreground whitespace-nowrap">{m.revenue?.toLocaleString("sv-SE") || 0} kr</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-muted-foreground">Kostnader</span>
                                                    <span className="font-medium text-foreground whitespace-nowrap">-{m.expenses?.toLocaleString("sv-SE") || 0} kr</span>
                                                </div>
                                                <div className="border-t border-dashed pt-1.5 mt-1.5 flex justify-between gap-4" style={{ borderColor: colors.solid }}>
                                                    <span className="text-muted-foreground">Resultat</span>
                                                    <span className="font-semibold text-green-600 whitespace-nowrap">+{m.profit?.toLocaleString("sv-SE") || 0} kr</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                    <div className="flex gap-1 mt-2">
                        {monthlyRevenue.map((m) => (
                            <span key={m.month} className="flex-1 text-xs text-muted-foreground text-center">{m.month}</span>
                        ))}
                    </div>
                </div>

                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium">Kostnadsfördelning</h2>
                        <PieChart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                        {expenseCategories.map((cat) => (
                            <div key={cat.category}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span>{cat.category}</span>
                                    <span className="text-muted-foreground">{cat.amount.toLocaleString("sv-SE")} kr</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${cat.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40">
                    <h2 className="font-medium">Nyckeltal</h2>
                </div>
                <div className="grid grid-cols-4 divide-x divide-border/40">
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Vinstmarginal</p>
                        <p className="text-xl font-semibold mt-1">20,5%</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Avkastning på EK</p>
                        <p className="text-xl font-semibold mt-1">28,3%</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Skuldsättningsgrad</p>
                        <p className="text-xl font-semibold mt-1">0,8</p>
                    </div>
                    <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">Rörelsekapital</p>
                        <p className="text-xl font-semibold mt-1">245 tkr</p>
                    </div>
                </div>
            </div>
            </div>
        </main>
    )
}

export default function ReportsPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get("tab") || "momsdeklaration"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/reports?tab=${tab}`, { scroll: false })
    }, [router])

    const currentTabConfig = tabs.find(t => t.id === currentTab) || tabs[0]

    return (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-col h-svh">
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
                                    <BreadcrumbPage>Rapporter</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>

                {/* Tabs */}
                <div className="px-6 pt-6">
                    <div className="max-w-6xl w-full">
                        <div className="flex items-center gap-1 pb-2 mb-6 border-b border-border/20">
                            {tabs.map((tab) => {
                                const isActive = currentTab === tab.id
                                const Icon = tab.icon
                                
                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    isActive 
                                                        ? "bg-primary/10 text-primary" 
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {isActive && <span>{tab.label}</span>}
                                            </button>
                                        </TooltipTrigger>
                                        {!isActive && (
                                            <TooltipContent side="bottom">
                                                <p>{tab.label}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                )
                            })}
                            
                            <div className="ml-auto text-sm text-muted-foreground">
                                {getTabInfo(currentTab)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 flex flex-col bg-background overflow-auto">
                    {currentTab === "momsdeklaration" && <MomsdeklarationContent />}
                    {currentTab === "inkomstdeklaration" && <InkomstdeklarationContent />}
                    {currentTab === "arsredovisning" && <ArsredovisningContent />}
                </div>
            </div>
        </TooltipProvider>
    )
}
