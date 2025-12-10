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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RECEIPT_STATUS_LABELS, INVOICE_STATUS_LABELS } from "@/lib/localization"
import { 
    Frame, 
    FileText, 
    DollarSign, 
    Send,
    Search, 
    Settings, 
    CheckCircle2, 
    Clock, 
    Download, 
    Sparkles,
    User,
    Users,
    Calendar,
    Banknote,
    Wallet,
    TrendingUp,
    Calculator,
    AlertTriangle,
    Expand,
    HelpCircle,
} from "lucide-react"
import { AmountText } from "@/components/table/table-shell"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { IconButton, IconButtonGroup } from "@/components/ui/icon-button"
import { SectionCard } from "@/components/ui/section-card"
import { 
    DataTable, 
    DataTableHeader, 
    DataTableHeaderCell, 
    DataTableBody, 
    DataTableRow, 
    DataTableCell 
} from "@/components/ui/data-table"

// Swedish payroll term explanations
const termExplanations: Record<string, string> = {
    "Lönebesked": "Specifikation av lönen till anställd. Visar bruttolön, skatteavdrag och nettolön.",
    "AGI": "Arbetsgivardeklaration på individnivå. Månadsvis rapport till Skatteverket om löner och skatter.",
    "Utdelning": "Vinst som betalas ut till aktieägare. I fåmansbolag gäller särskilda 3:12-regler.",
    "3:12-regler": "Skatteregler för fåmansbolag. Bestämmer hur utdelning beskattas - som kapital (30%) eller tjänst (upp till 52%).",
    "Gränsbelopp": "Max belopp du kan ta ut som kapitalinkomst (30% skatt) enligt 3:12-reglerna. Beräknas årligen.",
    "Arbetsgivaravgifter": "Avgifter arbetsgivaren betalar utöver lönen (ca 31,42%). Inkluderar pensionsavgift, sjukförsäkring m.m.",
    "Preliminärskatt": "Skatt som dras från lönen varje månad. Justeras vid deklarationen.",
    "Bruttolön": "Lön före skatteavdrag.",
    "Nettolön": "Lön efter skatteavdrag - det som betalas ut till den anställde.",
}

// Tab configuration
const tabs = [
    { id: "lonebesked", label: "Lönebesked", icon: FileText },
    { id: "agi", label: "AGI", icon: FileText },
    { id: "utdelning", label: "Utdelning", icon: DollarSign },
]

// Data
const payslips = [
    { id: 1, employee: "Anna Andersson", period: "December 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "pending" },
    { id: 2, employee: "Erik Eriksson", period: "December 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "pending" },
    { id: 3, employee: "Anna Andersson", period: "November 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "sent" },
    { id: 4, employee: "Erik Eriksson", period: "November 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "sent" },
    { id: 5, employee: "Anna Andersson", period: "Oktober 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "sent" },
    { id: 6, employee: "Erik Eriksson", period: "Oktober 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "sent" },
]

const agiReports = [
    { period: "December 2024", dueDate: "12 jan 2025", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "pending" },
    { period: "November 2024", dueDate: "12 dec 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
    { period: "Oktober 2024", dueDate: "12 nov 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
    { period: "September 2024", dueDate: "12 okt 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
]

const dividendHistory = [
    { year: "2024", amount: 150000, taxRate: "20%", tax: 30000, netAmount: 120000, status: "planned" },
    { year: "2023", amount: 120000, taxRate: "20%", tax: 24000, netAmount: 96000, status: "paid" },
    { year: "2022", amount: 100000, taxRate: "20%", tax: 20000, netAmount: 80000, status: "paid" },
    { year: "2021", amount: 95000, taxRate: "20%", tax: 19000, netAmount: 76000, status: "paid" },
    { year: "2020", amount: 80000, taxRate: "20%", tax: 16000, netAmount: 64000, status: "paid" },
    { year: "2019", amount: 75000, taxRate: "20%", tax: 15000, netAmount: 60000, status: "paid" },
    { year: "2018", amount: 60000, taxRate: "20%", tax: 12000, netAmount: 48000, status: "paid" },
]

// Get contextual info for each tab
function getTabInfo(tabId: string) {
    switch (tabId) {
        case "lonebesked":
            return "Senast uppdaterad: idag 14:32"
        case "agi":
            return "Senast uppdaterad: igår 09:15"
        case "utdelning":
            return "Senast uppdaterad: 3 dec 2024"
        default:
            return ""
    }
}

// Dividend Table component
function DividendTable({ data, maxRows }: { data: typeof dividendHistory; maxRows?: number }) {
    const displayData = maxRows ? data.slice(0, maxRows) : data
    
    return (
        <DataTable>
            <DataTableHeader>
                <DataTableHeaderCell label="År" icon={Calendar} />
                <DataTableHeaderCell label="Belopp" icon={Banknote} />
                <DataTableHeaderCell label="Skatt" icon={Wallet} />
                <DataTableHeaderCell label="Status" icon={CheckCircle2} />
            </DataTableHeader>
            <DataTableBody>
                {displayData.map((div) => (
                    <DataTableRow key={div.year}>
                        <DataTableCell bold>{div.year}</DataTableCell>
                        <DataTableCell>{div.amount.toLocaleString("sv-SE")} kr</DataTableCell>
                        <DataTableCell className="text-red-600">-{div.tax.toLocaleString("sv-SE")} kr</DataTableCell>
                        <DataTableCell>
                            <AppStatusBadge 
                                status={div.status === "planned" ? "Planerad" : "Utbetald"} 
                                size="sm"
                            />
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTableBody>
        </DataTable>
    )
}

// Lönebesked content
function LonesbeskContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <StatCardGrid columns={3}>
                <StatCard
                    label="Aktuell period"
                    value="December 2024"
                    subtitle="2 anställda"
                    icon={Calendar}
                />
                <StatCard
                    label="Total bruttolön"
                    value="85 000 kr"
                    subtitle="Denna månad"
                    icon={Banknote}
                />
                <StatCard
                    label="Skatt att betala"
                    value="20 400 kr"
                    subtitle="Deadline: 12 jan 2025"
                    icon={Wallet}
                />
            </StatCardGrid>

            <DataTable title="Lönespecifikationer">
                <DataTableHeader>
                    <DataTableHeaderCell label="Anställd" icon={User} />
                    <DataTableHeaderCell label="Period" icon={Calendar} />
                    <DataTableHeaderCell label="Bruttolön" icon={Banknote} />
                    <DataTableHeaderCell label="Skatt" icon={Banknote} />
                    <DataTableHeaderCell label="Nettolön" icon={Wallet} />
                    <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                    <DataTableHeaderCell label="" />
                </DataTableHeader>
                <DataTableBody>
                    {payslips.map((slip) => (
                        <DataTableRow key={slip.id}>
                            <DataTableCell bold>{slip.employee}</DataTableCell>
                            <DataTableCell muted>{slip.period}</DataTableCell>
                            <DataTableCell><AmountText value={slip.grossSalary} /></DataTableCell>
                            <DataTableCell className="text-red-600">-{slip.tax.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell bold><AmountText value={slip.netSalary} /></DataTableCell>
                            <DataTableCell>
                                <AppStatusBadge 
                                    status={slip.status === "pending" ? "Väntar" : "Skickad"} 
                                    size="sm"
                                />
                            </DataTableCell>
                            <DataTableCell>
                                <IconButtonGroup>
                                    <IconButton icon={Download} tooltip="Ladda ner" />
                                    {slip.status === "pending" && (
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

// AGI content
function AGIContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <StatCardGrid columns={3}>
                <StatCard
                    label="Nästa AGI"
                    value="December 2024"
                    subtitle="Deadline: 12 jan 2025"
                    icon={Calendar}
                    tooltip={termExplanations["AGI"]}
                />
                <StatCard
                    label="Skatteavdrag"
                    value="20 400 kr"
                    subtitle="Preliminärskatt"
                    icon={Wallet}
                    tooltip={termExplanations["Preliminärskatt"]}
                />
                <StatCard
                    label="Arbetsgivaravgifter"
                    value="26 690 kr"
                    subtitle="31,42% av bruttolön"
                    icon={Calculator}
                    tooltip={termExplanations["Arbetsgivaravgifter"]}
                />
            </StatCardGrid>

            <SectionCard
                icon={Sparkles}
                title="Automatisk AGI-hantering"
                description="Vår AI skapar arbetsgivardeklarationen automatiskt baserat på löneutbetalningar och beräknar korrekta skatteavdrag och arbetsgivaravgifter."
            />

            <DataTable title="Arbetsgivardeklarationer (AGI)">
                <DataTableHeader>
                    <DataTableHeaderCell label="Period" icon={Calendar} />
                    <DataTableHeaderCell label="Deadline" icon={Clock} />
                    <DataTableHeaderCell label="Anställda" icon={Users} />
                    <DataTableHeaderCell label="Bruttolön" icon={Banknote} />
                    <DataTableHeaderCell label="Skatteavdrag" icon={Wallet} />
                    <DataTableHeaderCell label="Arbetsgivaravgifter" icon={Calculator} />
                    <DataTableHeaderCell label="Status" icon={CheckCircle2} />
                    <DataTableHeaderCell label="" />
                </DataTableHeader>
                <DataTableBody>
                    {agiReports.map((report) => (
                        <DataTableRow key={report.period}>
                            <DataTableCell bold>{report.period}</DataTableCell>
                            <DataTableCell muted>{report.dueDate}</DataTableCell>
                            <DataTableCell>{report.employees}</DataTableCell>
                            <DataTableCell>{report.totalSalary.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell>{report.tax.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell>{report.contributions.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell>
                                <AppStatusBadge 
                                    status={report.status === "pending" ? "Väntar" : "Inskickad"} 
                                    size="sm"
                                />
                            </DataTableCell>
                            <DataTableCell>
                                <IconButtonGroup>
                                    <IconButton icon={Download} tooltip="Ladda ner" />
                                    {report.status === "pending" && (
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

// Utdelning content
function UtdelningContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <StatCardGrid columns={3}>
                <StatCard
                    label="Gränsbelopp 2024"
                    value="195 250 kr"
                    subtitle="Schablonmetoden (2,75 IBB)"
                    icon={TrendingUp}
                    tooltip={termExplanations["Gränsbelopp"]}
                />
                <StatCard
                    label="Planerad utdelning"
                    value="150 000 kr"
                    subtitle="Inom gränsbeloppet"
                    icon={DollarSign}
                    tooltip={termExplanations["Utdelning"]}
                />
                <StatCard
                    label="Skatt på utdelning"
                    value="30 000 kr"
                    subtitle="20% kapitalskatt"
                    icon={Calculator}
                />
            </StatCardGrid>

            <SectionCard
                icon={AlertTriangle}
                title="3:12-reglerna"
                description="Som fåmansföretagare gäller särskilda regler för utdelning. Utdelning inom gränsbeloppet beskattas med 20% kapitalskatt. Utdelning över gränsbeloppet beskattas som tjänst."
            />

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium">Utdelningskalkylator</h2>
                        <Sparkles className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-muted-foreground">Löneunderlag</label>
                            <p className="text-lg font-semibold">1 020 000 kr</p>
                            <p className="text-xs text-muted-foreground">Kontrolluppgiftsbaserat</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Sparat utdelningsutrymme</label>
                            <p className="text-lg font-semibold">45 000 kr</p>
                            <p className="text-xs text-muted-foreground">Från tidigare år</p>
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground">Totalt gränsbelopp</label>
                            <p className="text-lg font-semibold text-green-600">240 250 kr</p>
                            <p className="text-xs text-muted-foreground">Schablonbelopp + sparat</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border/40 rounded-lg overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                        <h2 className="font-medium">Utdelningshistorik</h2>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Expand className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Utdelningshistorik</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[60vh] overflow-y-auto">
                                    <DividendTable data={dividendHistory} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="max-h-[200px] overflow-hidden">
                        <DividendTable data={dividendHistory} maxRows={4} />
                    </div>
                </div>
            </div>
            </div>
        </main>
    )
}

function PayrollPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get("tab") || "lonebesked"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/payroll?tab=${tab}`, { scroll: false })
    }, [router])

    const currentTabConfig = tabs.find(t => t.id === currentTab) || tabs[0]

    return (
        <TooltipProvider>
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
                                    <BreadcrumbPage>Löner</BreadcrumbPage>
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
                    {currentTab === "lonebesked" && <LonesbeskContent />}
                    {currentTab === "agi" && <AGIContent />}
                    {currentTab === "utdelning" && <UtdelningContent />}
                </div>
            </div>
        </TooltipProvider>
    )
}

function PayrollPageLoading() {
    return (
        <div className="flex items-center justify-center h-svh">
            <div className="animate-pulse text-muted-foreground">Laddar...</div>
        </div>
    )
}

export default function PayrollPage() {
    return (
        <Suspense fallback={<PayrollPageLoading />}>
            <PayrollPageContent />
        </Suspense>
    )
}
