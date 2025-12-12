"use client"

import { useState } from "react"
import { 
    Calendar, 
    Banknote, 
    Wallet,
    Bot,
    Send,
    Download,
    User,
    CheckCircle2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import { 
    DataTable, 
    DataTableHeader, 
    DataTableBody, 
    DataTableRow, 
    DataTableCell, 
    DataTableHeaderCell
} from "@/components/ui/data-table"
import { IconButton, IconButtonGroup } from "@/components/ui/icon-button"
import { AmountText } from "@/components/table/table-shell"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { payslips, employees } from "./constants"

export function LonesbeskContent() {
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [step, setStep] = useState(1)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai", text: string}>>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    const [customSalary, setCustomSalary] = useState("")
    const [aiDeductions, setAiDeductions] = useState<Array<{label: string, amount: number}>>([])
    
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
        <main className="px-6 pt-2 pb-6">
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

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

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
                                                    <span className={d.amount > 0 ? "text-red-600 dark:text-red-500/70" : "text-green-600 dark:text-green-500/70"}>
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
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400 text-xs font-medium">
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
                                                <span className={d.amount > 0 ? "text-red-600 dark:text-red-500/70" : "text-green-600 dark:text-green-500/70"}>
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
