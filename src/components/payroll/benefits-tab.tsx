"use client"

import { useState, useEffect } from "react"
import { Gift, Heart, Car, Check, ArrowRight, Plus } from "lucide-react"
import { StatusBadge } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { DataTable, DataTableHeader, DataTableHeaderCell, DataTableBody, DataTableRow, DataTableCell } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/utils"
import type { FormanCatalogItem, EmployeeBenefit } from "@/lib/ai-tool-types"
import {
    listAvailableBenefits,
    assignBenefit,
    suggestUnusedBenefits
} from "@/lib/formaner"
import { BenefitDetailsDialog, getBenefitIcon } from "./benefit-details-dialog"

const MAX_VISIBLE_BENEFITS = 5

export function BenefitsTab() {
    const [benefits, setBenefits] = useState<FormanCatalogItem[]>([])
    const [assignedBenefits, setAssignedBenefits] = useState<EmployeeBenefit[]>([])
    const [suggestions, setSuggestions] = useState<FormanCatalogItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showAllBenefits, setShowAllBenefits] = useState(false)

    // Selection & Dialog State
    const [selectedBenefit, setSelectedBenefit] = useState<FormanCatalogItem | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

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

    const visibleBenefits = showAllBenefits
        ? benefits
        : benefits.slice(0, MAX_VISIBLE_BENEFITS)
    const hiddenCount = benefits.length - MAX_VISIBLE_BENEFITS

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
                <StatCard label="Skattefria" value={taxFreeCount} icon={Heart} />
                <StatCard label="Skattepliktiga" value={taxableCount} icon={Car} />
                <StatCard label="Aktiva" value={activeCount} icon={Check} />
                <StatCard label="Förslag" value={suggestions.length} icon={Gift} />
            </StatCardGrid>

            {/* Main Content Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Tillgängliga Förmåner</h3>
                </div>

                <DataTable title="Förmåner">
                    <DataTableHeader>
                        <DataTableHeaderCell label="Förmån" />
                        <DataTableHeaderCell label="Kategori" />
                        <DataTableHeaderCell label="Maxbelopp" align="right" />
                        <DataTableHeaderCell label="Skattefritt" />
                        <DataTableHeaderCell label="" align="right" />
                    </DataTableHeader>
                    <DataTableBody>
                        {isLoading ? (
                            <DataTableRow><DataTableCell colSpan={5}>Laddar...</DataTableCell></DataTableRow>
                        ) : (
                            visibleBenefits.map((benefit) => {
                                const Icon = getBenefitIcon(benefit.id)
                                return (
                                    <DataTableRow
                                        key={benefit.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(benefit)}
                                    >
                                        <DataTableCell>
                                            <div>
                                                <div className="font-medium">{benefit.name}</div>
                                                <div className="text-xs text-muted-foreground line-clamp-1">{benefit.description}</div>
                                            </div>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <StatusBadge
                                                status={benefit.category === 'tax_free' ? 'Skattefri' :
                                                    benefit.category === 'taxable' ? 'Skattepliktig' : 'Löneväxling'}
                                                variant={benefit.category === 'tax_free' ? 'success' :
                                                    benefit.category === 'taxable' ? 'warning' : 'info'}
                                            />
                                        </DataTableCell>
                                        <DataTableCell align="right">
                                            {benefit.maxAmount ? formatCurrency(benefit.maxAmount) : '—'}
                                        </DataTableCell>
                                        <DataTableCell>
                                            {benefit.taxFree ? (
                                                <span className="inline-flex items-center text-xs text-green-600 font-medium bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                                                    <Check className="w-3 h-3 mr-1" /> Ja
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Nej</span>
                                            )}
                                        </DataTableCell>
                                        <DataTableCell align="right">
                                            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                                        </DataTableCell>
                                    </DataTableRow>
                                )
                            })
                        )}
                    </DataTableBody>
                </DataTable>

                {/* Show more / Show less button */}
                {benefits.length > MAX_VISIBLE_BENEFITS && (
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setShowAllBenefits(!showAllBenefits)}
                    >
                        {showAllBenefits ? (
                            <>Visa färre</>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Visa {hiddenCount} till
                            </>
                        )}
                    </Button>
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

