"use client"

import { useState, useMemo } from "react"
import { useToast } from "@/components/ui/toast"
import { useEmployees } from "@/hooks/use-employees"
import { useVerifications } from "@/hooks/use-verifications"

export function useTeamLogic() {
    const toast = useToast()
    const { verifications, addVerification } = useVerifications()
    const { employees, isLoading, refresh, addEmployee } = useEmployees()

    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
    const [reportType, setReportType] = useState<'time' | 'expense' | 'mileage'>('time')

    // Form state
    const [amount, setAmount] = useState("")
    const [km, setKm] = useState("")
    const [desc, setDesc] = useState("")
    const [hours, setHours] = useState("")

    // New Employee State
    const [newEmployeeDialogOpen, setNewEmployeeDialogOpen] = useState(false)
    const [newEmployee, setNewEmployee] = useState({ name: '', role: '', email: '', salary: '' })
    const [isSaving, setIsSaving] = useState(false)

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

    const handleAddEmployee = async () => {
        if (!newEmployee.name || !newEmployee.role) {
            toast.error("Saknas uppgifter", "Namn och roll krävs")
            return
        }

        setIsSaving(true)
        try {
            await addEmployee({
                name: newEmployee.name,
                role: newEmployee.role,
                email: newEmployee.email || undefined,
                salary: parseFloat(newEmployee.salary) || 0
            })
            toast.success("Anställd tillagd", `${newEmployee.name} har lagts till i teamet.`)
            setNewEmployeeDialogOpen(false)
            setNewEmployee({ name: '', role: '', email: '', salary: '' })
        } catch (error) {
            toast.error("Ett fel uppstod", "Kunde inte spara anställd.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleReport = async () => {
        const emp = employees.find(e => e.id === selectedEmployee)
        if (!emp) return

        if (reportType === 'expense') {
            const val = parseFloat(amount)
            if (!val) return

            await addVerification({
                date: new Date().toISOString().split('T')[0],
                description: `Utlägg ${emp.name} - ${desc}`,
                sourceType: 'manual', 
                rows: [
                    { account: "4000", description: desc || "Utlägg", debit: val, credit: 0 },
                    { account: "2820", description: `Skuld till ${emp.name}`, debit: 0, credit: val }
                ]
            })
            toast.success("Utlägg sparat", `Bokfört ${val} kr på 4000/2820`)
        } else if (reportType === 'mileage') {
            const dist = parseFloat(km)
            if (!dist) return
            const krVal = dist * 2.5 // 25 kr/mil => 2.5 kr/km

            await addVerification({
                date: new Date().toISOString().split('T')[0],
                description: `Milersättning ${emp.name} - ${desc}`,
                sourceType: 'manual',
                rows: [
                    { account: "7330", description: `${dist} km bilersättning`, debit: krVal, credit: 0 },
                    { account: "2820", description: `Skuld till ${emp.name}`, debit: 0, credit: krVal }
                ]
            })
            toast.success("Resa sparad", `Bokfört ${krVal} kr (${dist} km)`)
        } else {
            toast.info("Tidrapport sparad", "Tid har registrerats (Bokförs vid lönekörning)")
        }

        setReportDialogOpen(false)
        setAmount("")
        setKm("")
        setDesc("")
    }

    return {
        // State
        employees,
        isLoading,
        employeeBalances,
        
        reportDialogOpen, setReportDialogOpen,
        selectedEmployee, setSelectedEmployee,
        reportType, setReportType,
        
        amount, setAmount,
        km, setKm,
        desc, setDesc,
        hours, setHours,
        
        newEmployeeDialogOpen, setNewEmployeeDialogOpen,
        newEmployee, setNewEmployee,
        isSaving,

        // Handlers
        handleAddEmployee,
        handleReport
    }
}
