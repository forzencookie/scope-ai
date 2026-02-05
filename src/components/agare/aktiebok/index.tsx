"use client"

import {
    Plus,
    Download,
    ArrowRightLeft,
    Users
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
import { ShareholdersGrid } from "./components/ShareholdersGrid"
import { TransactionsGrid } from "./components/TransactionsGrid"
import { TransactionDialog } from "./components/TransactionDialog"
import { useAktiebokLogic } from "./use-aktiebok-logic"
import { StockTransactionType } from "./types"

export function Aktiebok() {
    const { text } = useTextMode()
    const {
        stats,
        filteredShareholders,
        shareholders,
        filteredTransactions,
        searchQuery, setSearchQuery,
        showAddDialog, setShowAddDialog,
        activeTab, setActiveTab,
        isSubmitting,

        txType, setTxType,
        txDate, setTxDate,
        txShares, setTxShares,
        txPrice, setTxPrice,
        txTo, setTxTo,
        txFrom, setTxFrom,
        txShareClass, setTxShareClass,

        handleSaveTransaction
    } = useAktiebokLogic()

    return (
        <div className="space-y-4 md:space-y-6">
            <PageHeader
                title="Aktiebok"
                subtitle="Digital aktiebok med historik över ägarförändringar och transaktioner."
                actions={
                    <div className="hidden md:block">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">Åtgärder</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setTxType('Nyemission'); setShowAddDialog(true); }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Lägg till aktieägare
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setTxType('Köp'); setShowAddDialog(true); }}>
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Registrera överlåtelse
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <Download className="h-4 w-4 mr-2" />
                                    Exportera aktiebok
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            {/* Mobile-only primary action button */}
            <div className="md:hidden w-full">
                <Button
                    className="w-full"
                    size="lg"
                    onClick={() => { setTxType('Nyemission'); setShowAddDialog(true); }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Lägg till aktieägare
                </Button>
            </div>

            <AktiebokStats stats={stats} shareholders={shareholders} />

            {/* Shareholders Table */}
            {activeTab === 'owners' && (
                <div className="space-y-4 pt-6 md:pt-8 border-t-2 border-border/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                        <h2 className="text-sm md:text-base font-semibold text-muted-foreground">{text.owners?.shareholdersTable || "Aktieägare"}</h2>
                        <div className="flex items-center gap-2">
                            <SearchBar
                                placeholder={text.owners?.searchOwners || "Sök ägare..."}
                                value={searchQuery}
                                onChange={setSearchQuery}
                                className="flex-1 sm:flex-none"
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 shrink-0"
                                onClick={() => setActiveTab('transactions')}
                            >
                                <ArrowRightLeft className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Transaktioner</span>
                            </Button>
                        </div>
                    </div>

                    <ShareholdersGrid shareholders={filteredShareholders} />
                </div>
            )}

            {/* Transactions Table */}
            {activeTab === 'transactions' && (
                <div className="space-y-4 pt-8 border-t-2 border-border/60">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-base font-semibold text-muted-foreground">Transaktioner</h2>
                        <div className="flex items-center gap-2">
                            <SearchBar
                                placeholder={text.owners?.searchTransactions || "Sök..."}
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => setActiveTab('owners')}
                            >
                                <Users className="h-4 w-4 mr-2" />
                                Aktieägare
                            </Button>
                        </div>
                    </div>

                    <TransactionsGrid
                        transactions={filteredTransactions}
                        getTransactionTypeLabel={(type: string) =>
                            (type === 'nyemission' ? 'Nyemission' :
                                type === 'köp' ? 'Köp' :
                                    type.charAt(0).toUpperCase() + type.slice(1)) as StockTransactionType
                        }
                    />
                </div>
            )}

            <TransactionDialog
                open={showAddDialog}
                onOpenChange={setShowAddDialog}
                txType={txType}
                setTxType={setTxType}
                txDate={txDate}
                setTxDate={setTxDate}
                txFrom={txFrom}
                setTxFrom={setTxFrom}
                txTo={txTo}
                setTxTo={setTxTo}
                txShares={txShares}
                setTxShares={setTxShares}
                txShareClass={txShareClass}
                setTxShareClass={setTxShareClass}
                txPrice={txPrice}
                setTxPrice={setTxPrice}
                shareholders={shareholders}
                onSave={handleSaveTransaction}
                isSubmitting={isSubmitting}
            />
        </div>
    )
}
