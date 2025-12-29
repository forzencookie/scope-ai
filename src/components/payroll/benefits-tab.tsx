"use client"

import { useState, useEffect } from "react"
import { Gift, Heart, Car, Check, ArrowRight, Plus, Search, SlidersHorizontal, Tag, Banknote, ShieldCheck, MoreHorizontal } from "lucide-react"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
    DataTableAddRow
} from "@/components/ui/data-table"
import { SearchBar } from "@/components/ui/search-bar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { cn, formatCurrency } from "@/lib/utils"
import type { FormanCatalogItem, EmployeeBenefit } from "@/lib/ai-tool-types"
import {
    listAvailableBenefits,
    assignBenefit,
    suggestUnusedBenefits
} from "@/lib/formaner"
import { BENEFIT_STATUS_LABELS } from "@/lib/localization"
import { BenefitDetailsDialog, getBenefitIcon } from "./benefit-details-dialog"
import { useTextMode } from "@/providers/text-mode-provider"

const MAX_VISIBLE_BENEFITS = 5

export function BenefitsTab() {
    const [benefits, setBenefits] = useState<FormanCatalogItem[]>([])
    const [assignedBenefits, setAssignedBenefits] = useState<EmployeeBenefit[]>([])
    const [suggestions, setSuggestions] = useState<FormanCatalogItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAllBenefits, setShowAllBenefits] = useState(false)
    const [selectedBenefit, setSelectedBenefit] = useState<FormanCatalogItem | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const { text } = useTextMode()

    const currentYear = new Date().getFullYear()

    // Load Data
    useEffect(() => {
        async function load() {
            setIsLoading(true)
            const [allBenefits, unusedSuggestions] = await Promise.all([
                listAvailableBenefits('AB'),
                suggestUnusedBenefits('Demo Anställd', currentYear, 'AB')
            ])
            setBenefits(allBenefits)
            setSuggestions(unusedSuggestions)
            setIsLoading(false)
        }
        load()
    }, [currentYear])

    // Stats
    const taxFreeCount = benefits.filter(b => b.category === 'tax_free').length
    const taxableCount = benefits.filter(b => b.category === 'taxable').length
    const activeCount = assignedBenefits.length

    const handleRowClick = (benefit: FormanCatalogItem) => {
        setSelectedBenefit(benefit)
        setIsDetailsOpen(true)
    }

    const handleAssign = async (employeeName: string, amount: number) => {
        if (!selectedBenefit) return

        const assigned = await assignBenefit({
            employeeName,
            benefitType: selectedBenefit.id,
            amount,
            year: currentYear,
        })

        if (assigned) {
            setAssignedBenefits(prev => [assigned, ...prev])
        }
    }

    // Filter & Search Logic
    const filteredBenefits = benefits.filter(benefit => {
        const matchesSearch = benefit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (benefit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        const matchesStatus = statusFilter.length === 0 || statusFilter.includes(benefit.category)
        return matchesSearch && matchesStatus
    })

    const visibleBenefits = showAllBenefits
        ? filteredBenefits
        : filteredBenefits.slice(0, MAX_VISIBLE_BENEFITS)
    const hiddenCount = filteredBenefits.length - MAX_VISIBLE_BENEFITS

    const categories = Array.from(new Set(benefits.map(b => b.category)))

    return (
        <div className="space-y-6 px-6 pb-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Förmåner</h2>
                    <p className="text-muted-foreground">
                        Hantera personalförmåner och skattefria avdrag.
                    </p>
                </div>
            </div>

            {/* KPI Cards */}
            <StatCardGrid columns={4}>
                <StatCard label={BENEFIT_STATUS_LABELS.TAX_FREE} value={taxFreeCount} icon={Heart} />
                <StatCard label={BENEFIT_STATUS_LABELS.TAXABLE} value={taxableCount} icon={Car} />
                <StatCard label="Aktiva" value={activeCount} icon={Check} />
                <StatCard label="Förslag" value={suggestions.length} icon={Gift} />
            </StatCardGrid>

            {/* Main Content Table */}
            <div className="space-y-4">
                <DataTable
                    title="Tillgängliga Förmåner"
                    headerActions={
                        <div className="flex items-center gap-2">
                            <SearchBar
                                placeholder="Sök förmåner..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn("h-9 gap-1", statusFilter.length > 0 && "border-primary text-primary")}
                                    >
                                        <SlidersHorizontal className="h-3.5 w-3.5" />
                                        Filter
                                        {statusFilter.length > 0 && (
                                            <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">
                                                {statusFilter.length}
                                            </span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Filtrera på kategori</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {categories.map((cat) => (
                                        <DropdownMenuCheckboxItem
                                            key={cat}
                                            checked={statusFilter.includes(cat)}
                                            onCheckedChange={(checked) => {
                                                if (checked) setStatusFilter(prev => [...prev, cat])
                                                else setStatusFilter(prev => prev.filter(s => s !== cat))
                                            }}
                                        >
                                            {cat === 'tax_free' ? 'Skattefri' : cat === 'taxable' ? 'Skattepliktig' : 'Löneväxling'}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                    {statusFilter.length > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setStatusFilter([])}>
                                                Snabbrensa filter
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    }
                >
                    <DataTableHeader>
                        <DataTableHeaderCell icon={Gift} label="Förmån" />
                        <DataTableHeaderCell icon={Tag} label="Kategori" />
                        <DataTableHeaderCell icon={Banknote} label="Maxbelopp" align="right" />
                        <DataTableHeaderCell icon={ShieldCheck} label="Skattefritt" />
                        <DataTableHeaderCell label="" align="right" />
                    </DataTableHeader>
                    <DataTableBody>
                        {isLoading ? (
                            <DataTableRow><DataTableCell colSpan={5}>Laddar...</DataTableCell></DataTableRow>
                        ) : (
                            visibleBenefits.map((benefit) => {
                                return (
                                    <DataTableRow
                                        key={benefit.id}
                                        className="group cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(benefit)}
                                    >
                                        <DataTableCell bold>
                                            <div className="flex flex-col">
                                                <span>{benefit.name}</span>
                                                <span className="text-xs text-muted-foreground font-normal line-clamp-1">
                                                    {benefit.description}
                                                </span>
                                            </div>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <AppStatusBadge
                                                status={benefit.category === 'tax_free' ? BENEFIT_STATUS_LABELS.TAX_FREE :
                                                    benefit.category === 'taxable' ? BENEFIT_STATUS_LABELS.TAXABLE : BENEFIT_STATUS_LABELS.DEDUCTION}
                                                size="sm"
                                            />
                                        </DataTableCell>
                                        <DataTableCell align="right" muted>
                                            {benefit.maxAmount ? formatCurrency(benefit.maxAmount) : '—'}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {benefit.taxFree ? (
                                                <span className="inline-flex items-center text-xs text-green-600 font-medium">
                                                    <Check className="w-3 h-3 mr-1" /> Ja
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Nej</span>
                                            )}
                                        </DataTableCell>
                                        <DataTableCell align="right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleRowClick(benefit)}>
                                                        Visa detaljer
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleRowClick(benefit)}>
                                                        Tilldela anställd
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </DataTableCell>
                                    </DataTableRow>
                                )
                            })
                        )}
                        {visibleBenefits.length === 0 && !isLoading && (
                            <DataTableRow>
                                <DataTableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Inga förmåner matchar din sökning.
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </DataTableBody>
                </DataTable>

                {/* Show more / Show less button */}
                {filteredBenefits.length > MAX_VISIBLE_BENEFITS && (
                    <DataTableAddRow
                        label={showAllBenefits ? "Visa färre" : `Visa ${hiddenCount} till`}
                        onClick={() => setShowAllBenefits(!showAllBenefits)}
                    />
                )}
            </div>

            {/* Dialog - Now using extracted component */}
            <BenefitDetailsDialog
                benefit={selectedBenefit}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onAssign={handleAssign}
                assignedEmployees={assignedBenefits}
            />
        </div>
    )
}

