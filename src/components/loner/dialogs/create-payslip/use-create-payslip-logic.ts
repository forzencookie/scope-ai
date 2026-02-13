"use client"

import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/components/ui/toast"
import { useVerifications } from "@/hooks/use-verifications"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"

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

export interface PayslipEmployee {
    id: string
    name: string
    role: string
    lastSalary: number
    taxRate: number
    personalNumber?: string
    employmentType?: string
    taxTable?: number
    pensionRate?: number // Tjänstepension as decimal (e.g. 0.045 = 4.5%)
}

export interface ManualPersonData {
    name: string
    role: string
    salary: number
    personalNumber: string
    employmentType: string
    taxRate: string
    pensionRate: string   // Tjänstepension % (default "4.5")
    fackavgift: string    // Union fee kr/month (default "0")
    akassa: string        // A-kassa kr/month (default "0")
}

export function useCreatePayslipLogic({
    open,
    onOpenChange,
    onPayslipCreated,
    currentPeriod
}: PayslipCreateDialogProps) {
    const toast = useToast()
    const { addVerification } = useVerifications()
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear())

    const [employees, setEmployees] = useState<PayslipEmployee[]>([])
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
    const [step, setStep] = useState(1)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    const [customSalary, setCustomSalary] = useState("")
    const [aiDeductions, setAiDeductions] = useState<AiDeduction[]>([])
    const [isCreating, setIsCreating] = useState(false)

    // New states for manual person entry
    const [useManualEntry, setUseManualEntry] = useState(false)
    const [manualPerson, setManualPerson] = useState<ManualPersonData>({ name: "", role: "", salary: 0, personalNumber: "", employmentType: "tillsvidare", taxRate: "30", pensionRate: "4.5", fackavgift: "0", akassa: "0" })
    const [saveAsEmployee, setSaveAsEmployee] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Fetch real employees
    useEffect(() => {
        const fetchEmployees = async () => {
            setIsLoadingEmployees(true)
            try {
                const res = await fetch('/api/employees')
                const data = await res.json()
                if (data.employees) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setEmployees(data.employees.map((e: any): PayslipEmployee => ({
                        id: e.id,
                        name: e.name,
                        role: e.role,
                        lastSalary: Number(e.monthly_salary),
                        taxRate: Number(e.tax_rate) || 0.30,
                        personalNumber: e.personal_number || undefined,
                        employmentType: e.employment_type || undefined,
                        taxTable: e.tax_table ? Number(e.tax_table) : undefined,
                        pensionRate: e.pension_rate ? Number(e.pension_rate) : 0.045, // Default ITP1 4.5%
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

    // Filter employees by search query
    const filteredEmployees = useMemo(() => {
        if (!searchQuery.trim()) return employees
        const query = searchQuery.toLowerCase()
        return employees.filter(e =>
            e.name.toLowerCase().includes(query) ||
            e.role.toLowerCase().includes(query)
        )
    }, [employees, searchQuery])

    // selectedEmp can be either from database or manual entry
    const selectedEmp: PayslipEmployee | null = useManualEntry
        ? (manualPerson.name && manualPerson.salary > 0
            ? {
                id: 'manual',
                name: manualPerson.name,
                role: manualPerson.role,
                lastSalary: manualPerson.salary,
                taxRate: (parseFloat(manualPerson.taxRate) || 30) / 100,
                personalNumber: manualPerson.personalNumber || undefined,
                employmentType: manualPerson.employmentType || undefined,
                pensionRate: (parseFloat(manualPerson.pensionRate) || 4.5) / 100,
            }
            : null)
        : employees.find(e => e.id === selectedEmployee) || null

    const totalDeductions = aiDeductions.reduce((sum, d) => sum + d.amount, 0)
    const recommendedSalary = selectedEmp ? selectedEmp.lastSalary - totalDeductions : 0
    const finalSalary = useAIRecommendation ? recommendedSalary : (parseInt(customSalary) || recommendedSalary)
    const taxRate = selectedEmp?.taxRate || 0.30
    const tax = Math.round(finalSalary * taxRate)

    // Employee deductions (reduce net pay)
    const fackavgift = useManualEntry ? (parseFloat(manualPerson.fackavgift) || 0) : 0
    const akassa = useManualEntry ? (parseFloat(manualPerson.akassa) || 0) : 0
    const netSalary = finalSalary - tax - fackavgift - akassa

    // Derive age from personnummer for age-based employer contributions
    const getAgeFromPersonnummer = (pnr?: string): number | null => {
        if (!pnr || pnr.length < 8) return null
        const digits = pnr.replace(/\D/g, '')
        if (digits.length < 8) return null
        const birthYear = parseInt(digits.substring(0, 4))
        if (birthYear < 1900 || birthYear > 2100) return null
        return new Date().getFullYear() - birthYear
    }

    // Legal breakdown for lönespecifikation
    const employeeAge = getAgeFromPersonnummer(selectedEmp?.personalNumber)
    const isSenior = employeeAge !== null && employeeAge >= 66
    const employerContributionRate = isSenior ? taxRates.employerContributionRateSenior : taxRates.employerContributionRate
    const sempioneersattning = Math.round(finalSalary * taxRates.vacationPayRate)
    const employerContribution = Math.round(finalSalary * employerContributionRate)
    const pensionRate = selectedEmp?.pensionRate || 0.045 // Default ITP1 4.5%
    const pension = Math.round(finalSalary * pensionRate) // Employer cost
    const totalEmployerCost = finalSalary + employerContribution + pension

    // Check if can proceed from step 1
    const canProceedFromStep1 = useManualEntry
        ? (manualPerson.name.trim().length > 0 && manualPerson.salary > 0)
        : selectedEmployee !== null

    const resetDialog = () => {
        setStep(1)
        setSelectedEmployee(null)
        setChatInput("")
        setChatMessages([])
        setUseAIRecommendation(true)
        setCustomSalary("")
        setAiDeductions([])
        setIsCreating(false)
        // Reset manual entry states
        setUseManualEntry(false)
        setManualPerson({ name: "", role: "", salary: 0, personalNumber: "", employmentType: "tillsvidare", taxRate: "30", pensionRate: "4.5", fackavgift: "0", akassa: "0" })
        setSaveAsEmployee(true)
        setSearchQuery("")
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
                // Day 1 = karensdag (full deduction), day 2-14 = 80% sjuklön from employer
                const karensDeduction = Math.round(dailyRate) // 1 karensdag
                const sickPayDays = Math.max(0, days - 1)
                const sickDeduction = Math.round(dailyRate * sickPayDays * 0.2) // Employer pays 80%, deduct 20%
                const totalSickDeduction = karensDeduction + sickDeduction
                newDeductions.push({ label: `Sjukavdrag (${days} dag${days > 1 ? 'ar' : ''}, 1 karensdag)`, amount: totalSickDeduction })
                response = `Noterat ${days} sjukdag${days > 1 ? 'ar' : ''}. 1 karensdag + ${sickPayDays} dag${sickPayDays !== 1 ? 'ar' : ''} sjuklön (80%). Avdrag: ${totalSickDeduction.toLocaleString('sv-SE')} kr.`
            }
            if (input.includes("övertid")) {
                const hours = parseInt(input.match(/(\d+)/)?.[1] || "1")
                // Overtime rate: hourly rate × 1.5 (enkel övertid). Hourly = monthly / 168 (avg hours/month)
                const hourlyRate = Math.round((selectedEmp?.lastSalary || 0) / 168)
                const overtimeRate = Math.round(hourlyRate * 1.5)
                const bonus = hours * overtimeRate
                newDeductions.push({ label: `Övertid (${hours}h × ${overtimeRate} kr)`, amount: -bonus })
                response = `Noterat ${hours} timmar övertid (${overtimeRate} kr/h). ${bonus.toLocaleString('sv-SE')} kr extra läggs till.`
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
        // Prevent duplicate submissions
        if (isCreating) return
        setIsCreating(true)

        try {
            let employeeId = selectedEmp.id

            // If manual entry and user wants to save as employee, create the employee first
            if (useManualEntry && saveAsEmployee) {
                const empResponse = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: manualPerson.name,
                        role: manualPerson.role || 'Anställd',
                        monthly_salary: manualPerson.salary,
                        personal_number: manualPerson.personalNumber || null,
                        employment_type: manualPerson.employmentType || 'tillsvidare',
                        tax_rate: (parseFloat(manualPerson.taxRate) || 30) / 100,
                        pension_rate: (parseFloat(manualPerson.pensionRate) || 4.5) / 100,
                        status: 'active',
                    })
                })

                if (empResponse.ok) {
                    const empData = await empResponse.json()
                    employeeId = empData.employee?.id || employeeId
                    toast.success("Anställd sparad", `${manualPerson.name} har lagts till i teamet`)
                }
            }

            const payslipId = `LB-${Date.now()}`
            const response = await fetch('/api/payroll/payslips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: payslipId,
                    employee_id: employeeId !== 'manual' ? employeeId : null,
                    period: currentPeriod,
                    gross_salary: finalSalary,
                    tax_deduction: tax,
                    net_salary: netSalary,
                    employer_contributions: employerContribution,
                    bonuses: aiDeductions.filter(d => d.amount < 0).reduce((sum, d) => sum + Math.abs(d.amount), 0),
                    deductions: aiDeductions.filter(d => d.amount > 0).reduce((sum, d) => sum + d.amount, 0),
                    status: "draft",
                    payment_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    // Store manual person data if not saved as employee
                    manual_employee_name: useManualEntry && !saveAsEmployee ? manualPerson.name : null,
                    // Client creates its own (more detailed) verification with age-based rates, pension, etc.
                    skip_verification: true,
                })
            })

            if (!response.ok) throw new Error("Failed to save payslip")

            const saved = await response.json()

            // Use the already-computed values (age-aware employer contribution rate)
            const verificationRows = [
                { account: "7010", description: `Lön ${selectedEmp.name}`, debit: finalSalary, credit: 0 },
                { account: "7510", description: `Arbetsgivaravgift ${selectedEmp.name}${isSenior ? ' (reducerad)' : ''}`, debit: employerContribution, credit: 0 },
                { account: "7411", description: `Tjänstepension ${selectedEmp.name}`, debit: pension, credit: 0 },
                { account: "2710", description: `Personalskatt ${selectedEmp.name}`, debit: 0, credit: tax },
                { account: "2730", description: `Arbetsgivaravgift skuld ${selectedEmp.name}`, debit: 0, credit: employerContribution },
                { account: "2810", description: `Pensionsskuld ${selectedEmp.name}`, debit: 0, credit: pension },
                { account: "1930", description: `Utbetalning lön ${selectedEmp.name}`, debit: 0, credit: netSalary },
            ]

            // Add union/A-kassa deduction rows if applicable
            if (fackavgift > 0) {
                verificationRows.push({ account: "2790", description: `Fackavgift ${selectedEmp.name}`, debit: 0, credit: fackavgift })
            }
            if (akassa > 0) {
                verificationRows.push({ account: "2790", description: `A-kassa ${selectedEmp.name}`, debit: 0, credit: akassa })
            }

            // Create verification (ledger entries)
            await addVerification({
                description: `Lön ${selectedEmp.name} ${currentPeriod}`,
                date: new Date().toISOString().split('T')[0],
                rows: verificationRows,
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

    return {
        employees, filteredEmployees, isLoadingEmployees,
        step, setStep,
        selectedEmployee, setSelectedEmployee,
        selectedEmp,
        canProceedFromStep1,

        // Manual entry
        useManualEntry, setUseManualEntry,
        manualPerson, setManualPerson,
        saveAsEmployee, setSaveAsEmployee,
        searchQuery, setSearchQuery,

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
        taxRate,
        netSalary,
        fackavgift,
        akassa,
        sempioneersattning,
        employerContribution,
        employerContributionRate,
        isSenior,
        pension,
        pensionRate,
        totalEmployerCost,
        isCreating,
        handleConfirmPayslip,
        resetDialog
    }
}
