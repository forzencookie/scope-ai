"use client"

import { useState } from "react"
import {
    Plus,
    Download,
    ArrowRightLeft,
    Users,
    History as HistoryIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { PageHeader } from "@/components/shared"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTextMode } from "@/providers/text-mode-provider"

// Sub-components
import { AktiebokStats } from "./components/aktiebok-stats"
import { useAktiebokLogic } from "./use-aktiebok-logic"
import { StockTransactionType } from "./types"
import { AktiebokPreviewDialog } from "../dialogs/aktiebok-preview"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { useChatNavigation } from "@/hooks/use-chat-navigation"

export function Aktiebok() {
    const { navigateToAI } = useChatNavigation()
    const [showExportDialog, setShowExportDialog] = useState(false)
    const {
        stats,
        filteredShareholders,
        shareholders,
        filteredTransactions,
        searchQuery, setSearchQuery,
    } = useAktiebokLogic()

    return (
        <div className="space-y-8">
            <PageHeader
                title="Aktiebok & Styrning"
                subtitle="Ägarstruktur, rösträttsfördelning och firmateckningsrätt."
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                            <Download className="h-4 w-4 mr-2" />
                            Exportera
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">Ny åtgärd</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigateToAI({ prompt: "Jag vill göra en nyemission" })}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nyemission
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigateToAI({ prompt: "Jag vill registrera en aktieöverlåtelse" })}>
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Registrera överlåtelse
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigateToAI({ prompt: "Jag vill ändra styrelsen" })}>
                                    <Users className="h-4 w-4 mr-2" />
                                    Ändra styrelse
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            <AktiebokStats stats={stats} shareholders={shareholders} />

            {/* Top Section: Shareholder Registry (Cards) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Aktieägare & Roller
                    </h3>
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder="Sök ägare..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            className="h-8 w-48"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredShareholders.map((s) => (
                        <Card key={s.id} className="group hover:border-primary/50 transition-colors overflow-hidden">
                            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0">
                                        <CardTitle className="text-sm font-bold truncate leading-none mb-1">
                                            {s.name}
                                        </CardTitle>
                                        <CardDescription className="text-[10px] font-mono uppercase tracking-tighter">
                                            {s.personalNumber}
                                        </CardDescription>
                                    </div>
                                </div>
                                {/* Firmatecknare Badge (Based on ownership > 40%) */}
                                {s.ownershipPercentage > 40 && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 shrink-0">
                                        <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                                        Tecknar firman
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Ägande</p>
                                        <p className="text-lg font-bold tabular-nums">
                                            {s.ownershipPercentage}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {s.shares.toLocaleString('sv-SE')} aktier
                                        </p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Rösträtt</p>
                                        <p className="text-lg font-bold tabular-nums">
                                            {s.votesPercentage}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {s.shareClass}-aktier
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                                    <span className="text-[11px] text-muted-foreground">
                                        Ägare sedan {s.acquisitionDate}
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">
                                        Detaljer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Bottom Section: Corporate Event Timeline */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Händelsehistorik
                    </h3>
                </div>

                <Card className="bg-muted/20 border-dashed">
                    <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-4">
                        <HistoryIcon className="h-8 w-8 text-muted-foreground/50" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Händelsehistoriken hanteras av Scooby</p>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                Fråga Scooby för att se detaljerad historik över nyemissioner och aktieöverlåtelser.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigateToAI({ prompt: "Visa min händelsehistorik för aktieboken" })}>
                            Visa historik i chatten
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AktiebokPreviewDialog
                open={showExportDialog}
                onOpenChange={setShowExportDialog}
                shareholders={shareholders}
                stats={stats}
            />
        </div>
    )
}
