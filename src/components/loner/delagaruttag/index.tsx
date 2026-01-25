"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Plus, Filter, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { LegalInfoCard } from "@/components/ui/legal-info-card"
import { WithdrawalStats } from "./withdrawal-stats"
import { WithdrawalsGrid } from "./withdrawals-grid"
import { NewWithdrawalDialog } from "./new-withdrawal-dialog"
import { useOwnerWithdrawals } from "./use-owner-withdrawals"
import { usePartners } from "@/hooks/use-partners"
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
    } = useOwnerWithdrawals()
    
    const { partners } = usePartners()

    const [searchQuery, setSearchQuery] = useState("")
    const [partnerFilter, setPartnerFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<string | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)

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
            <WithdrawalStats 
                stats={overallStats} 
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
                            <Button size="sm" onClick={() => setShowAddDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Ny transaktion
                            </Button>
                        </div>
                    </div>

                    <WithdrawalsGrid withdrawals={filteredWithdrawals} />
                </main>

                <div className="space-y-6">
                    <LegalInfoCard
                        title="Regler för uttag"
                        // description="Viktiga regler för vinstutdelning och lån"
                        items={[
                            { content: "Ett förbjudet lån är om bolaget lånar ut pengar till en delägare eller närstående." },
                            { content: "Utdelning får endast ske efter beslut på bolagsstämma och baseras på fritt eget kapital." },
                            { content: "Håll koll på skattekontot. Otillåtna lån beskattas som tjänst." },
                        ]}
                    />
                     <div className="rounded-lg border bg-muted/40 p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                           <Info className="h-4 w-4" />
                           <h4 className="text-sm font-medium">Bokföringstips</h4>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            När du registrerar ett uttag här skapas automatiskt en verifikation i bokföringen.
                            Uttag bokförs mot konto 2013/2023 och insättningar mot 2018/2028.
                        </p>
                    </div>
                </div>
            </div>

            <NewWithdrawalDialog 
                open={showAddDialog} 
                onOpenChange={setShowAddDialog}
                partners={partners}
                onSave={async (data) => {
                    console.log('Save transaction:', data)
                    // TODO: Implement save logic using db.addTransaction or similar
                    return Promise.resolve()
                }}
            />
        </div>
    )
}
