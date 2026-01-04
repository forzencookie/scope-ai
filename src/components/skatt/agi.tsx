"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
    Calculator,
    Plus,
    Trash2,
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { buildAIChatUrl, getDefaultAIContext } from "@/lib/ai-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { IconButton, IconButtonGroup } from "@/components/ui/icon-button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, type BulkAction } from "../shared/bulk-action-toolbar"


import { termExplanations } from "./constants"
import { agiReports as initialAgiReports } from "@/components/loner/constants"
import { submitToSkatteverket, type SkatteverketResponse } from "@/services/myndigheter-client"

type AGIReport = typeof initialAgiReports[0]

import { useVerifications } from "@/hooks/use-verifications"
import { getMonth, getYear, parseISO, format } from "date-fns"
import { sv } from "date-fns/locale"
import { generateAgiXML } from "@/lib/agi-generator"

import { useCompany } from "@/providers/company-provider"

export function AGIContent() {
    const router = useRouter()
    const toast = useToast()
    const { verifications } = useVerifications()
    const { company } = useCompany()

    // Generate AGI reports from verifications
    const agiReportsState = useMemo(() => {
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
                if (report.employees === 0 && report.totalSalary > 0) report.employees = 1
                return report
            })
    }, [verifications])

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSending, setIsSending] = useState(false)

    // Toggle selection for a single row
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

    // Toggle all rows
    const toggleAll = () => {
        if (selectedIds.size === filteredReports.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredReports.map(r => r.period)))
        }
    }

    // Send AGI report to Skatteverket API
    const sendToSkatteverket = async (report: AGIReport) => {
        const result = await submitToSkatteverket('agi', {
            period: report.period,
            employees: report.employees,
            totalSalary: report.totalSalary,
            tax: report.tax,
            contributions: report.contributions,
        })
        return result
    }

    // Bulk actions
    const bulkActions: BulkAction[] = [
        {
            id: "delete",
            label: "Ta bort",
            icon: Trash2,
            variant: "destructive",
            onClick: (ids) => {
                // Cannot delete real ledger derived reports easily without deleting verifications
                toast.error("Kan inte ta bort", "Dessa rapporter baseras på bokföringen.")
                setSelectedIds(new Set())
            },
        },
        {
            id: "send",
            label: "Skicka till Skatteverket",
            icon: Send,
            onClick: async (ids) => {
                setIsSending(true)
                const reportsToSend = agiReportsState.filter(r => ids.includes(r.period))

                let successCount = 0
                let errorCount = 0
                let lastError = ''

                for (const report of reportsToSend) {
                    const result = await sendToSkatteverket(report)
                    if (result.success) {
                        successCount++
                        // Update status in local state (would need to persist sending status somewhere)
                        // For now just toast
                    } else {
                        errorCount++
                        lastError = result.aiReview?.errors?.[0]?.message || result.message
                    }
                }

                setIsSending(false)
                setSelectedIds(new Set())

                if (successCount > 0 && errorCount === 0) {
                    toast.success(
                        "Rapporter skickade",
                        `${successCount} AGI-rapport(er) skickades till Skatteverket. Se resultat i simulatorn.`
                    )
                } else if (successCount > 0 && errorCount > 0) {
                    toast.warning(
                        "Delvis skickat",
                        `${successCount} skickade, ${errorCount} med fel: ${lastError}`
                    )
                } else {
                    toast.error(
                        "Kunde inte skicka",
                        lastError || "Kontrollera dokumenten och försök igen"
                    )
                }
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
                setSelectedIds(new Set())
            },
        },
    ]

    // Calculate stats from agiReports data
    const stats = useMemo(() => {
        // Find the first pending report (next AGI to submit)
        const pendingReport = agiReportsState.find(r => r.status === "pending")

        if (pendingReport) {
            return {
                nextPeriod: pendingReport.period,
                deadline: `Deadline: ${pendingReport.dueDate}`,
                tax: pendingReport.tax,
                contributions: pendingReport.contributions,
                totalSalary: pendingReport.totalSalary,
                employees: pendingReport.employees,
            }
        }

        // Fallback to first report if none pending
        const firstReport = agiReportsState[0]
        return {
            nextPeriod: firstReport?.period || "Ingen period",
            deadline: firstReport?.dueDate ? `Deadline: ${firstReport.dueDate}` : "",
            tax: firstReport?.tax || 0,
            contributions: firstReport?.contributions || 0,
            totalSalary: firstReport?.totalSalary || 0,
            employees: firstReport?.employees || 0,
        }
    }, [agiReportsState])
    // Filter reports based on search and status
    const filteredReports = useMemo(() => {
        return agiReportsState.filter(report => {
            const matchesSearch = !searchQuery ||
                report.period.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = !statusFilter || report.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [searchQuery, statusFilter, agiReportsState])


    return (
        <main className="flex-1 flex flex-col p-6">
            {/* Page Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Arbetsgivardeklaration (AGI)</h2>
                        <p className="text-muted-foreground mt-1">
                            Hantera månatliga deklarationer för anställda och skatter.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => router.push(buildAIChatUrl(getDefaultAIContext('agi')))}>
                            <Plus className="h-4 w-4 mr-2" />
                            Ny AGI
                        </Button>
                    </div>
                </div>

                <StatCardGrid columns={3}>
                    <StatCard
                        label="Nästa AGI"
                        value={stats.nextPeriod}
                        subtitle={stats.deadline}
                        headerIcon={Calendar}
                        tooltip={termExplanations["AGI"]}
                    />
                    <StatCard
                        label="Skatteavdrag"
                        value={formatCurrency(stats.tax)}
                        subtitle="Preliminärskatt"
                        headerIcon={Wallet}
                        tooltip={termExplanations["Preliminärskatt"]}
                    />
                    <StatCard
                        label="Arbetsgivaravgifter"
                        value={formatCurrency(stats.contributions)}
                        subtitle={`31,42% av ${formatCurrency(stats.totalSalary)}`}
                        headerIcon={Calculator}
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
                    onAction={() => router.push(buildAIChatUrl(getDefaultAIContext('agi')))}
                />

                {/* Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Table Actions Toolbar */}
                <div className="flex items-center justify-between py-2 mb-2">
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Alla deklarationer</h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Sök period..."
                            className="w-48"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <FilterButton
                                    label="Status"
                                    isActive={!!statusFilter}
                                />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                                    Alla
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                                    <Clock className="h-4 w-4 mr-2" />
                                    Väntar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("submitted")}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Inskickad
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* GridTable Header */}
                <GridTableHeader
                    columns={[
                        { label: "Period", icon: Calendar, span: 2 },
                        { label: "Deadline", icon: Clock, span: 2 },
                        { label: "Anställda", icon: Users, span: 1 },
                        { label: "Bruttolön", icon: Banknote, span: 2, align: "right" },
                        { label: "Skatteavdrag", icon: Wallet, span: 2, align: "right" },
                        { label: "Avgifter", icon: Calculator, span: 2, align: "right" },
                    ]}
                    trailing={
                        <Checkbox
                            checked={selectedIds.size === filteredReports.length && filteredReports.length > 0}
                            onCheckedChange={toggleAll}
                        />
                    }
                />

                {/* GridTable Rows */}
                <GridTableRows>
                    {filteredReports.map((report) => (
                        <GridTableRow
                            key={report.period}
                            selected={selectedIds.has(report.period)}
                        >
                            <div style={{ gridColumn: 'span 2' }} className="font-medium">
                                {report.period}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground">
                                {report.dueDate}
                            </div>
                            <div style={{ gridColumn: 'span 1' }} className="tabular-nums">
                                {report.employees}
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums">
                                {report.totalSalary.toLocaleString("sv-SE")} kr
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums">
                                {report.tax.toLocaleString("sv-SE")} kr
                            </div>
                            <div style={{ gridColumn: 'span 2' }} className="text-right tabular-nums">
                                {report.contributions.toLocaleString("sv-SE")} kr
                            </div>
                            <div
                                style={{ gridColumn: 'span 1' }}
                                className="flex justify-end"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Checkbox
                                    checked={selectedIds.has(report.period)}
                                    onCheckedChange={() => toggleSelection(report.period)}
                                />
                            </div>
                        </GridTableRow>
                    ))}
                </GridTableRows>

                <BulkActionToolbar
                    selectedCount={selectedIds.size}
                    selectedIds={Array.from(selectedIds)}
                    onClearSelection={() => setSelectedIds(new Set())}
                    actions={bulkActions}
                />
            </div>
        </main>
    )
}
