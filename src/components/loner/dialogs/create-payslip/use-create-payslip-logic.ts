"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/toast"
import { useVerifications } from "@/hooks/use-verifications"

export interface AiDeduction {
    label: string
    amount: number
}

export interface ChatMessage {
    role: "user" | "ai"
    text: string
}

export interface Payslip {
    id: string | number
    employee: string
    period: string
    grossSalary: number
    netSalary: number
    tax: number
    status: string
    paymentDate?: string
}

export interface PayslipCreateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onPayslipCreated: (payslip: Payslip) => void
    currentPeriod: string
}

export function useCreatePayslipLogic({
    open,
    onOpenChange,
    onPayslipCreated,
    currentPeriod
}: PayslipCreateDialogProps) {
    const { toast } = useToast()
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
                    { account: "7010", description: `Lön ${selectedEmp.name}`, debit: finalSalary, credit: 0 },
                    { account: "2710", description: `Personalskatt ${selectedEmp.name}`, debit: 0, credit: tax },
                    { account: "1930", description: `Utbetalning lön ${selectedEmp.name}`, debit: 0, credit: netSalary },
                ],
            })

            toast({ title: "Lönebesked skapat!", description: `${selectedEmp.name}s lön för ${currentPeriod} har registrerats`, variant: "default" })
            onPayslipCreated(saved.payslip)
            onOpenChange(false)
            resetDialog()
        } catch (error) {
            console.error(error)
            toast({ title: "Kunde inte skapa lönebesked", description: "Ett fel uppstod", variant: "destructive" })
            setIsCreating(false)
        }
    }

    return {
        employees, isLoadingEmployees,
        step, setStep,
        selectedEmployee, setSelectedEmployee,
        selectedEmp,
        
        chatInput, setChatInput,
        chatMessages,
        handleSendMessage,
        
        aiDeductions,
        totalDeductions,
        recommendedSalary,
        customSalary, setCustomSalary,
        useAIRecommendation, setUseAIRecommendation,
        finalSalary,
        tax,
        netSalary,
        isCreating,
        handleConfirmPayslip,
        resetDialog
    }
}
