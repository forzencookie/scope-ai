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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
    Calendar,
    Banknote,
    Wallet,
    TrendingUp,
    Calculator,
    AlertTriangle,
    Expand
} from "lucide-react"
import { TableShell, HeaderCell, AmountText } from "@/components/table/table-shell"

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
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">År</th>
                    <th className="px-4 py-3 font-medium">Belopp</th>
                    <th className="px-4 py-3 font-medium">Skatt</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                </tr>
            </thead>
            <tbody>
                {displayData.map((div) => (
                    <tr key={div.year} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{div.year}</td>
                        <td className="px-4 py-3">{div.amount.toLocaleString("sv-SE")} kr</td>
                        <td className="px-4 py-3 text-red-600">-{div.tax.toLocaleString("sv-SE")} kr</td>
                        <td className="px-4 py-3">
                            {div.status === "planned" ? (
                                <span className="inline-flex items-center gap-1.5 text-amber-600">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    Planerad
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-green-600">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Utbetald
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

// Lönebesked content
function LonesbeskContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Aktuell period</p>
                    <p className="text-2xl font-semibold mt-1">December 2024</p>
                    <p className="text-sm text-muted-foreground mt-1">2 anställda</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Total bruttolön</p>
                    <p className="text-2xl font-semibold mt-1">85 000 kr</p>
                    <p className="text-sm text-muted-foreground mt-1">Denna månad</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Skatt att betala</p>
                    <p className="text-2xl font-semibold mt-1">20 400 kr</p>
                    <p className="text-sm text-amber-600 mt-1">Deadline: 12 jan 2025</p>
                </div>
            </div>

            <div className="w-full overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40">
                    <h2 className="font-medium">Lönespecifikationer</h2>
                </div>
                <TableShell
                    header={
                        <tr className="border-b border-border/50 transition-colors hover:bg-muted/50 text-left text-muted-foreground">
                            <HeaderCell label="Anställd" icon={<User className="h-3.5 w-3.5" />} minWidth="min-w-[200px]" />
                            <HeaderCell label="Period" icon={<Calendar className="h-3.5 w-3.5" />} minWidth="min-w-[140px]" />
                            <HeaderCell label="Bruttolön" icon={<Banknote className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                            <HeaderCell label="Skatt" icon={<Banknote className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                            <HeaderCell label="Nettolön" icon={<Wallet className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                            <HeaderCell label="Status" icon={<Clock className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                            <HeaderCell label="Åtgärder" icon={<Download className="h-3.5 w-3.5" />} minWidth="min-w-[120px]" align="right" />
                        </tr>
                    }
                >
                    {payslips.map((slip) => (
                        <tr key={slip.id} className="h-[36px] border-b border-border/50 transition-colors hover:bg-muted/30">
                            <td className="px-2 py-0.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <span className="font-medium">{slip.employee}</span>
                                </div>
                            </td>
                            <td className="px-2 py-0.5 text-muted-foreground">{slip.period}</td>
                            <td className="px-2 py-0.5 text-right"><AmountText value={slip.grossSalary} /></td>
                            <td className="px-2 py-0.5 text-right text-red-600">-{slip.tax.toLocaleString("sv-SE")} kr</td>
                            <td className="px-2 py-0.5 text-right font-medium"><AmountText value={slip.netSalary} /></td>
                            <td className="px-2 py-0.5">
                                {slip.status === "pending" ? (
                                    <span className="inline-flex items-center gap-1.5 text-amber-600">
                                        <Clock className="h-3.5 w-3.5" />
                                        Väntar
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 text-green-600">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Skickad
                                    </span>
                                )}
                            </td>
                            <td className="px-2 py-0.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                        <Download className="h-4 w-4" />
                                    </button>
                                    {slip.status === "pending" && (
                                        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                            <Send className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </TableShell>
            </div>
            </div>
        </main>
    )
}

// AGI content
function AGIContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Nästa AGI</p>
                    <p className="text-2xl font-semibold mt-1">December 2024</p>
                    <p className="text-sm text-amber-600 mt-1">Deadline: 12 jan 2025</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Skatteavdrag</p>
                    <p className="text-2xl font-semibold mt-1">20 400 kr</p>
                    <p className="text-sm text-muted-foreground mt-1">Preliminärskatt</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Arbetsgivaravgifter</p>
                    <p className="text-2xl font-semibold mt-1">26 690 kr</p>
                    <p className="text-sm text-muted-foreground mt-1">31,42% av bruttolön</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-blue-900">Automatisk AGI-hantering</p>
                    <p className="text-sm text-blue-700 mt-1">Vår AI skapar arbetsgivardeklarationen automatiskt baserat på löneutbetalningar och beräknar korrekta skatteavdrag och arbetsgivaravgifter.</p>
                </div>
            </div>

            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40">
                    <h2 className="font-medium">Arbetsgivardeklarationer (AGI)</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40 text-left text-muted-foreground">
                            <th className="px-4 py-3 font-medium">Period</th>
                            <th className="px-4 py-3 font-medium">Deadline</th>
                            <th className="px-4 py-3 font-medium">Anställda</th>
                            <th className="px-4 py-3 font-medium">Bruttolön</th>
                            <th className="px-4 py-3 font-medium">Skatteavdrag</th>
                            <th className="px-4 py-3 font-medium">Arbetsgivaravgifter</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {agiReports.map((report) => (
                            <tr key={report.period} className="border-b border-border/40 hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">{report.period}</td>
                                <td className="px-4 py-3 text-muted-foreground">{report.dueDate}</td>
                                <td className="px-4 py-3">{report.employees}</td>
                                <td className="px-4 py-3">{report.totalSalary.toLocaleString("sv-SE")} kr</td>
                                <td className="px-4 py-3">{report.tax.toLocaleString("sv-SE")} kr</td>
                                <td className="px-4 py-3">{report.contributions.toLocaleString("sv-SE")} kr</td>
                                <td className="px-4 py-3">
                                    {report.status === "pending" ? (
                                        <span className="inline-flex items-center gap-1.5 text-amber-600">
                                            <Clock className="h-3.5 w-3.5" />
                                            Väntar
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
                                        {report.status === "pending" && (
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

// Utdelning content
function UtdelningContent() {
    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Gränsbelopp 2024</p>
                    <p className="text-2xl font-semibold mt-1">195 250 kr</p>
                    <p className="text-sm text-muted-foreground mt-1">Schablonmetoden (2,75 IBB)</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Planerad utdelning</p>
                    <p className="text-2xl font-semibold mt-1">150 000 kr</p>
                    <p className="text-sm text-green-600 mt-1">Inom gränsbeloppet</p>
                </div>
                <div className="bg-card border border-border/40 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">Skatt på utdelning</p>
                    <p className="text-2xl font-semibold mt-1">30 000 kr</p>
                    <p className="text-sm text-muted-foreground mt-1">20% kapitalskatt</p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-amber-900">3:12-reglerna</p>
                    <p className="text-sm text-amber-700 mt-1">Som fåmansföretagare gäller särskilda regler för utdelning. Utdelning inom gränsbeloppet beskattas med 20% kapitalskatt. Utdelning över gränsbeloppet beskattas som tjänst.</p>
                </div>
            </div>

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

export default function PayrollPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get("tab") || "lonebesked"

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/payroll?tab=${tab}`, { scroll: false })
    }, [router])

    const currentTabConfig = tabs.find(t => t.id === currentTab) || tabs[0]

    return (
        <TooltipProvider>
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
                                    <BreadcrumbPage>Löner</BreadcrumbPage>
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
                    {currentTab === "lonebesked" && <LonesbeskContent />}
                    {currentTab === "agi" && <AGIContent />}
                    {currentTab === "utdelning" && <UtdelningContent />}
                </div>
            </div>
        </TooltipProvider>
    )
}
