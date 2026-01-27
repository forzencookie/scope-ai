"use client"

import { Plus, Banknote, Check, Gift, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SearchBar } from "@/components/ui/search-bar"
import { DataErrorState, StatCardSkeleton } from "@/components/ui/data-error-state"
import { ErrorBoundary, PageHeader, SectionErrorBoundary } from "@/components/shared"

import { useBenefitsLogic } from "./use-benefits-logic"
import { BenefitSection } from "./benefit-section"
import { BenefitDetailsDialog } from "../dialogs/forman"

export function BenefitsTab() {
    const {
        isLoading,
        error,
        stats,
        coveragePercent,
        searchQuery,
        setSearchQuery,
        groupedBenefits,
        assignedBenefits,
        selectedBenefit,
        isDetailsOpen,
        setIsDetailsOpen,
        handleRowClick,
        handleAssign,
        handleRetry
    } = useBenefitsLogic()

    // Show error state if fetch failed
    if (error && !isLoading) {
        return (
            <div className="space-y-6 px-6 pb-6 max-w-6xl">
                <PageHeader
                    title="Förmåner"
                    subtitle="Hantera personalförmåner och skattefria avdrag."
                />
                <DataErrorState
                    message={error}
                    onRetry={handleRetry}
                />
            </div>
        )
    }

    return (
        <SectionErrorBoundary sectionName="Förmåner">
            <div className="space-y-6 px-6 pb-6 max-w-6xl">
                {/* Header */}
                <PageHeader
                    title="Förmåner"
                    subtitle="Hantera personalförmåner och skattefria avdrag."
                    actions={
                        <Button onClick={() => document.getElementById('benefits-search')?.focus()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Registrera förmån
                        </Button>
                    }
                />

                {/* KPI Cards */}
                {isLoading ? (
                    <StatCardGrid columns={3}>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </StatCardGrid>
                ) : (
                    <StatCardGrid columns={3}>
                        <StatCard
                            label="Totalt"
                            value={`${stats.totalCost.toLocaleString('sv-SE')} kr`}
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
                            value={`${stats.unusedPotential.toLocaleString('sv-SE')} kr`}
                            subtitle="kvar att nyttja"
                            headerIcon={Gift}
                        />
                    </StatCardGrid>
                )}

                {/* Separator */}
                <div className="border-b-2 border-border/60" />

                {/* Suggestion Banner */}
                {!isLoading && (stats.totalEmployees - stats.employeesWithBenefits) > 0 && (
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/60">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-500/10">
                                <Gift className="h-4 w-4 text-amber-600" />
                            </div>
                            <span className="text-sm">
                                <strong>{stats.totalEmployees - stats.employeesWithBenefits} anställda</strong> har outnyttjat friskvård
                            </span>
                        </div>
                        <Button variant="outline" size="sm">
                            Visa <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                )}

                {!isLoading && (
                    <>
                         {/* Separator */}
                        <div className="border-b-2 border-border/60" />

                        {/* Collapsible Benefits Sections */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h2 className="font-medium">Tillgängliga Förmåner</h2>
                                <SearchBar
                                    placeholder="Sök förmåner..."
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                />
                            </div>


                            <div className="space-y-2">
                                {/* Skattefria Förmåner */}
                                <BenefitSection
                                    title="Skattefria Förmåner"
                                    benefits={groupedBenefits.taxFree}
                                    assignedBenefits={assignedBenefits}
                                    totalEmployees={stats.totalEmployees}
                                    defaultOpen={true}
                                    onRowClick={handleRowClick}
                                />

                                {/* Skattepliktiga Förmåner */}
                                <BenefitSection
                                    title="Skattepliktiga Förmåner"
                                    benefits={groupedBenefits.taxable}
                                    assignedBenefits={assignedBenefits}
                                    totalEmployees={stats.totalEmployees}
                                    defaultOpen={false}
                                    onRowClick={handleRowClick}
                                />

                                {/* Löneväxling */}
                                <BenefitSection
                                    title="Löneväxling"
                                    benefits={groupedBenefits.salarySacrifice}
                                    assignedBenefits={assignedBenefits}
                                    totalEmployees={stats.totalEmployees}
                                    defaultOpen={false}
                                    onRowClick={handleRowClick}
                                />
                            </div>
                        </div>
                    </>
                )}

                <BenefitDetailsDialog
                    benefit={selectedBenefit}
                    open={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    onAssign={handleAssign}
                    assignedEmployees={assignedBenefits}
                />
            </div>
        </SectionErrorBoundary>
    )
}
