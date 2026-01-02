"use client"

import { useState, useEffect } from "react"
import { Gift, Check, ArrowRight, Banknote, Plus } from "lucide-react"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SearchBar } from "@/components/ui/search-bar"

import { formatCurrency } from "@/lib/utils"
import type { FormanCatalogItem, EmployeeBenefit } from "@/lib/ai-tool-types"
import {
    listAvailableBenefits,
    assignBenefit,
    suggestUnusedBenefits
} from "@/lib/formaner"
import { BENEFIT_STATUS_LABELS } from "@/lib/localization"
import { BenefitDetailsDialog, getBenefitIcon } from "./benefit-details-dialog"
import { useTextMode } from "@/providers/text-mode-provider"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_VISIBLE_BENEFITS = 5

// Custom BenefitRow with usage indicator
function BenefitRow({
    name,
    description,
    maxAmount,
    usageCount,
    totalEmployees,
    onClick
}: {
    name: string
    description?: string
    maxAmount?: number
    usageCount: number
    totalEmployees: number
    onClick?: () => void
}) {
    const usagePercent = totalEmployees > 0 ? Math.round((usageCount / totalEmployees) * 100) : 0

    return (
        <div
            className="flex items-center justify-between py-3 px-2 -mx-2 rounded-md hover:bg-muted/30 transition-colors cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-3.5" /> {/* Spacer for alignment */}
                <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{name}</span>
                    {description && (
                        <p className="text-xs text-muted-foreground truncate">{description}</p>
                    )}
                </div>
            </div>

            {/* Usage indicator */}
            <div className="flex items-center gap-4 shrink-0">
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all",
                                usagePercent === 100 ? "bg-green-500" :
                                    usagePercent > 50 ? "bg-amber-500" : "bg-muted-foreground/40"
                            )}
                            style={{ width: `${usagePercent}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-10">
                        {usageCount}/{totalEmployees}
                    </span>
                </div>

                {/* Max amount */}
                {maxAmount && maxAmount > 0 && (
                    <span className="text-sm tabular-nums text-muted-foreground w-24 text-right">
                        {maxAmount.toLocaleString('sv-SE')} kr/år
                    </span>
                )}
            </div>
        </div>
    )
}

// Custom section with BenefitRows
function BenefitSection({
    title,
    benefits,
    assignedBenefits,
    totalEmployees,
    defaultOpen = true,
    onRowClick
}: {
    title: string
    benefits: FormanCatalogItem[]
    assignedBenefits: EmployeeBenefit[]
    totalEmployees: number
    defaultOpen?: boolean
    onRowClick: (benefit: FormanCatalogItem) => void
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    // Calculate total max amount for section badge
    const sectionTotal = benefits.reduce((sum, b) => sum + (b.maxAmount || 0), 0)

    if (benefits.length === 0) return null

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 py-2 hover:bg-muted/30 rounded-sm px-2 -mx-2 transition-colors group w-full text-left"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                )}
                <span className="font-medium text-sm group-hover:text-foreground transition-colors text-muted-foreground">
                    {title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {benefits.length} st
                </span>
            </button>

            {isOpen && (
                <div className="space-y-0.5 pl-2">
                    {benefits.map((benefit) => {
                        const usageCount = assignedBenefits.filter(ab => ab.benefitType === benefit.id).length
                        return (
                            <BenefitRow
                                key={benefit.id}
                                name={benefit.name}
                                description={benefit.description}
                                maxAmount={benefit.maxAmount}
                                usageCount={usageCount}
                                totalEmployees={totalEmployees}
                                onClick={() => onRowClick(benefit)}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

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

    // Stats - new actionable metrics
    const totalCost = assignedBenefits.reduce((sum, b) => sum + b.amount, 0)

    // Calculate unique employees with benefits
    const employeesWithBenefits = new Set(assignedBenefits.map(b => b.employeeName)).size
    // TODO: Get total employee count from API - using 10 as placeholder
    const totalEmployees = 10
    const coveragePercent = totalEmployees > 0 ? Math.round((employeesWithBenefits / totalEmployees) * 100) : 0

    // Calculate unused potential (friskvård max * employees without it)
    const friskvardMax = 5000
    const employeesWithFriskvard = assignedBenefits.filter(b => b.benefitType === 'friskvard').length
    const unusedPotential = (totalEmployees - employeesWithFriskvard) * friskvardMax

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

    // Group benefits by category for collapsible sections
    const taxFreeBenefits = filteredBenefits.filter(b => b.category === 'tax_free')
    const taxableBenefits = filteredBenefits.filter(b => b.category === 'taxable')
    const salarySacrificeBenefits = filteredBenefits.filter(b => b.category === 'salary_sacrifice')

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
                <div className="flex items-center gap-2">
                    <Button onClick={() => document.getElementById('benefits-search')?.focus()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Registrera förmån
                    </Button>
                </div>
            </div>

            {/* KPI Cards - 3 new actionable metrics */}
            <StatCardGrid columns={3}>
                <StatCard
                    label="Totalt"
                    value={`${totalCost.toLocaleString('sv-SE')} kr`}
                    subtitle="kostnad i år"
                    headerIcon={Banknote}
                />
                <StatCard
                    label="Täckning"
                    value={`${coveragePercent}%`}
                    subtitle="av anställda"
                    headerIcon={Check}
                />
                <StatCard
                    label="Outnyttjat"
                    value={`${unusedPotential.toLocaleString('sv-SE')} kr`}
                    subtitle="kvar att nyttja"
                    headerIcon={Gift}
                />
            </StatCardGrid>

            {/* Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Suggestion Banner - simple logic, no AI */}
            {(totalEmployees - employeesWithFriskvard) > 0 && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/60">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-500/10">
                            <Gift className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="text-sm">
                            <strong>{totalEmployees - employeesWithFriskvard} anställda</strong> har outnyttjat friskvård
                        </span>
                    </div>
                    <Button variant="outline" size="sm">
                        Visa <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            )}

            {/* Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Collapsible Benefits Sections */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="font-medium">Tillgängliga Förmåner</h2>
                    <SearchBar
                        id="benefits-search"
                        placeholder="Sök förmåner..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                </div>


                <div className="space-y-2">
                    {/* Skattefria Förmåner */}
                    <BenefitSection
                        title="Skattefria Förmåner"
                        benefits={taxFreeBenefits}
                        assignedBenefits={assignedBenefits}
                        totalEmployees={totalEmployees}
                        defaultOpen={true}
                        onRowClick={handleRowClick}
                    />

                    {/* Skattepliktiga Förmåner */}
                    <BenefitSection
                        title="Skattepliktiga Förmåner"
                        benefits={taxableBenefits}
                        assignedBenefits={assignedBenefits}
                        totalEmployees={totalEmployees}
                        defaultOpen={false}
                        onRowClick={handleRowClick}
                    />

                    {/* Löneväxling */}
                    <BenefitSection
                        title="Löneväxling"
                        benefits={salarySacrificeBenefits}
                        assignedBenefits={assignedBenefits}
                        totalEmployees={totalEmployees}
                        defaultOpen={false}
                        onRowClick={handleRowClick}
                    />
                </div>
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

