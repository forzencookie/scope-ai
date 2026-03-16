"use client"

import { useState } from "react"
import { PageHeader } from "@/components/shared"
import { PartnersStats } from "./partners-stats"
import { PartnersGrid } from "./partners-grid"
import { RecentWithdrawalsGrid } from "./recent-withdrawals-grid"
import { usePartnerManagement } from "./use-partner-management"
import { LegalInfoCard, legalInfoContent } from '@/components/ui/legal-info-card'

export function Delagare() {
    const { partners, stats, companyType } = usePartnerManagement()
    const [partnerSearch, setPartnerSearch] = useState("")

    // Derived state
    const showKommanditdelägare = companyType === 'kb'

    // Filter logic
    const filteredPartners = partners.filter(partner =>
        partner.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
        partner.personalNumber?.includes(partnerSearch)
    )

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Delägare"
                subtitle={companyType === 'hb' ? 'Handelsbolag' : 'Kommanditbolag'}
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

        </div>
    )
}
