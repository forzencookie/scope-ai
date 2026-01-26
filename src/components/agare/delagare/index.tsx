"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"
import { PartnersStats } from "./partners-stats"
import { PartnersGrid } from "./partners-grid"
import { RecentWithdrawalsGrid } from "./recent-withdrawals-grid"
import { AddPartnerDialog } from "./add-partner-dialog"
import { usePartnerManagement } from "./use-partner-management"
import { LegalInfoCard, legalInfoContent } from '@/components/ui/legal-info-card'
import { Partner } from "@/data/ownership"

export function Delagare() {
    const { partners, stats, addPartner, companyType } = usePartnerManagement()
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [partnerSearch, setPartnerSearch] = useState("")

    // Derived state
    const showKommanditdelägare = companyType === 'kb'

    // Filter logic
    const filteredPartners = partners.filter(partner =>
        partner.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        partner.personalNumber?.includes(partnerSearch)
    )

    const handleAddPartner = async (partnerData: Partial<Partner>) => {
        if (!partnerData.name) return

        await addPartner({
            ...partnerData,
            ownershipPercentage: Number(partnerData.ownershipPercentage),
            profitSharePercentage: Number(partnerData.ownershipPercentage),
            capitalContribution: Number(partnerData.capitalContribution),
            id: crypto.randomUUID(),
            joinDate: new Date().toISOString().split('T')[0],
            currentCapitalBalance: Number(partnerData.capitalContribution),
            isLimitedLiability: partnerData.type === 'kommanditdelägare',
            type: partnerData.type || 'komplementär'
        } as Partner)
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Delägare"
                subtitle={companyType === 'hb' ? 'Handelsbolag' : 'Kommanditbolag'}
                actions={
                    <Button size="sm" onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Lägg till delägare</span>
                        <span className="sm:hidden">Lägg till</span>
                    </Button>
                }
            />

            <PartnersStats
                stats={stats}
                enrichedPartners={partners}
                totalWithdrawals={stats.totalWithdrawals}
            />

            <div className="border-b-2 border-border/60" />

            <PartnersGrid
                partners={filteredPartners}
                showKommanditdelägare={showKommanditdelägare}
                onSearchChange={setPartnerSearch}
                searchValue={partnerSearch}
            />

            <RecentWithdrawalsGrid />

            <LegalInfoCard
                items={companyType === 'hb' ? legalInfoContent.hb : legalInfoContent.kb}
            />

            <AddPartnerDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                companyType={companyType}
                onSave={handleAddPartner}
            />
        </div>
    )
}
