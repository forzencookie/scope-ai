import { useState, useMemo, useEffect } from "react"
import { useCompany } from "@/providers/company-provider"
import { useToast } from "@/components/ui/toast"
import { useAllTaxRates } from "@/hooks/use-tax-parameters"
import { generateAgiXML } from "@/lib/generators/agi-generator"
import { format } from "date-fns"
import { sv } from "date-fns/locale"
import { BulkAction } from "@/components/shared/bulk-action-toolbar"
import { Trash2, Download } from "lucide-react"

export interface AGIReport {
    period: string
    dueDate: string
    status: "pending" | "submitted"
    employees: number
    totalSalary: number
    tax: number
    contributions: number
}

export function useEmployerDeclaration() {
    const { company } = useCompany()
    const toast = useToast()
    const { rates: taxRates } = useAllTaxRates(new Date().getFullYear())

    // State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [payslips, setPayslips] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Fetch real payslip data
    useEffect(() => {
        async function fetchPayslips() {
            setIsLoading(true)
            try {
                const res = await fetch('/api/payroll/payslips')
                const data = await res.json()
                setPayslips(data.payslips || [])
            } catch (err) {
                console.error('Failed to fetch payslips for AGI:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchPayslips()
    }, [])

    // 1. Generate AGI reports from real payslip data
    const agiReportsState = useMemo<AGIReport[]>(() => {
        const reportsMap = new Map<string, AGIReport & {
            employeeIds: Set<string>,
            employeeDataMap: Map<string, { name: string; personalNumber: string; grossSalary: number; taxDeduction: number }>
        }>()

        payslips.forEach(p => {
            const period: string = p.period // e.g. "2025-01"
            if (!period) return

            if (!reportsMap.has(period)) {
                // Parse "2025-01" -> Date for formatting
                const [year, month] = period.split('-').map(Number)
                const date = new Date(year, month - 1, 1)
                const periodName = format(date, "MMMM yyyy", { locale: sv })

                // Due date: 12th of next month
                const nextMonth = new Date(year, month, 12)
                const dueDate = format(nextMonth, "d MMM yyyy", { locale: sv })

                reportsMap.set(period, {
                    period: periodName.charAt(0).toUpperCase() + periodName.slice(1),
                    dueDate,
                    status: "pending",
                    employees: 0,
                    totalSalary: 0,
                    tax: 0,
                    contributions: 0,
                    employeeIds: new Set(),
                    employeeDataMap: new Map(),
                })
            }

            const report = reportsMap.get(period)!
            const gross = Number(p.gross_salary) || 0
            const tax = Number(p.tax_deduction) || 0

            report.totalSalary += gross
            report.tax += tax
            report.contributions += Math.round(gross * (taxRates?.employerContributionRate ?? 0))

            // Track unique employees and their data per period
            const empId = p.employee_id || p.id
            if (empId) {
                report.employeeIds.add(String(empId))
                const existing = report.employeeDataMap.get(String(empId))
                if (existing) {
                    existing.grossSalary += gross
                    existing.taxDeduction += tax
                } else {
                    report.employeeDataMap.set(String(empId), {
                        name: p.employee_name || '',
                        personalNumber: p.personal_number || '',
                        grossSalary: gross,
                        taxDeduction: tax,
                    })
                }
            }
        })

        return Array.from(reportsMap.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([, report]) => {
                const { employeeIds, employeeDataMap, ...rest } = report
                return {
                    ...rest,
                    employees: employeeIds.size || (rest.totalSalary > 0 ? 1 : 0),
                    // Store individual data for XML generation (not part of AGIReport type but accessible via cast)
                    individualData: Array.from(employeeDataMap.values()).map(emp => ({
                        personalNumber: emp.personalNumber,
                        name: emp.name,
                        grossSalary: emp.grossSalary,
                        taxDeduction: emp.taxDeduction,
                        employerContribution: Math.round(emp.grossSalary * (taxRates?.employerContributionRate ?? 0)),
                    })),
                }
            })
    }, [payslips, taxRates?.employerContributionRate])

    // 2. Stats derived from calculated reports
    const stats = useMemo(() => {
        const targetReport = agiReportsState[0]

        if (targetReport) {
            return {
                nextPeriod: targetReport.period,
                deadline: `Deadline: ${targetReport.dueDate}`,
                tax: targetReport.tax,
                contributions: targetReport.contributions,
                totalSalary: targetReport.totalSalary,
                employees: targetReport.employees
            }
        }

        return {
            nextPeriod: "Ingen data",
            deadline: "",
            tax: 0,
            contributions: 0,
            totalSalary: 0,
            employees: 0,
        }
    }, [agiReportsState])

    // 3. Filter reports
    const filteredReports = useMemo(() => {
        return agiReportsState.filter(report => {
            const matchesSearch = !searchQuery ||
                report.period.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = !statusFilter || report.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [searchQuery, statusFilter, agiReportsState])

    // 4. Selection Handlers
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === filteredReports.length && filteredReports.length > 0) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredReports.map(r => r.period)))
        }
    }

    const clearSelection = () => setSelectedIds(new Set())

    // 5. Bulk Actions
    const bulkActions: BulkAction[] = [
        {
            id: "delete",
            label: "Ta bort",
            icon: Trash2,
            variant: "destructive",
            onClick: () => {
                toast.error("Kan inte ta bort", "Dessa rapporter baseras på bokföringen.")
                clearSelection()
            },
        },
        {
            id: "download",
            label: "Ladda ner XML",
            icon: Download,
            onClick: (ids) => {
                const reports = agiReportsState.filter(r => ids.includes(r.period))

                reports.forEach(report => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const reportWithData = report as any
                    const xml = generateAgiXML({
                        period: report.period,
                        orgNumber: company?.orgNumber || "556000-0000",
                        totalSalary: report.totalSalary,
                        tax: report.tax,
                        contributions: report.contributions,
                        employees: report.employees,
                        individualData: reportWithData.individualData,
                    })

                    const blob = new Blob([xml], { type: "text/xml" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `agi-${report.period.replace(/\s+/g, '-').toLowerCase()}.xml`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                })

                toast.success("Nerladdat", `${ids.length} fil(er) har laddats ner.`)
                clearSelection()
            },
        },
    ]

    return {
        // State
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        selectedIds,
        isLoading,

        // Data
        agiReportsState,
        filteredReports,
        stats,

        // Selection Handlers
        toggleSelection,
        toggleAll,
        clearSelection,

        // Actions
        bulkActions
    }
}
