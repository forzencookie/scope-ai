"use client"

import { useState, useMemo, useEffect } from "react"
import { useEmployees } from "@/hooks/use-employees"
import { useVerifications } from "@/hooks/use-verifications"
import { getEmployeeBenefits } from "@/lib/formaner"

export interface SalaryRecord {
    period: string
    grossSalary: number
    netSalary: number
    tax: number
    status: string
}

export interface ExpenseRecord {
    date: string
    description: string
    amount: number
    type: 'expense' | 'mileage'
}

export function useTeamLogic() {
    const { verifications } = useVerifications()
    const { employees, isLoading } = useEmployees()

    const [dossierOpen, setDossierOpen] = useState(false)
    const [dossierEmployeeId, setDossierEmployeeId] = useState<string | null>(null)
    const [payslipsCache, setPayslipsCache] = useState<SalaryRecord[]>([])
    const [dossierBenefits, setDossierBenefits] = useState<string[]>([])

    // Calculate balances from ledger
    const employeeBalances = useMemo(() => {
        const balances: Record<string, number> = {}
        const mileage: Record<string, number> = {}

        if (!verifications) return { balances, mileage }

        verifications.forEach(v => {
            const relevantRows = v.rows.filter(r => r.account === '2820' || r.account === '7330');

            if (relevantRows.length > 0) {
                const emp = employees.find(e => v.description.includes(e.name) || relevantRows.some(r => r.description.includes(e.name)))

                if (emp) {
                    relevantRows.forEach(r => {
                        if (r.account === '2820') {
                            balances[emp.id] = (balances[emp.id] || 0) + (r.credit - r.debit)
                        }
                        if (r.account === '7330' && r.debit > 0) {
                            mileage[emp.id] = (mileage[emp.id] || 0) + r.debit
                        }
                    })
                }
            }
        })
        return { balances, mileage }
    }, [verifications, employees])

    // Fetch payslips and benefits for dossier
    useEffect(() => {
        if (!dossierOpen || !dossierEmployeeId) return
        const emp = employees.find(e => e.id === dossierEmployeeId)

        fetch('/api/payroll/payslips')
            .then(res => res.json())
            .then(data => {
                if (data.payslips) {
                    const empSlips = data.payslips.filter((p: { employee_id?: string }) => p.employee_id === dossierEmployeeId)
                    setPayslipsCache(empSlips.map((p: { period: string; gross_salary: number; net_salary: number; tax_deduction: number; status: string }) => ({
                        period: p.period,
                        grossSalary: Number(p.gross_salary),
                        netSalary: Number(p.net_salary),
                        tax: Number(p.tax_deduction),
                        status: p.status
                    })))
                }
            })
            .catch(() => setPayslipsCache([]))

        // Fetch assigned benefits for this employee
        if (emp?.name) {
            const year = new Date().getFullYear()
            getEmployeeBenefits(emp.name, year)
                .then(benefits => {
                    setDossierBenefits(benefits.map(b => `${b.benefitType} — ${b.amount.toLocaleString('sv-SE')} kr`))
                })
                .catch(() => setDossierBenefits([]))
        } else {
            setDossierBenefits([])
        }
    }, [dossierOpen, dossierEmployeeId, employees])

    // Derive expense history from verifications for dossier employee
    const dossierExpenses = useMemo<ExpenseRecord[]>(() => {
        if (!dossierEmployeeId) return []
        const emp = employees.find(e => e.id === dossierEmployeeId)
        if (!emp) return []

        const records: ExpenseRecord[] = []
        verifications.forEach(v => {
            const isForEmployee = v.description.includes(emp.name) || v.rows.some(r => r.description.includes(emp.name))
            if (!isForEmployee) return

            const expenseRow = v.rows.find(r => r.account === '2820' && r.credit > 0)
            const mileageRow = v.rows.find(r => r.account === '7330' && r.debit > 0)

            if (expenseRow && !mileageRow) {
                records.push({ date: v.date, description: v.description, amount: expenseRow.credit, type: 'expense' })
            }
            if (mileageRow) {
                records.push({ date: v.date, description: v.description, amount: mileageRow.debit, type: 'mileage' })
            }
        })
        return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [dossierEmployeeId, verifications, employees])

    const handleOpenDossier = (empId: string) => {
        setDossierEmployeeId(empId)
        setDossierOpen(true)
    }

    return {
        employees,
        isLoading,
        employeeBalances,

        // Dossier
        dossierOpen, setDossierOpen,
        dossierEmployeeId,
        handleOpenDossier,
        payslipsCache,
        dossierExpenses,
        dossierBenefits,
    }
}
