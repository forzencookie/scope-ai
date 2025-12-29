"use client"

import { useState, useEffect } from "react"
import {
    Bot,
    User,
    CheckCircle2,
    Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
// import { employees } from "./constants"
import { useToast } from "@/components/ui/toast"
import { useVerifications } from "@/hooks/use-verifications"

interface AiDeduction {
    label: string
    amount: number
}

interface ChatMessage {
    role: "user" | "ai"
    text: string
}

interface Payslip {
    id: string | number
    employee: string
    period: string
    grossSalary: number
    netSalary: number
    tax: number
    status: string
    paymentDate?: string
}

interface PayslipCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPayslipCreated: (payslip: Payslip) => void
    currentPeriod: string
}

export function PayslipCreateDialog({
    open,
    onOpenChange,
    onPayslipCreated,
    currentPeriod,
}: PayslipCreateDialogProps) {
    const toast = useToast()
    const { addVerification } = useVerifications()

    const [employees, setEmployees] = useState<any[]>([])
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
    const [step, setStep] = useState(1)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    const [customSalary, setCustomSalary] = useState("")
    const [aiDeductions, setAiDeductions] = useState<AiDeduction[]>([])
    const [isCreating, setIsCreating] = useState(false)

    // Fetch real employees
    useEffect(() => {
        const fetchEmployees = async () => {
            setIsLoadingEmployees(true)
            try {
                const res = await fetch('/api/employees')
                const data = await res.json()
                if (data.employees) {
                    setEmployees(data.employees.map((e: any) => ({
                        id: e.id,
                        name: e.name,
                        role: e.role,
                        lastSalary: Number(e.monthly_salary),
                        taxRate: Number(e.tax_rate)
                    })))
                }
            } catch (err) {
                console.error("Failed to fetch employees:", err)
            } finally {
                setIsLoadingEmployees(false)
            }
        }
        if (open) fetchEmployees()
    }, [open])

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
        setIsCreating(false)
    }

    const handleConfirmPayslip = async () => {
        if (!selectedEmp) return
        setIsCreating(true)

        try {
            const payslipId = `LB-${Date.now()}`
            const response = await fetch('/api/payroll/payslips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: payslipId,
                    employee_id: selectedEmp.id,
                    period: currentPeriod,
                    gross_salary: finalSalary,
                    tax_deduction: tax,
                    net_salary: netSalary,
                    bonuses: aiDeductions.filter(d => d.amount < 0).reduce((sum, d) => sum + Math.abs(d.amount), 0),
                    deductions: aiDeductions.filter(d => d.amount > 0).reduce((sum, d) => sum + d.amount, 0),
                    status: "draft",
                    payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                })
            })

            if (!response.ok) throw new Error("Failed to save payslip")

            const saved = await response.json()

            // Create verification (ledger entries)
            await addVerification({
                description: `Lön ${selectedEmp.name} ${currentPeriod}`,
                date: new Date().toISOString().split('T')[0],
                rows: [
                    { account: "7010 Löner", description: `Lön ${selectedEmp.name}`, debit: finalSalary, credit: 0 },
                    { account: "2710 Personalskatt", description: `Personalskatt ${selectedEmp.name}`, debit: 0, credit: tax },
                    { account: "1930 Bankkonto", description: `Utbetalning lön ${selectedEmp.name}`, debit: 0, credit: netSalary },
                ],
            })

            toast.success("Lönebesked skapat!", `${selectedEmp.name}s lön för ${currentPeriod} har registrerats`)
            onPayslipCreated(saved.payslip)
            onOpenChange(false)
            resetDialog()
        } catch (error) {
            console.error(error)
            toast.error("Kunde inte skapa lönebesked", "Ett fel uppstod")
            setIsCreating(false)
        }
    }

    const handleSendMessage = () => {
        if (!chatInput.trim()) return

        setChatMessages(prev => [...prev, { role: "user", text: chatInput }])

        // Simulate AI response
        setTimeout(() => {
            const input = chatInput.toLowerCase()
            let response = "Jag har noterat det. Något annat som påverkar lönen?"
            const newDeductions: AiDeduction[] = []

            if (input.includes("sjuk")) {
                const days = parseInt(input.match(/(\d+)/)?.[1] || "1")
                const dailyRate = (selectedEmp?.lastSalary || 0) / 21
                const deduction = Math.round(dailyRate * days * 0.2) // 80% is covered
                newDeductions.push({ label: `Karensavdrag (${days} dag${days > 1 ? 'ar' : ''})`, amount: deduction })
                response = `Noterat ${days} sjukdag${days > 1 ? 'ar' : ''}. Karensavdrag på ${deduction.toLocaleString('sv-SE')} kr tillämpas.`
            }
            if (input.includes("övertid")) {
                const hours = parseInt(input.match(/(\d+)/)?.[1] || "1")
                const bonus = hours * 350
                newDeductions.push({ label: `Övertid (${hours}h)`, amount: -bonus })
                response = `Noterat ${hours} timmar övertid. ${bonus.toLocaleString('sv-SE')} kr extra läggs till.`
            }
            if (input.includes("bonus")) {
                const amount = parseInt(input.match(/(\d+)/)?.[1] || "0")
                if (amount > 0) {
                    newDeductions.push({ label: "Bonus", amount: -amount })
                    response = `Bonus på ${amount.toLocaleString('sv-SE')} kr har lagts till.`
                }
            }

            if (newDeductions.length > 0) {
                setAiDeductions(prev => [...prev, ...newDeductions])
            }

            setChatMessages(prev => [...prev, { role: "ai", text: response }])
        }, 600)

        setChatInput("")
    }

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) resetDialog()
            onOpenChange(newOpen)
        }}>
            <DialogContent className="sm:max-w-lg">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={cn(
                                    "w-8 h-0.5",
                                    step > s ? "bg-primary" : "bg-muted"
                                )} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Employee */}
                {step === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Välj anställd</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
                            {employees.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => setSelectedEmployee(emp.id)}
                                    className={cn(
                                        "w-full p-3 rounded-lg border-2 text-left transition-colors",
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
                            <div className="bg-muted/30 rounded-lg p-4 min-h-[200px] max-h-[280px] overflow-y-auto space-y-3">
                                <div className="flex gap-2">
                                    <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                        <Bot className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="bg-white dark:bg-background rounded-lg p-3 text-sm max-w-[85%]">
                                        <p>Hej! Finns det något speciellt som påverkar {selectedEmp.name}s lön denna månad?</p>
                                        <p className="text-muted-foreground mt-1 text-xs">T.ex. &quot;3 sjukdagar&quot;, &quot;10 timmar övertid&quot;, &quot;bonus 5000kr&quot;</p>
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
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Skriv här..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                />
                                <Button size="icon" onClick={handleSendMessage}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Tillbaka
                            </Button>
                            <Button className="flex-1" onClick={() => setStep(3)}>
                                Fortsätt till förhandsgranskning
                            </Button>
                        </div>
                    </>
                )}

                {/* Step 3: Confirm */}
                {step === 3 && selectedEmp && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Bekräfta lönebesked</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className={cn(
                                "rounded-lg p-4 space-y-4 border-2 transition-colors",
                                useAIRecommendation
                                    ? "bg-muted/40 border-foreground"
                                    : "bg-muted/30 border-border"
                            )}>
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
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setUseAIRecommendation(false)}
                                >
                                    Ändra belopp manuellt
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setStep(2)}>
                                Tillbaka
                            </Button>
                            <Button className="flex-1" onClick={handleConfirmPayslip} disabled={isCreating}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {isCreating ? "Skapar..." : "Bekräfta"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
