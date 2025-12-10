"use client"

import { useState, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
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
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
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
    Droplets,
    Calendar,
    Calculator,
    HelpCircle,
} from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { IconButton, IconButtonGroup } from "@/components/ui/icon-button"
import { 
    DataTable, 
    DataTableHeader, 
    DataTableHeaderCell, 
    DataTableBody, 
    DataTableRow, 
    DataTableCell 
} from "@/components/ui/data-table"
import { SectionCard } from "@/components/ui/section-card"

// Swedish tax/accounting term explanations
const termExplanations: Record<string, string> = {
    "Momsdeklaration": "Rapport till Skatteverket om moms (mervärdesskatt) du samlat in och betalat. Lämnas månads- eller kvartalsvis.",
    "Inkomstdeklaration": "Årlig rapport till Skatteverket om företagets inkomster och kostnader. Används för att beräkna inkomstskatt.",
    "Årsredovisning": "Sammanfattning av företagets ekonomi för ett räkenskapsår. Obligatorisk för aktiebolag.",
    "Utgående moms": "Moms du tar ut av dina kunder vid försäljning (25%, 12% eller 6%).",
    "Ingående moms": "Moms du betalar på inköp som du får dra av.",
    "Moms att betala": "Skillnaden mellan utgående och ingående moms. Betalas till Skatteverket.",
    "INK2": "Inkomstdeklaration 2 - skatteblanketten för aktiebolag.",
    "Rörelseresultat": "Vinst/förlust från kärnverksamheten, före finansiella poster och skatt.",
    "3:12-regler": "Regler för hur utdelning från fåmansbolag beskattas. Påverkar hur mycket du kan ta ut som kapitalinkomst.",
    "Gränsbelopp": "Max belopp du kan ta ut som kapitalinkomst (lägre skatt) enligt 3:12-reglerna.",
}

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
            <StatCardGrid columns={3}>
                <StatCard
                    label="Nästa deklaration"
                    value="Q4 2024"
                    subtitle="Deadline: 12 feb 2025"
                    icon={Calendar}
                    tooltip={termExplanations["Momsdeklaration"]}
                />
                <StatCard
                    label="Moms att betala"
                    value="80 000 kr"
                    subtitle="Utgående: 125 000 kr"
                    icon={Wallet}
                    tooltip={termExplanations["Moms att betala"]}
                />
                <StatCard
                    label="Ingående moms"
                    value="45 000 kr"
                    subtitle="Avdragsgill"
                    icon={TrendingUp}
                    tooltip={termExplanations["Ingående moms"]}
                />
            </StatCardGrid>

            <DataTable title="Momsperioder">
                <DataTableHeader>
                    <DataTableHeaderCell label="Period" icon={Calendar} />
                    <DataTableHeaderCell label="Deadline" icon={Clock} />
                    <DataTableHeaderCell label="Utgående moms" icon={ArrowUpRight} />
                    <DataTableHeaderCell label="Ingående moms" icon={ArrowDownRight} />
                    <DataTableHeaderCell label="Att betala" icon={Wallet} />
                    <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                    <DataTableHeaderCell label="" />
                </DataTableHeader>
                <DataTableBody>
                    {vatPeriods.map((item) => (
                        <DataTableRow key={item.period}>
                            <DataTableCell bold>{item.period}</DataTableCell>
                            <DataTableCell muted>{item.dueDate}</DataTableCell>
                            <DataTableCell>{item.salesVat.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell>{item.inputVat.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell bold>{item.netVat.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell>
                                <StatusBadge 
                                    status={item.status === "upcoming" ? "Kommande" : "Inskickad"} 
                                    variant={item.status === "upcoming" ? "warning" : "success"} 
                                />
                            </DataTableCell>
                            <DataTableCell>
                                <IconButtonGroup>
                                    <IconButton icon={Download} tooltip="Ladda ner" />
                                    {item.status === "upcoming" && (
                                        <IconButton icon={Send} tooltip="Skicka" />
                                    )}
                                </IconButtonGroup>
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
            </div>
        </main>
    )
}

// Inkomstdeklaration content
function InkomstdeklarationContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label="Beskattningsår"
                        value="2024"
                        subtitle="Inkomstdeklaration 2"
                        icon={Calendar}
                    />
                    <StatCard
                        label="Bokfört resultat"
                        value="379 000 kr"
                        subtitle="Före skattemässiga justeringar"
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Status"
                        value={INVOICE_STATUS_LABELS.DRAFT}
                        subtitle="Deadline: 1 jul 2025"
                        icon={Clock}
                    />
                </StatCardGrid>

                <DataTable 
                    title="INK2 – Fält"
                    headerActions={
                        <>
                            <IconButton icon={Download} label="Exportera SRU" showLabel />
                            <IconButton icon={Send} label="Skicka till Skatteverket" showLabel />
                        </>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderCell label="Fält" icon={FileText} width="96px" />
                        <DataTableHeaderCell label="Beskrivning" icon={FileBarChart} />
                        <DataTableHeaderCell label="Belopp" icon={Wallet} align="right" />
                    </DataTableHeader>
                    <DataTableBody>
                        {ink2Fields.map((item) => (
                            <DataTableRow key={item.field}>
                                <DataTableCell mono muted>{item.field}</DataTableCell>
                                <DataTableCell>{item.label}</DataTableCell>
                                <DataTableCell align="right" bold className={item.value < 0 ? 'text-red-600' : ''}>
                                    {item.value.toLocaleString('sv-SE')} kr
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </div>
        </main>
    )
}

// Årsredovisning content
function ArsredovisningContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <StatCardGrid columns={3}>
                <StatCard
                    label="Räkenskapsår"
                    value="2024"
                    subtitle="2024-01-01 – 2024-12-31"
                    icon={Calendar}
                />
                <StatCard
                    label="Bolagsform"
                    value="Aktiebolag (AB)"
                    subtitle="K2-regelverk"
                    icon={Building2}
                />
                <StatCard
                    label="Status"
                    value="Under arbete"
                    subtitle="Deadline: 30 jun 2025"
                    icon={Clock}
                />
            </StatCardGrid>

            <SectionCard
                icon={Sparkles}
                title="AI-genererad årsredovisning"
                description="Låt vår AI skapa en komplett årsredovisning enligt K2-regelverket baserat på din bokföring. Alla siffror hämtas automatiskt."
            />

            <DataTable 
                title="Delar av årsredovisningen"
                headerActions={
                    <IconButton icon={Download} label="Ladda ner utkast" showLabel />
                }
            >
                <DataTableBody>
                    {reportSections.map((section) => (
                        <DataTableRow key={section.name}>
                            <DataTableCell>
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">{section.name}</p>
                                        <p className="text-sm text-muted-foreground">{section.description}</p>
                                    </div>
                                </div>
                            </DataTableCell>
                            <DataTableCell align="right">
                                <StatusBadge 
                                    status={section.status === "complete" ? "Klar" : section.status === "incomplete" ? "Ofullständig" : "Väntar"} 
                                    variant={section.status === "complete" ? "success" : section.status === "incomplete" ? "warning" : "neutral"} 
                                    size="md"
                                />
                            </DataTableCell>
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
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
            <StatCardGrid columns={4}>
                {kpis.map((kpi) => (
                    <StatCard
                        key={kpi.label}
                        label={kpi.label}
                        value={kpi.value}
                        change={`${kpi.change} vs förra året`}
                        changeType={kpi.positive ? "positive" : "negative"}
                        icon={kpi.icon}
                        variant="filled"
                    />
                ))}
            </StatCardGrid>

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

function ReportsPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get("tab") || "momsdeklaration"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/reports?tab=${tab}`, { scroll: false })
    }, [router])

    const currentTabConfig = tabs.find(t => t.id === currentTab) || tabs[0]

    return (
        <TooltipProvider delayDuration={400}>
            <div className="flex flex-col h-svh overflow-auto">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                    <div className="flex items-center gap-2">
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
                    <BreadcrumbAIBadge />
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
                <div className="flex-1 flex flex-col bg-background">
                    {currentTab === "momsdeklaration" && <MomsdeklarationContent />}
                    {currentTab === "inkomstdeklaration" && <InkomstdeklarationContent />}
                    {currentTab === "arsredovisning" && <ArsredovisningContent />}
                </div>
            </div>
        </TooltipProvider>
    )
}

function ReportsPageLoading() {
    return (
        <div className="flex items-center justify-center h-svh">
            <div className="animate-pulse text-muted-foreground">Laddar...</div>
        </div>
    )
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<ReportsPageLoading />}>
            <ReportsPageContent />
        </Suspense>
    )
}
