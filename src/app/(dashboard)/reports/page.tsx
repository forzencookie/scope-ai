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
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
    Bot,
    ArrowUpRight,
    ArrowDownRight,
    Users,
    User,
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
    { id: "momsdeklaration", label: "Momsdeklaration", icon: Calculator },
    { id: "inkomstdeklaration", label: "Inkomstdeklaration", icon: Send },
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
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [step, setStep] = useState(1)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai", text: string}>>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    
    const resetDialog = () => {
        setStep(1)
        setChatInput("")
        setChatMessages([])
        setUseAIRecommendation(true)
        setShowAIDialog(false)
    }
    
    const handleSendMessage = () => {
        if (!chatInput.trim()) return
        const userMsg = chatInput.trim()
        setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
        setChatInput("")
        
        setTimeout(() => {
            let response = "Jag har noterat det. Finns det något mer som påverkar momsdeklarationen?"
            if (userMsg.toLowerCase().includes("export") || userMsg.toLowerCase().includes("eu")) {
                response = "Förstått! Jag har justerat för EU-försäljning/export med 0% moms."
            } else if (userMsg.toLowerCase().includes("fel") || userMsg.toLowerCase().includes("korrigera")) {
                response = "Jag har noterat korrigeringen. Den kommer att inkluderas i beräkningen."
            }
            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 500)
    }
    
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

            <SectionCard
                icon={Bot}
                title="AI-momsdeklaration"
                description="Beräknas automatiskt från bokföringens momskonton (2610, 2640)."
                variant="ai"
                action={
                    <button 
                        onClick={() => setShowAIDialog(true)}
                        className="px-4 py-2 rounded-lg font-medium bg-white dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-800/50 transition-colors text-sm"
                    >
                        Generera
                    </button>
                }
            />

            {/* AI Moms Wizard Dialog */}
            <Dialog open={showAIDialog} onOpenChange={(open) => !open && resetDialog()}>
                <DialogContent className="sm:max-w-lg">
                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {s}
                                </div>
                                {s < 3 && <div className={cn("w-8 h-0.5", step > s ? "bg-primary" : "bg-muted")} />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Confirm Period */}
                    {step === 1 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Välj momsperiod</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                                <button
                                    className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">Q4 2024</p>
                                            <p className="text-sm text-muted-foreground">Oktober - December 2024</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Deadline</p>
                                            <p className="font-medium">12 feb 2025</p>
                                        </div>
                                    </div>
                                </button>
                                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                                    <p>📊 Baserat på bokföringen:</p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Utgående moms (konto 2610)</span>
                                            <span className="font-medium text-foreground">125 000 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Ingående moms (konto 2640)</span>
                                            <span className="font-medium text-foreground">45 000 kr</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={resetDialog}>
                                    Avbryt
                                </Button>
                                <Button className="flex-1" onClick={() => setStep(2)}>
                                    Nästa
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Step 2: AI Chat */}
                    {step === 2 && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-purple-600" />
                                    Finns det något speciellt?
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[280px] overflow-y-auto space-y-3">
                                    <div className="flex gap-2">
                                        <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                            <Bot className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="bg-white dark:bg-background rounded-lg p-3 text-sm max-w-[85%]">
                                            <p>Finns det något speciellt som påverkar momsen för Q4?</p>
                                            <p className="text-muted-foreground mt-1 text-xs">T.ex. EU-försäljning, korrigeringar, export</p>
                                        </div>
                                    </div>
                                    
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
                                            {msg.role === "ai" && (
                                                <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="h-4 w-4 text-purple-600" />
                                                </div>
                                            )}
                                            <div className={cn(
                                                "rounded-lg p-3 text-sm max-w-[85%]",
                                                msg.role === "user" 
                                                    ? "bg-primary text-primary-foreground" 
                                                    : "bg-white dark:bg-background"
                                            )}>
                                                {msg.text}
                                            </div>
                                            {msg.role === "user" && (
                                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        placeholder="Skriv här..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                    />
                                    <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                    Tillbaka
                                </Button>
                                <Button className="flex-1" onClick={() => setStep(3)}>
                                    Klar, visa förslag
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Bekräfta momsdeklaration</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className={cn(
                                    "rounded-lg p-5 space-y-5 border-2 transition-colors",
                                    useAIRecommendation 
                                        ? "bg-muted/40 border-foreground" 
                                        : "bg-muted/30 border-border"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">Momsdeklaration Q4 2024</p>
                                            <p className="text-sm text-muted-foreground">Oktober - December</p>
                                        </div>
                                        {useAIRecommendation && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                                <Bot className="h-3 w-3" strokeWidth={2.5} />
                                                AI-förslag
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="border-t pt-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Utgående moms</span>
                                            <span>125 000 kr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Ingående moms</span>
                                            <span className="text-green-600 dark:text-green-500/70">-45 000 kr</span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-medium">Moms att betala</span>
                                            <span className="text-2xl font-bold">80 000 kr</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setUseAIRecommendation(!useAIRecommendation)}
                                    className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2"
                                >
                                    {useAIRecommendation ? "Vill du redigera manuellt?" : "Använd AI-förslag"}
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                                    Tillbaka
                                </Button>
                                <Button className="flex-1" onClick={resetDialog}>
                                    Bekräfta
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

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
                                    <IconButton 
                                        icon={Send} 
                                        tooltip={item.status === "upcoming" ? "Skicka" : "Redan inskickad"} 
                                        disabled={item.status !== "upcoming"}
                                    />
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
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [step, setStep] = useState(1)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai", text: string}>>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    
    const resetDialog = () => {
        setStep(1)
        setChatInput("")
        setChatMessages([])
        setUseAIRecommendation(true)
        setShowAIDialog(false)
    }
    
    const handleSendMessage = () => {
        if (!chatInput.trim()) return
        const userMsg = chatInput.trim()
        setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
        setChatInput("")
        
        setTimeout(() => {
            let response = "Jag har noterat det. Finns det något mer som påverkar deklarationen?"
            if (userMsg.toLowerCase().includes("avskrivning") || userMsg.toLowerCase().includes("inventarier")) {
                response = "Förstått! Jag har justerat avskrivningar enligt bokföringen."
            } else if (userMsg.toLowerCase().includes("underskott") || userMsg.toLowerCase().includes("förlust")) {
                response = "Noterat! Underskottet kommer att rullas framåt enligt reglerna."
            }
            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 500)
    }
    
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

                <SectionCard
                    icon={Bot}
                    title="AI-inkomstdeklaration"
                    description="INK2-fälten genereras automatiskt från bokföringen."
                    variant="ai"
                    action={
                        <button 
                            onClick={() => setShowAIDialog(true)}
                            className="px-4 py-2 rounded-lg font-medium bg-white dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-800/50 transition-colors text-sm"
                        >
                            Generera
                        </button>
                    }
                />

                {/* AI INK2 Wizard Dialog */}
                <Dialog open={showAIDialog} onOpenChange={(open) => !open && resetDialog()}>
                    <DialogContent className="sm:max-w-lg">
                        {/* Step indicator */}
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                                        step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {s}
                                    </div>
                                    {s < 3 && <div className={cn("w-8 h-0.5", step > s ? "bg-primary" : "bg-muted")} />}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Confirm Year */}
                        {step === 1 && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Välj beskattningsår</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-3 py-4">
                                    <button
                                        className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">Inkomstår 2024</p>
                                                <p className="text-sm text-muted-foreground">INK2 - Aktiebolag</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Deadline</p>
                                                <p className="font-medium">1 jul 2025</p>
                                            </div>
                                        </div>
                                    </button>
                                    <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                                        <p>📊 Baserat på bokföringen:</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Rörelseintäkter</span>
                                                <span className="font-medium text-foreground">1 420 000 kr</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Rörelsekostnader</span>
                                                <span className="font-medium text-foreground">-1 041 000 kr</span>
                                            </div>
                                            <div className="flex justify-between border-t pt-1 mt-1">
                                                <span>Bokfört resultat</span>
                                                <span className="font-medium text-foreground">379 000 kr</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={resetDialog}>
                                        Avbryt
                                    </Button>
                                    <Button className="flex-1" onClick={() => setStep(2)}>
                                        Nästa
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 2: AI Chat */}
                        {step === 2 && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5 text-purple-600" />
                                        Finns det något speciellt?
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[280px] overflow-y-auto space-y-3">
                                        <div className="flex gap-2">
                                            <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                                <Bot className="h-4 w-4 text-purple-600" />
                                            </div>
                                            <div className="bg-white dark:bg-background rounded-lg p-3 text-sm max-w-[85%]">
                                                <p>Finns det något speciellt som påverkar inkomstdeklarationen?</p>
                                                <p className="text-muted-foreground mt-1 text-xs">T.ex. skattemässiga justeringar, underskott att rulla, särskilda avdrag</p>
                                            </div>
                                        </div>
                                        
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
                                                {msg.role === "ai" && (
                                                    <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                                        <Bot className="h-4 w-4 text-purple-600" />
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "rounded-lg p-3 text-sm max-w-[85%]",
                                                    msg.role === "user" 
                                                        ? "bg-primary text-primary-foreground" 
                                                        : "bg-white dark:bg-background"
                                                )}>
                                                    {msg.text}
                                                </div>
                                                {msg.role === "user" && (
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <User className="h-4 w-4 text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                            placeholder="Skriv här..."
                                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                        />
                                        <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                        Tillbaka
                                    </Button>
                                    <Button className="flex-1" onClick={() => setStep(3)}>
                                        Klar, visa förslag
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Bekräfta inkomstdeklaration</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className={cn(
                                        "rounded-lg p-5 space-y-5 border-2 transition-colors",
                                        useAIRecommendation 
                                            ? "bg-muted/40 border-foreground" 
                                            : "bg-muted/30 border-border"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">INK2 - Inkomstår 2024</p>
                                                <p className="text-sm text-muted-foreground">Aktiebolag</p>
                                            </div>
                                            {useAIRecommendation && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                                    <Bot className="h-3 w-3" strokeWidth={2.5} />
                                                    AI-förslag
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="border-t pt-3 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Rörelseresultat</span>
                                                <span>379 000 kr</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Skattemässiga justeringar</span>
                                                <span>0 kr</span>
                                            </div>
                                        </div>
                                        
                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-medium">Skattemässigt resultat</span>
                                                <span className="text-2xl font-bold">379 000 kr</span>
                                            </div>
                                            <div className="flex justify-between text-sm mt-2">
                                                <span className="text-muted-foreground">Beräknad skatt (20,6%)</span>
                                                <span className="text-red-600 dark:text-red-500/70">78 074 kr</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setUseAIRecommendation(!useAIRecommendation)}
                                        className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2"
                                    >
                                        {useAIRecommendation ? "Vill du redigera manuellt?" : "Använd AI-förslag"}
                                    </button>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                                        Tillbaka
                                    </Button>
                                    <Button className="flex-1" onClick={resetDialog}>
                                        Bekräfta
                                    </Button>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                <DataTable 
                    title="INK2 – Fält"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <IconButton icon={Download} label="Exportera SRU" showLabel />
                            <button
                                className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                            >
                                <Send className="h-4 w-4" />
                                Skicka till Skatteverket
                            </button>
                        </div>
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
                                <DataTableCell align="right" bold className={item.value < 0 ? 'text-red-600 dark:text-red-500/70' : ''}>
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
    const [showBankIdDialog, setShowBankIdDialog] = useState(false)
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [step, setStep] = useState(1)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai", text: string}>>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    
    const resetDialog = () => {
        setStep(1)
        setChatInput("")
        setChatMessages([])
        setUseAIRecommendation(true)
        setShowAIDialog(false)
    }
    
    const handleSendMessage = () => {
        if (!chatInput.trim()) return
        const userMsg = chatInput.trim()
        setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
        setChatInput("")
        
        setTimeout(() => {
            let response = "Jag har noterat det. Finns det något mer att ta med i förvaltningsberättelsen?"
            if (userMsg.toLowerCase().includes("händelse") || userMsg.toLowerCase().includes("väsentlig")) {
                response = "Förstått! Jag lägger till detta under Väsentliga händelser i förvaltningsberättelsen."
            } else if (userMsg.toLowerCase().includes("personal") || userMsg.toLowerCase().includes("anställd")) {
                response = "Noterat! Jag uppdaterar personalnoten med den informationen."
            }
            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 500)
    }
    
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
                icon={Bot}
                title="AI-årsredovisning"
                description="Genereras automatiskt från bokföringen enligt K2."
                variant="ai"
                action={
                    <button 
                        onClick={() => setShowAIDialog(true)}
                        className="px-4 py-2 rounded-lg font-medium bg-white dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-800/50 transition-colors text-sm"
                    >
                        Generera
                    </button>
                }
            />

            {/* AI Årsredovisning Wizard Dialog */}
            <Dialog open={showAIDialog} onOpenChange={(open) => !open && resetDialog()}>
                <DialogContent className="sm:max-w-lg">
                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {s}
                                </div>
                                {s < 3 && <div className={cn("w-8 h-0.5", step > s ? "bg-primary" : "bg-muted")} />}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Confirm Year */}
                    {step === 1 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Välj räkenskapsår</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                                <button
                                    className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">Räkenskapsår 2024</p>
                                            <p className="text-sm text-muted-foreground">2024-01-01 – 2024-12-31</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Deadline</p>
                                            <p className="font-medium">30 jun 2025</p>
                                        </div>
                                    </div>
                                </button>
                                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                                    <p>📊 Baserat på bokföringen:</p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Nettoomsättning</span>
                                            <span className="font-medium text-foreground">1 420 000 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Årets resultat</span>
                                            <span className="font-medium text-foreground">301 000 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Balansomslutning</span>
                                            <span className="font-medium text-foreground">890 000 kr</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={resetDialog}>
                                    Avbryt
                                </Button>
                                <Button className="flex-1" onClick={() => setStep(2)}>
                                    Nästa
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Step 2: AI Chat */}
                    {step === 2 && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-purple-600" />
                                    Finns det något speciellt?
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[280px] overflow-y-auto space-y-3">
                                    <div className="flex gap-2">
                                        <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                            <Bot className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="bg-white dark:bg-background rounded-lg p-3 text-sm max-w-[85%]">
                                            <p>Finns det något speciellt som ska med i årsredovisningen?</p>
                                            <p className="text-muted-foreground mt-1 text-xs">T.ex. väsentliga händelser, personalförändringar, framtidsutsikter</p>
                                        </div>
                                    </div>
                                    
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={cn("flex gap-2", msg.role === "user" && "justify-end")}>
                                            {msg.role === "ai" && (
                                                <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                                    <Bot className="h-4 w-4 text-purple-600" />
                                                </div>
                                            )}
                                            <div className={cn(
                                                "rounded-lg p-3 text-sm max-w-[85%]",
                                                msg.role === "user" 
                                                    ? "bg-primary text-primary-foreground" 
                                                    : "bg-white dark:bg-background"
                                            )}>
                                                {msg.text}
                                            </div>
                                            {msg.role === "user" && (
                                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <User className="h-4 w-4 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                        placeholder="Skriv här..."
                                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                    />
                                    <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                                    Tillbaka
                                </Button>
                                <Button className="flex-1" onClick={() => setStep(3)}>
                                    Klar, visa förslag
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Bekräfta årsredovisning</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className={cn(
                                    "rounded-lg p-5 space-y-5 border-2 transition-colors",
                                    useAIRecommendation 
                                        ? "bg-muted/40 border-foreground" 
                                        : "bg-muted/30 border-border"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">Årsredovisning 2024</p>
                                            <p className="text-sm text-muted-foreground">K2-regelverk</p>
                                        </div>
                                        {useAIRecommendation && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                                <Bot className="h-3 w-3" strokeWidth={2.5} />
                                                AI-förslag
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="border-t pt-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Nettoomsättning</span>
                                            <span>1 420 000 kr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Årets resultat</span>
                                            <span className="text-green-600 dark:text-green-500/70">301 000 kr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Balansomslutning</span>
                                            <span>890 000 kr</span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-3">
                                        <p className="text-sm text-muted-foreground mb-2">Genererade delar:</p>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                <span>Förvaltningsberättelse</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                <span>Resultaträkning</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                <span>Balansräkning</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                <span>Noter</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={() => setUseAIRecommendation(!useAIRecommendation)}
                                    className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2"
                                >
                                    {useAIRecommendation ? "Vill du redigera manuellt?" : "Använd AI-förslag"}
                                </button>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                                    Tillbaka
                                </Button>
                                <Button className="flex-1" onClick={resetDialog}>
                                    Bekräfta
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            <DataTable 
                title="Delar av årsredovisningen"
                headerActions={
                    <div className="flex items-center gap-2">
                        <IconButton icon={Download} label="Ladda ner PDF" showLabel />
                        <button
                            onClick={() => setShowBankIdDialog(true)}
                            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm"
                        >
                            <Send className="h-4 w-4" />
                            Skicka till Bolagsverket
                        </button>
                    </div>
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

            {/* BankID Signing Dialog */}
            <Dialog open={showBankIdDialog} onOpenChange={setShowBankIdDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Skicka årsredovisning till Bolagsverket</DialogTitle>
                        <DialogDescription>
                            Du är på väg att skicka in årsredovisningen för räkenskapsåret 2024.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Bolag</span>
                                <span className="font-medium">Mitt Företag AB</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Org.nr</span>
                                <span className="font-medium">559123-4567</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Räkenskapsår</span>
                                <span className="font-medium">2024-01-01 – 2024-12-31</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Regelverk</span>
                                <span className="font-medium">K2</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Genom att signera bekräftar du att uppgifterna i årsredovisningen är korrekta och att du har behörighet att företräda bolaget.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setShowBankIdDialog(false)}
                            className="w-full px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-[#183E4F] text-white hover:bg-[#183E4F]/90 transition-colors"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Signera med BankID
                        </button>
                        <button
                            onClick={() => setShowBankIdDialog(false)}
                            className="w-full px-4 py-2 rounded-lg font-medium text-muted-foreground hover:bg-muted/50 transition-colors text-sm"
                        >
                            Avbryt
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
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
            <div className="flex flex-col min-h-svh">
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
                <div className="bg-background">
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
