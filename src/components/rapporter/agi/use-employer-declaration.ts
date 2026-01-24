import { useState, useMemo } from "react"
import { useCompany } from "@/providers/company-provider"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { generateAgiXML } from "@/lib/agi-generator"
import { parseISO, format, getYear, getMonth } from "date-fns"
import { sv } from "date-fns/locale"
import { BulkAction } from "@/components/shared/bulk-action-toolbar"
import { Trash2, Send, Download } from "lucide-react"

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
    const { verifications } = useVerifications()
    const toast = useToast()

    // State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // 1. Generate AGI reports from verifications
    const agiReportsState = useMemo<AGIReport[]>(() => {
        const reportsMap = new Map<string, AGIReport>()

        verifications.forEach(v => {
            const date = parseISO(v.date)
            const period = format(date, "MMMM yyyy", { locale: sv })
            const periodKey = format(date, "yyyy-MM")

            if (!reportsMap.has(periodKey)) {
                // Calculate due date (12th of next month)
                const nextMonth = new Date(getYear(date), getMonth(date) + 1, 12)
                const dueDate = format(nextMonth, "d MMM yyyy", { locale: sv })

                reportsMap.set(periodKey, {
                    period: period.charAt(0).toUpperCase() + period.slice(1),
                    dueDate,
                    status: "pending",
                    employees: 0,
                    totalSalary: 0,
                    tax: 0,
                    contributions: 0
                })
            }

            const report = reportsMap.get(periodKey)!

            v.rows.forEach(row => {
                const acc = parseInt(row.account)
                if (acc >= 7000 && acc <= 7399) {
                    report.totalSalary += row.debit
                    if (row.debit > 0) report.employees += 1
                }
                if (acc === 2710) {
                    report.tax += row.credit
                }
                if (acc >= 2730 && acc <= 2739) {
                    report.contributions += row.credit
                }
            })
        })

        return Array.from(reportsMap.entries())
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([_, report]) => {
                // Ensure at least 1 employee if salary exists
                if (report.employees === 0 && report.totalSalary > 0) report.employees = 1
                return report
            })
    }, [verifications])

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
            id: "send",
            label: "Skicka till Skatteverket",
            icon: Send,
            onClick: async () => {
                toast.info("Kommer snart", "Inlämning direkt till Skatteverket via API är under utveckling.")
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
                    const xml = generateAgiXML({
                        period: report.period,
                        orgNumber: company?.orgNumber || "556000-0000",
                        totalSalary: report.totalSalary,
                        tax: report.tax,
                        contributions: report.contributions,
                        employees: report.employees
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
