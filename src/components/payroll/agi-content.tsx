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
    Users,
    Banknote,
    Calculator
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
import { AppStatusBadge } from "@/components/ui/status-badge"
import { termExplanations, agiReports } from "./constants"

export function AGIContent() {
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
        <main className="px-6 pt-2 pb-6">
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

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

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
                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-800/40 text-purple-600 dark:text-purple-400 text-xs font-medium">
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
