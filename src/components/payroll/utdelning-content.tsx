"use client"

import { useState } from "react"
import { 
    Calendar, 
    Wallet,
    Bot,
    Send,
    Download,
    User,
    CheckCircle2,
    Clock,
    DollarSign,
    Calculator,
    TrendingUp,
    Expand,
    AlertTriangle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { AppStatusBadge } from "@/components/ui/status-badge"
import { termExplanations, dividendHistory, k10Declarations } from "./constants"

// Dividend table sub-component
interface DividendTableProps {
    data: typeof dividendHistory
    className?: string
}

function DividendTable({ data, className }: DividendTableProps) {
    return (
        <table className={cn("w-full text-sm border-y-2 border-border/60", className)}>
            <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            År
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <Wallet className="h-3.5 w-3.5" />
                            Belopp
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <Calculator className="h-3.5 w-3.5" />
                            Skatt
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            Netto
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Status
                        </span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr key={row.year} className="border-b border-border/40">
                        <td className="px-3 py-2 font-medium">{row.year}</td>
                        <td className="text-right px-3 py-2">{row.amount.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2 text-red-600 dark:text-red-500/70">{row.tax.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2 font-medium">{row.netAmount.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2">
                            <AppStatusBadge 
                                status={row.status === "planned" ? "Planerad" : "Utbetald"} 
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export function UtdelningContent() {
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
        <main className="px-6 pt-2 pb-6">
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
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400 text-xs font-medium">
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
