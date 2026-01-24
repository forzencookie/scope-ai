// @ts-nocheck
"use client"

import {
  Plus,
  Download,
  ArrowRightLeft,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
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
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Aktiebok</h2>
                        <p className="text-muted-foreground mt-1">
                            Digital aktiebok med historik över ägarförändringar och transaktioner.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Åtgärder
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setTxType('Nyemission'); setShowAddDialog(true); }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nyemission
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
                </div>
            </div>

            <AktiebokStats stats={stats} shareholders={shareholders} />

            {/* Shareholders Table */}
            {activeTab === 'owners' && (
                <div className="space-y-4 pt-8 border-t-2 border-border/60">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">{text.owners?.shareholdersTable || "Aktieägare"}</h2>
                        <div className="flex items-center gap-2">
                            <SearchBar
                                placeholder={text.owners?.searchOwners || "Sök ägare..."}
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => setActiveTab('transactions')}
                            >
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Transaktioner
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
                        <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">{text.owners?.transactionsTable || "Historik"}</h2>
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

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" className="h-8">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Åtgärder
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setTxType('Nyemission'); setShowAddDialog(true); }}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nyemission
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <Download className="h-4 w-4 mr-2" />
                                        Exportera transaktioner
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <TransactionsGrid
                        transactions={filteredTransactions}
                        getTransactionTypeLabel={(type: string) => 
                            type === 'nyemission' ? 'Nyemission' : 
                            type === 'köp' ? 'Köp' : 
                            type.charAt(0).toUpperCase() + type.slice(1)
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
            />
        </div>
    )
}
