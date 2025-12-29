"use client"

import { useState, useMemo } from "react"
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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { useToast } from "@/components/ui/toast"
import { BulkActionToolbar, type BulkAction } from "../shared/bulk-action-toolbar"


import { termExplanations } from "./constants"
import { agiReports as initialAgiReports } from "@/components/payroll/constants"
import { submitToSkatteverket, type SkatteverketResponse } from "@/services/myndigheter-client"

type AGIReport = typeof initialAgiReports[0]

import { useVerifications } from "@/hooks/use-verifications"
import { getMonth, getYear, parseISO, format } from "date-fns"
import { sv } from "date-fns/locale"
import { generateAgiXML } from "@/lib/agi-generator"

import { useCompany } from "@/providers/company-provider"

export function AGIContent() {
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

    const [showAIDialog, setShowAIDialog] = useState(false)
    const [step, setStep] = useState(1)
    const [isSending, setIsSending] = useState(false)
    const [chatInput, setChatInput] = useState("")
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai", text: string }>>([])
    const [useAIRecommendation, setUseAIRecommendation] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
        <div className="px-6 pt-2 pb-6">
            <div className="max-w-6xl w-full space-y-6 min-w-0">
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
                    onAction={() => setShowAIDialog(true)}
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
                                                <p className="font-medium">{stats.nextPeriod}</p>
                                                <p className="text-sm text-muted-foreground">Arbetsgivardeklaration</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Deadline</p>
                                                <p className="font-medium">{stats.deadline.replace("Deadline: ", "")}</p>
                                            </div>
                                        </div>
                                    </button>
                                    <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
                                        <p>📊 Baserat på lönedata:</p>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex justify-between">
                                                <span>Antal anställda</span>
                                                <span className="font-medium text-foreground">{stats.employees} st</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Total bruttolön</span>
                                                <span className="font-medium text-foreground">{formatCurrency(stats.totalSalary)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Skatteavdrag</span>
                                                <span className="font-medium text-foreground">{formatCurrency(stats.tax)}</span>
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
                                                <p className="font-medium">AGI {stats.nextPeriod}</p>
                                                <p className="text-sm text-muted-foreground">{stats.employees} anställda</p>
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
                                                <span>{formatCurrency(stats.totalSalary)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Skatteavdrag</span>
                                                <span className="text-red-600 dark:text-red-500/70">{formatCurrency(stats.tax)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Arbetsgivaravgifter (31,42%)</span>
                                                <span className="text-red-600 dark:text-red-500/70">{formatCurrency(stats.contributions)}</span>
                                            </div>
                                        </div>

                                        <div className="border-t pt-3">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-medium">Total att betala</span>
                                                <span className="text-2xl font-bold">{formatCurrency(stats.tax + stats.contributions)}</span>
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



                <DataTable
                    title="Arbetsgivardeklarationer (AGI)"
                    headerActions={
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
                            <Button size="sm" onClick={() => setShowAIDialog(true)}>
                                <Plus className="h-4 w-4 mr-1.5" />
                                Ny AGI
                            </Button>
                        </div>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderCell className="w-10">
                            <Checkbox
                                checked={selectedIds.size === filteredReports.length && filteredReports.length > 0}
                                onCheckedChange={toggleAll}
                            />
                        </DataTableHeaderCell>
                        <DataTableHeaderCell label="Period" icon={Calendar} />
                        <DataTableHeaderCell label="Deadline" icon={Clock} />
                        <DataTableHeaderCell label="Anställda" icon={Users} />
                        <DataTableHeaderCell label="Bruttolön" icon={Banknote} />
                        <DataTableHeaderCell label="Skatteavdrag" icon={Wallet} />
                        <DataTableHeaderCell label="Arbetsgivaravgifter" icon={Calculator} />
                        <DataTableHeaderCell label="Status" icon={CheckCircle2} />

                    </DataTableHeader>
                    <DataTableBody>
                        {filteredReports.map((report) => (
                            <DataTableRow
                                key={report.period}
                                selected={selectedIds.has(report.period)}
                            >
                                <DataTableCell className="w-10">
                                    <Checkbox
                                        checked={selectedIds.has(report.period)}
                                        onCheckedChange={() => toggleSelection(report.period)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </DataTableCell>
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

                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>

                <BulkActionToolbar
                    selectedCount={selectedIds.size}
                    selectedIds={Array.from(selectedIds)}
                    onClearSelection={() => setSelectedIds(new Set())}
                    actions={bulkActions}
                />
            </div>
        </div>
    )
}
