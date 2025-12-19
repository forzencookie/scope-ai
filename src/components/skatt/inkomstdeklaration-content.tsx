"use client"

import { useState, useMemo } from "react"
import {
    Calendar,
    TrendingUp,
    Clock,
    Bot,
    Download,
    Send,
    FileText,
    FileBarChart,
    Wallet,
    X,
    Eye,
} from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { IconButton } from "@/components/ui/icon-button"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterButton } from "@/components/ui/filter-button"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell
} from "@/components/ui/data-table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { SectionCard } from "@/components/ui/section-card"
import { InkomstWizardDialog } from "./ai-wizard-dialog"
import { Ink2PreviewDialog } from "./ink2-preview-dialog"
import { useVerifications } from "@/hooks/use-verifications"
import { Ink2Processor } from "@/lib/ink2-processor"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"

export function InkomstdeklarationContent() {
    const { addToast: toast } = useToast()
    const { verifications } = useVerifications()
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [fieldFilter, setFieldFilter] = useState<string[]>([])

    // Calculate real fields from ledger
    const fields = useMemo(() => {
        // Default to 2024 for this prototype
        return Ink2Processor.calculateInk2(verifications, 2024)
    }, [verifications])

    // Calculate stats from calculated fields
    const stats = useMemo(() => {
        const nettoOmsattning = fields.find(f => f.field === "1.1")?.value || 0
        const arsResultat = fields.find(f => f.field === "4.1")?.value || 0
        return {
            year: "2024",
            result: arsResultat,
            status: INVOICE_STATUS_LABELS.DRAFT,
        }
    }, [fields])

    // Filter fields based on search and category
    const filteredFields = useMemo(() => {
        let result = fields

        if (fieldFilter.length > 0) {
            result = result.filter(field => {
                const isIncome = field.field.startsWith("1.") || field.field === "3.1"
                const isExpense = field.field.startsWith("2.") || field.field === "3.3"
                const isResult = field.field.startsWith("4.") || field.label.toLowerCase().includes("resultat")

                if (fieldFilter.includes("income") && isIncome) return true
                if (fieldFilter.includes("expense") && isExpense) return true
                if (fieldFilter.includes("result") && isResult) return true
                return false
            })
        }

        return result
    }, [fieldFilter, fields])

    const toggleFilter = (value: string) => {
        setFieldFilter(prev => {
            if (prev.includes(value)) {
                return prev.filter(f => f !== value)
            }
            return [...prev, value]
        })
    }

    const handleSend = () => {
        toast({
            title: "Deklaration skickad",
            description: "Inkomstdeklaration 2 har skickats till Skatteverket.",
        })
    }

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
        if (selectedIds.size === filteredFields.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredFields.map(f => f.field)))
        }
    }

    return (
        <main className="flex-1 flex flex-col p-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label="Beskattningsår"
                        value="2024"
                        subtitle="Inkomstdeklaration 2"
                        icon={Calendar}
                    />
                    <StatCard
                        label="Bokfört resultat"
                        value={`${stats.result.toLocaleString('sv-SE')} kr`}
                        subtitle="Före skattemässiga justeringar"
                        icon={TrendingUp}
                    />
                    <StatCard
                        label="Status"
                        value={INVOICE_STATUS_LABELS.DRAFT}
                        subtitle="Deadline: 1 jul 2025"
                        icon={Clock}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title="AI-inkomstdeklaration"
                    description="INK2-fälten genereras automatiskt från bokföringen."
                    variant="ai"
                    onAction={() => setShowAIDialog(true)}
                />

                <InkomstWizardDialog
                    open={showAIDialog}
                    onOpenChange={setShowAIDialog}
                />

                <Ink2PreviewDialog
                    open={showPreview}
                    onOpenChange={setShowPreview}
                />

                <DataTable
                    title="INK2 – Fält"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <FilterButton
                                        label="Filtrera"
                                        isActive={fieldFilter.length > 0}
                                        activeCount={fieldFilter.length}
                                    />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Filtrera fält</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {/* Placeholder filters */}
                                    <DropdownMenuCheckboxItem
                                        checked={fieldFilter.includes("income")}
                                        onCheckedChange={() => toggleFilter("income")}
                                    >
                                        Intäkter
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={fieldFilter.includes("expense")}
                                        onCheckedChange={() => toggleFilter("expense")}
                                    >
                                        Kostnader
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={fieldFilter.includes("result")}
                                        onCheckedChange={() => toggleFilter("result")}
                                    >
                                        Resultat
                                    </DropdownMenuCheckboxItem>
                                    {fieldFilter.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setFieldFilter([])}>
                                                <X className="h-4 w-4 mr-2" />
                                                Rensa filter
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button size="sm" onClick={handleSend}>
                                <Send className="h-4 w-4 mr-1.5" />
                                Skicka till Skatteverket
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(true)}
                                className="mr-2"
                            >
                                <Eye className="h-4 w-4 mr-1.5" />
                                Förhandsgranska
                            </Button>
                            <Button size="sm" onClick={handleSend}>
                                <Send className="h-4 w-4 mr-1.5" />
                                Skicka till Skatteverket
                            </Button>
                        </div>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderCell className="w-10">
                            <Checkbox
                                checked={selectedIds.size === filteredFields.length && filteredFields.length > 0}
                                onCheckedChange={toggleAll}
                            />
                        </DataTableHeaderCell>
                        <DataTableHeaderCell label="Fält" icon={FileText} width="96px" />
                        <DataTableHeaderCell label="Beskrivning" icon={FileBarChart} />
                        <DataTableHeaderCell label="Belopp" icon={Wallet} align="right" />
                    </DataTableHeader>
                    <DataTableBody>
                        {filteredFields.map((item) => (
                            <DataTableRow
                                key={item.field}
                                selected={selectedIds.has(item.field)}
                            >
                                <DataTableCell className="w-10">
                                    <Checkbox
                                        checked={selectedIds.has(item.field)}
                                        onCheckedChange={() => toggleSelection(item.field)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </DataTableCell>
                                <DataTableCell mono muted>{item.field}</DataTableCell>
                                <DataTableCell>{item.label}</DataTableCell>
                                <DataTableCell align="right" bold className={item.value < 0 ? 'text-red-600 dark:text-red-500/70' : ''}>
                                    {item.value.toLocaleString('sv-SE')} kr
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </div>
        </main>
    )
}
