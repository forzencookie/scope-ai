"use client"

// Payroll page - Löner, AGI, Utdelning
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
import { Checkbox } from "@/components/ui/checkbox"
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
    Bot,
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
    { id: "agi", label: "AGI", icon: Send },
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

const k10Declarations = [
    { year: "2024", status: "draft", deadline: "2025-05-02", gransbelopp: 195250, usedAmount: 150000, savedAmount: 45250 },
    { year: "2023", status: "submitted", deadline: "2024-05-02", gransbelopp: 187550, usedAmount: 120000, savedAmount: 67550 },
    { year: "2022", status: "submitted", deadline: "2023-05-02", gransbelopp: 177100, usedAmount: 100000, savedAmount: 77100 },
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
function DividendTable({ data, maxRows, className }: { data: typeof dividendHistory; maxRows?: number; className?: string }) {
    const displayData = maxRows ? data.slice(0, maxRows) : data
    
    return (
        <DataTable className={className}>
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
                        <DataTableCell className="text-red-600 dark:text-red-500/70">-{div.tax.toLocaleString("sv-SE")} kr</DataTableCell>
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
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [step, setStep] = useState(1)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai", text: string}>>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    const [customSalary, setCustomSalary] = useState("")
    const [aiDeductions, setAiDeductions] = useState<Array<{label: string, amount: number}>>([])
    
    const employees = [
        { id: "anna", name: "Anna Andersson", role: "VD", lastSalary: 45000 },
        { id: "erik", name: "Erik Eriksson", role: "Utvecklare", lastSalary: 40000 },
    ]
    
    const selectedEmp = employees.find(e => e.id === selectedEmployee)
    const totalDeductions = aiDeductions.reduce((sum, d) => sum + d.amount, 0)
    const recommendedSalary = selectedEmp ? selectedEmp.lastSalary - totalDeductions : 0
    const finalSalary = useAIRecommendation ? recommendedSalary : (parseInt(customSalary) || recommendedSalary)
    const tax = Math.round(finalSalary * 0.24)
    const netSalary = finalSalary - tax
    
    const resetDialog = () => {
        setStep(1)
        setSelectedEmployee(null)
        setChatInput("")
        setChatMessages([])
        setUseAIRecommendation(true)
        setCustomSalary("")
        setAiDeductions([])
        setShowAIDialog(false)
    }
    
    const handleSendMessage = () => {
        if (!chatInput.trim()) return
        
        // Add user message
        const userMsg = chatInput.trim()
        setChatMessages(prev => [...prev, { role: "user", text: userMsg }])
        setChatInput("")
        
        // Simulate AI parsing the message and extracting deductions
        setTimeout(() => {
            let response = ""
            const newDeductions: Array<{label: string, amount: number}> = [...aiDeductions]
            
            if (userMsg.toLowerCase().includes("sjuk") || userMsg.toLowerCase().includes("sick")) {
                const days = userMsg.match(/(\d+)/)?.[1] || "1"
                newDeductions.push({ label: `Sjukavdrag (${days} dagar)`, amount: parseInt(days) * 1500 })
                response = `Noterat! Jag har lagt till sjukavdrag för ${days} dagar (-${(parseInt(days) * 1500).toLocaleString("sv-SE")} kr).`
            } else if (userMsg.toLowerCase().includes("laptop") || userMsg.toLowerCase().includes("dator") || userMsg.toLowerCase().includes("skada")) {
                const amount = userMsg.match(/(\d+)/)?.[1] || "5000"
                newDeductions.push({ label: "Löneavdrag (skada)", amount: parseInt(amount) })
                response = `Förstått! Jag har lagt till ett löneavdrag på ${parseInt(amount).toLocaleString("sv-SE")} kr för skadan.`
            } else if (userMsg.toLowerCase().includes("bonus")) {
                const amount = userMsg.match(/(\d+)/)?.[1] || "5000"
                newDeductions.push({ label: "Bonus", amount: -parseInt(amount) })
                response = `Toppen! Jag har lagt till en bonus på ${parseInt(amount).toLocaleString("sv-SE")} kr.`
            } else if (userMsg.toLowerCase().includes("övertid") || userMsg.toLowerCase().includes("overtime")) {
                const hours = userMsg.match(/(\d+)/)?.[1] || "10"
                newDeductions.push({ label: `Övertidsersättning (${hours}h)`, amount: -parseInt(hours) * 250 })
                response = `Noterat! Övertidsersättning för ${hours} timmar tillagd (+${(parseInt(hours) * 250).toLocaleString("sv-SE")} kr).`
            } else {
                response = "Jag förstår. Finns det något annat som påverkar lönen denna månad? T.ex. sjukdagar, bonus, övertid eller avdrag."
            }
            
            setAiDeductions(newDeductions)
            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 500)
    }
    
    return (
        <main className="p-6">
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

            <SectionCard
                icon={Bot}
                title="AI-löneförslag"
                description="Baserat på tidigare månader och anställningsavtal."
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

            {/* AI Salary Wizard Dialog */}
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

                    {/* Step 1: Select Employee */}
                    {step === 1 && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Välj anställd</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                                {employees.map((emp) => (
                                    <button
                                        key={emp.id}
                                        onClick={() => setSelectedEmployee(emp.id)}
                                        className={cn(
                                            "w-full p-4 rounded-lg border-2 text-left transition-colors",
                                            selectedEmployee === emp.id 
                                                ? "border-primary bg-primary/5" 
                                                : "border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{emp.name}</p>
                                                <p className="text-sm text-muted-foreground">{emp.role}</p>
                                            </div>
                                            <div className="ml-auto text-right">
                                                <p className="text-sm text-muted-foreground">Senaste lön</p>
                                                <p className="font-medium">{emp.lastSalary.toLocaleString("sv-SE")} kr</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={resetDialog}>
                                    Avbryt
                                </Button>
                                <Button 
                                    className="flex-1" 
                                    disabled={!selectedEmployee}
                                    onClick={() => setStep(2)}
                                >
                                    Nästa
                                </Button>
                            </div>
                        </>
                    )}

                    {/* Step 2: AI Chat for Details */}
                    {step === 2 && selectedEmp && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Bot className="h-5 w-5 text-purple-600" />
                                    Berätta om {selectedEmp.name}s månad
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Chat messages */}
                                <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[280px] overflow-y-auto space-y-3">
                                    {/* Initial AI message */}
                                    <div className="flex gap-2">
                                        <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                            <Bot className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="bg-white dark:bg-background rounded-lg p-3 text-sm max-w-[85%]">
                                            <p>Hej! Finns det något speciellt som påverkar {selectedEmp.name}s lön denna månad?</p>
                                            <p className="text-muted-foreground mt-1 text-xs">T.ex. &quot;3 sjukdagar&quot;, &quot;10 timmar övertid&quot;, &quot;bonus 5000kr&quot;</p>
                                        </div>
                                    </div>
                                    
                                    {/* Dynamic messages */}
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
                                    
                                    {/* Show current deductions */}
                                    {aiDeductions.length > 0 && (
                                        <div className="border-t pt-3 mt-3">
                                            <p className="text-xs text-muted-foreground mb-2">Registrerade justeringar:</p>
                                            {aiDeductions.map((d, i) => (
                                                <div key={i} className="flex justify-between text-xs">
                                                    <span>{d.label}</span>
                                                    <span className={d.amount > 0 ? "text-red-600" : "text-green-600"}>
                                                        {d.amount > 0 ? "-" : "+"}{Math.abs(d.amount).toLocaleString("sv-SE")} kr
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Chat input */}
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

                    {/* Step 3: Confirmation with AI Recommendation pre-selected */}
                    {step === 3 && selectedEmp && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Bekräfta lönebesked</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {/* Unified card with employee info and AI recommendation */}
                                <div className={cn(
                                    "rounded-lg p-4 space-y-4 border-2 transition-colors",
                                    useAIRecommendation 
                                        ? "bg-muted/40 border-foreground" 
                                        : "bg-muted/30 border-border"
                                )}>
                                    {/* Employee header */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{selectedEmp.name}</p>
                                            <p className="text-sm text-muted-foreground">{selectedEmp.role}</p>
                                        </div>
                                        {useAIRecommendation && (
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                                <Bot className="h-3 w-3" strokeWidth={2.5} />
                                                AI-förslag
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Salary breakdown */}
                                    <div className="border-t pt-3 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Grundlön</span>
                                            <span>{selectedEmp.lastSalary.toLocaleString("sv-SE")} kr</span>
                                        </div>
                                        {aiDeductions.map((d, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">{d.label}</span>
                                                <span className={d.amount > 0 ? "text-red-600" : "text-green-600"}>
                                                    {d.amount > 0 ? "-" : "+"}{Math.abs(d.amount).toLocaleString("sv-SE")} kr
                                                </span>
                                            </div>
                                        ))}
                                        {aiDeductions.length === 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Inga justeringar</span>
                                                <span className="text-muted-foreground">—</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Final salary display */}
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-medium">Bruttolön</span>
                                            <span className="text-2xl font-bold">
                                                {finalSalary.toLocaleString("sv-SE")} kr
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm mt-2">
                                            <span className="text-muted-foreground">Skatt (~24%)</span>
                                            <span className="text-red-600 dark:text-red-500/70">-{tax.toLocaleString("sv-SE")} kr</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium mt-1">
                                            <span>Nettolön</span>
                                            <span className="text-green-600 dark:text-green-500/70">{netSalary.toLocaleString("sv-SE")} kr</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Override input - only shown when user wants to change */}
                                {!useAIRecommendation ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={customSalary}
                                            onChange={(e) => setCustomSalary(e.target.value)}
                                            placeholder="Ange bruttolön..."
                                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                            autoFocus
                                        />
                                        <Button variant="outline" size="sm" onClick={() => {
                                            setUseAIRecommendation(true)
                                            setCustomSalary("")
                                        }}>
                                            Använd AI-förslag
                                        </Button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setUseAIRecommendation(false)}
                                        className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2"
                                    >
                                        Vill du ange en annan summa? Klicka här
                                    </button>
                                )}
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
                            <DataTableCell className="text-red-600 dark:text-red-500/70">-{slip.tax.toLocaleString("sv-SE")} kr</DataTableCell>
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
                                    <IconButton 
                                        icon={Send} 
                                        tooltip={slip.status === "pending" ? "Skicka" : "Redan skickad"}
                                        disabled={slip.status !== "pending"}
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

// AGI content
function AGIContent() {
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
            let response = "Jag har noterat det. Finns det något mer som påverkar AGI-deklarationen?"
            if (userMsg.toLowerCase().includes("förmån") || userMsg.toLowerCase().includes("bilförmån")) {
                response = "Förstått! Jag har lagt till förmånsvärdet i beräkningen."
            } else if (userMsg.toLowerCase().includes("sjuk") || userMsg.toLowerCase().includes("karens")) {
                response = "Noterat! Sjuklön och karensdagar är inkluderade."
            }
            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 500)
    }
    
    return (
        <main className="p-6">
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
                icon={Bot}
                title="Automatisk AGI"
                description="AI beräknar skatt och avgifter från lönedata."
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

            {/* AI AGI Wizard Dialog */}
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
                                <DialogTitle>Välj period</DialogTitle>
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
                                            <p className="font-medium">December 2024</p>
                                            <p className="text-sm text-muted-foreground">Arbetsgivardeklaration</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Deadline</p>
                                            <p className="font-medium">12 jan 2025</p>
                                        </div>
                                    </div>
                                </button>
                                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                                    <p>📊 Baserat på lönedata:</p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Antal anställda</span>
                                            <span className="font-medium text-foreground">2 st</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total bruttolön</span>
                                            <span className="font-medium text-foreground">85 000 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Skatteavdrag</span>
                                            <span className="font-medium text-foreground">20 400 kr</span>
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
                                            <p>Finns det något speciellt som påverkar AGI-deklarationen?</p>
                                            <p className="text-muted-foreground mt-1 text-xs">T.ex. förmåner, sjuklön, korrigeringar</p>
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
                                <DialogTitle>Bekräfta AGI</DialogTitle>
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
                                            <Send className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">AGI December 2024</p>
                                            <p className="text-sm text-muted-foreground">2 anställda</p>
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
                                            <span className="text-muted-foreground">Total bruttolön</span>
                                            <span>85 000 kr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Skatteavdrag</span>
                                            <span className="text-red-600 dark:text-red-500/70">20 400 kr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Arbetsgivaravgifter (31,42%)</span>
                                            <span className="text-red-600 dark:text-red-500/70">26 707 kr</span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-medium">Total att betala</span>
                                            <span className="text-2xl font-bold">47 107 kr</span>
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
                                    <IconButton 
                                        icon={Send} 
                                        tooltip={report.status === "pending" ? "Skicka" : "Redan inskickad"}
                                        disabled={report.status !== "pending"}
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

// Utdelning content
function UtdelningContent() {
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
            let response = "Jag har noterat det. Finns det något mer som påverkar K10-beräkningen?"
            if (userMsg.toLowerCase().includes("aktie") || userMsg.toLowerCase().includes("ägar")) {
                response = "Förstått! Jag har uppdaterat ägarandelen i beräkningen."
            } else if (userMsg.toLowerCase().includes("lönebaserat") || userMsg.toLowerCase().includes("huvudregel")) {
                response = "Noterat! Jag beräknar gränsbeloppet enligt huvudregeln med löneunderlag."
            }
            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 500)
    }
    
    return (
        <main className="p-6">
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
                variant="ai"
            />

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-card border-2 border-border/60 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-medium">Utdelningskalkylator</h2>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                            <Bot className="h-5 w-5 text-purple-600" />
                        </div>
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
                            <p className="text-lg font-semibold text-green-600 dark:text-green-500/70">240 250 kr</p>
                            <p className="text-xs text-muted-foreground">Schablonbelopp + sparat</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border-2 border-border/60 rounded-lg overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b-2 border-border/60 flex items-center justify-between">
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
                    <div className="max-h-[280px] overflow-y-auto">
                        <DividendTable data={dividendHistory} className="border-y-0" />
                    </div>
                </div>
            </div>

            {/* AI K10 Generation */}
            <SectionCard
                icon={Bot}
                title="AI-genererad K10"
                description="K10-blanketten genereras automatiskt baserat på ägarförhållanden och utdelningshistorik."
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

            {/* AI K10 Wizard Dialog */}
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
                                <DialogTitle>Välj inkomstår</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                                <button
                                    className="w-full p-4 rounded-lg border-2 border-primary bg-primary/5 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">K10 - Inkomstår 2024</p>
                                            <p className="text-sm text-muted-foreground">Kvalificerade andelar</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Deadline</p>
                                            <p className="font-medium">2 maj 2025</p>
                                        </div>
                                    </div>
                                </button>
                                <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                                    <p>📊 Baserat på ägarförhållanden:</p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between">
                                            <span>Ägarandel</span>
                                            <span className="font-medium text-foreground">100%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Gränsbelopp (schablonmetoden)</span>
                                            <span className="font-medium text-foreground">195 250 kr</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Sparat utrymme</span>
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
                                            <p>Finns det något speciellt som påverkar K10-beräkningen?</p>
                                            <p className="text-muted-foreground mt-1 text-xs">T.ex. ändrad ägarandel, lönebaserat utrymme, tidigare förluster</p>
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
                                <DialogTitle>Bekräfta K10</DialogTitle>
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
                                            <TrendingUp className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">K10 - Inkomstår 2024</p>
                                            <p className="text-sm text-muted-foreground">Kvalificerade andelar</p>
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
                                            <span className="text-muted-foreground">Schablonbelopp</span>
                                            <span>195 250 kr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Sparat utrymme</span>
                                            <span className="text-green-600 dark:text-green-500/70">+45 000 kr</span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-medium">Totalt gränsbelopp</span>
                                            <span className="text-2xl font-bold text-green-600 dark:text-green-500/70">240 250 kr</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Utdelning upp till detta belopp beskattas med 20%
                                        </p>
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

            {/* K10 Declarations */}
            <DataTable
                title="K10-deklarationer"
                headerActions={
                    <button className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm">
                        <Send className="h-4 w-4" />
                        Skicka till Skatteverket
                    </button>
                }
            >
                <DataTableHeader>
                    <DataTableHeaderCell label="Inkomstår" icon={Calendar} />
                    <DataTableHeaderCell label="Deadline" icon={Clock} />
                    <DataTableHeaderCell label="Gränsbelopp" icon={TrendingUp} align="right" />
                    <DataTableHeaderCell label="Använt" icon={DollarSign} align="right" />
                    <DataTableHeaderCell label="Sparat" icon={Wallet} align="right" />
                    <DataTableHeaderCell label="Status" icon={CheckCircle2} align="right" />
                    <DataTableHeaderCell label="" />
                </DataTableHeader>
                <DataTableBody>
                    {k10Declarations.map((k10) => (
                        <DataTableRow key={k10.year}>
                            <DataTableCell bold>Inkomstår {k10.year}</DataTableCell>
                            <DataTableCell muted>{k10.deadline}</DataTableCell>
                            <DataTableCell align="right">{k10.gransbelopp.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell align="right">{k10.usedAmount.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell align="right" className="text-green-600 dark:text-green-500/70">{k10.savedAmount.toLocaleString("sv-SE")} kr</DataTableCell>
                            <DataTableCell align="right">
                                {k10.status === "draft" ? (
                                    <AppStatusBadge status="Utkast" />
                                ) : (
                                    <AppStatusBadge status="Godkänd" />
                                )}
                            </DataTableCell>
                            <DataTableCell>
                                <IconButtonGroup>
                                    <IconButton icon={Download} tooltip="Ladda ner" />
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
                <div className="bg-background">
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
