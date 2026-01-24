// @ts-nocheck
"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    const showKommanditdelägare = companyType === 'kb' || companyType === 'kommanditbolag' 
    
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
            // @ts-ignore
            currentCapitalBalance: Number(partnerData.capitalContribution),
            isLimitedLiability: partnerData.type === 'kommanditdelägare',
            type: partnerData.type || 'komplementär'
        } as Partner)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 pt-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Delägare</h2>
                        <p className="text-muted-foreground mt-1">
                            {companyType === 'hb' ? 'Handelsbolag' : 'Kommanditbolag'}
                        </p>
                    </div>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Lägg till delägare
                    </Button>
                </div>
            </div>

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
