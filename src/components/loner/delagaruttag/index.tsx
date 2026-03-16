"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Filter, Info, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { LegalInfoCard } from "@/components/ui/legal-info-card"
import { PageHeader } from "@/components/shared"
import { useToast } from "@/components/ui/toast"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"
import { WithdrawalStats } from "./withdrawal-stats"
import { WithdrawalsGrid } from "./withdrawals-grid"
import { useOwnerWithdrawals } from "./use-owner-withdrawals"
import { usePartners } from "@/hooks/use-partners"
import { useCompany } from "@/providers/company-provider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DelagaruttagManager() {
    const {
        withdrawals,
        overallStats,
        isLoading,
    } = useOwnerWithdrawals()
    
    const { partners } = usePartners()
    const { company } = useCompany()
    const toast = useToast()

    // Guard: this page is for HB/KB only
    if (company?.companyType === 'ab') {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Delägare & Uttag"
                    subtitle="Denna sida är för handels- och kommanditbolag."
                />
                <div className="rounded-lg border bg-muted/40 p-6 text-center">
                    <Info className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                        Delägaruttag hanteras inte här för aktiebolag. Använd istället <strong>Lönekörning</strong> för lön eller <strong>Utdelning</strong> under Ägare.
                    </p>
                </div>
            </div>
        )
    }

    const [searchQuery, setSearchQuery] = useState("")
    const [partnerFilter, setPartnerFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<string | null>(null)

    const filteredWithdrawals = useMemo(() => {
        return withdrawals.filter(w => {
            const matchesSearch = 
                w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                w.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
            
            const matchesPartner = partnerFilter ? w.partnerId === partnerFilter : true
            const matchesType = typeFilter ? w.type === typeFilter : true

            return matchesSearch && matchesPartner && matchesType
        }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [withdrawals, searchQuery, partnerFilter, typeFilter])

    return (
        <div className="space-y-6">
            <PageHeader
                title="Delägare & Uttag"
                subtitle="Hantera delägaruttag, insättningar och lån i bolaget."
                actions={
                    <Button variant="outline" size="sm" onClick={async () => {
                        toast.info("Laddar ner", "Förbereder PDF...")
                        try {
                            await downloadElementAsPDF({ fileName: `delagaruttag-${new Date().toISOString().slice(0,10)}`, elementId: 'delagaruttag-content' })
                            toast.success("Klart", "PDF har laddats ner.")
                        } catch {
                            toast.error("Fel", "Kunde inte skapa PDF.")
                        }
                    }}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                    </Button>
                }
            />

            <div id="delagaruttag-content" className="space-y-6">
            <WithdrawalStats
                stats={overallStats}
                isLoading={isLoading}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <main className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <SearchBar 
                            placeholder="Sök transaktioner..." 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="bg-background"
                        />
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filtrera
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => { setPartnerFilter(null); setTypeFilter(null); }}>
                                        Visa alla
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {partners.map(p => (
                                        <DropdownMenuItem key={p.id} onClick={() => setPartnerFilter(p.id)}>
                                            {p.name}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    {['uttag', 'insättning', 'lön'].map(t => (
                                        <DropdownMenuItem key={t} onClick={() => setTypeFilter(t)} className="capitalize">
                                            {t}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <WithdrawalsGrid withdrawals={filteredWithdrawals} />
                </main>

                <div className="space-y-6">
                    <LegalInfoCard
                        title="Regler för uttag (HB/KB)"
                        items={[
                            { content: "Varje delägare har ett eget kapitalkonto. Uttag minskar kapitalkontot, insättningar ökar det." },
                            { content: "Enligt Handelsbolagslagen (1980:1102) svarar komplementärer solidariskt för bolagets förpliktelser." },
                            { content: "Delägares andel av vinsten beskattas som inkomst av näringsverksamhet — oavsett om uttag görs." },
                        ]}
                    />
                     <div className="rounded-lg border bg-muted/40 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                           <Info className="h-4 w-4" />
                           <h4 className="text-sm font-medium">Bokföringstips</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            När du registrerar ett uttag här skapas en väntande bokning.
                            Uttag bokförs mot konto 2072/2075 och insättningar mot 2073/2076.
                        </p>
                    </div>
                </div>
            </div>
            </div>

        </div>
    )
}
