"use client"

import * as React from "react"
import { useState, useMemo, memo } from "react"
import {
  Plus,
  Download,
  ArrowRightLeft,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatCardSkeleton } from "@/components/ui/data-error-state"
import { StatCardGrid } from "@/components/ui/stat-card"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { useTextMode } from "@/providers/text-mode-provider"
import { useCompliance } from "@/hooks/use-compliance"
import { StockTransactionType } from "./aktiebok/types"

// Sub-components
import { OwnershipOverview } from "./aktiebok/components/OwnershipOverview"
import { ShareholdersGrid } from "./aktiebok/components/ShareholdersGrid"
import { TransactionsGrid } from "./aktiebok/components/TransactionsGrid"
import { TransactionDialog } from "./aktiebok/components/TransactionDialog"

export const Aktiebok = memo(function Aktiebok() {
  const { addVerification } = useVerifications()
  const toast = useToast()
  const { text } = useTextMode()
  const { shareholders: realShareholders, isLoadingShareholders, updateShareholder, addShareholder } = useCompliance()
  const { verifications } = useVerifications()

  // Local state
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'owners' | 'transactions'>('owners')

  // Form State
  const [txType, setTxType] = useState<StockTransactionType>('Nyemission')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txShares, setTxShares] = useState("")
  const [txPrice, setTxPrice] = useState("")
  const [txTo, setTxTo] = useState("")
  const [txFrom, setTxFrom] = useState("")
  const [txShareClass, setTxShareClass] = useState<'A' | 'B'>('B')

  // Derived stats
  const stats = useMemo(() => {
    const s = realShareholders || []
    return {
      totalShares: s.reduce((sum, sh) => sum + (sh.shares_count || 0), 0),
      totalVotes: s.reduce((sum, sh) => sum + ((sh.shares_count || 0) * (sh.share_class === 'A' ? 10 : 1)), 0),
      shareholderCount: s.length,
      totalValue: 0
    }
  }, [realShareholders])

  // Map real shareholders to component format
  const shareholders = useMemo(() => {
    const total = stats.totalShares || 1

    return (realShareholders || []).map(s => ({
      id: s.id,
      name: s.name,
      personalNumber: s.ssn_org_nr,
      type: 'person' as const, // Default for now
      shares: s.shares_count,
      shareClass: (s.share_class || 'B') as 'A' | 'B',
      ownershipPercentage: Math.round((s.shares_count / total) * 100),
      acquisitionDate: '2024-01-01', // Placeholder
      acquisitionPrice: 0,
      votes: s.shares_count * (s.share_class === 'A' ? 10 : 1),
      votesPercentage: 0 // Simplified
    }))
  }, [realShareholders, stats.totalShares])

  // Derive transactions
  const transactions = useMemo(() => {
    return verifications
      .filter(v => v.sourceType === 'equity_issue' || v.description.toLowerCase().includes('nyemission'))
      .map(v => {
        const amountRow = v.rows.find(r => r.account === '1930')
        const total = amountRow ? amountRow.debit : 0
        const match = v.description.match(/(\d+) aktier/)
        const shares = match ? parseInt(match[1]) : 0
        const price = shares > 0 ? total / shares : 0
        const nameMatch = v.description.match(/till (.+)$/)
        const toName = nameMatch ? nameMatch[1] : "Okänd"

        return {
          id: String(v.id),
          date: v.date,
          type: 'Nyemission',
          fromShareholder: 'Bolaget',
          toShareholder: toName,
          shares: shares,
          shareClass: 'B',
          pricePerShare: price,
          totalPrice: total
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [verifications])


  const filteredShareholders = useMemo(() => {
    if (!searchQuery) return shareholders
    const query = searchQuery.toLowerCase()
    return shareholders.filter(s =>
      s.name.toLowerCase().includes(query)
    )
  }, [shareholders, searchQuery])

  const filteredTransactions = useMemo(() => {
    let result = transactions
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(tx =>
        tx.toShareholder.toLowerCase().includes(query) ||
        tx.fromShareholder?.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query)
      )
    }
    return result
  }, [transactions, searchQuery])

  const handleSaveTransaction = async () => {
    if (!txTo || !txShares || !txPrice) {
      toast.error("Uppgifter saknas", "Fyll i alla obligatoriska fält.")
      return
    }

    const shares = parseInt(txShares)
    const price = parseFloat(txPrice)
    const total = shares * price

    try {
      const shareholder = realShareholders.find(s => s.name === txTo)
      if (shareholder) {
        await updateShareholder({
          id: shareholder.id,
          shares_count: shareholder.shares_count + shares
        })
      } else if (txType === 'Nyemission') {
        await addShareholder({
          name: txTo,
          shares_count: shares,
          shares_percentage: 0,
          share_class: txShareClass
        })
      }

      if (txType === 'Nyemission') {
        await addVerification({
          date: txDate,
          description: `Nyemission ${shares} aktier till ${txTo}`,
          sourceType: 'equity_issue',
          rows: [
            { account: "1930", description: `Inbetalning nyemission ${txTo}`, debit: total, credit: 0 },
            { account: "2081", description: `Aktiekapital`, debit: 0, credit: total }
          ]
        })
      }

      toast.success("Transaktion registrerad", "Ägarförhållandena har uppdaterats.")
      setShowAddDialog(false)
      setTxTo("")
      setTxFrom("")
      setTxShares("")
      setTxPrice("")
    } catch (error) {
      console.error("Nyemission error:", error)
      toast.error("Fel vid registrering", "Kunde inte spara transaktionen. Försök igen.")
    }
  }

  if (isLoadingShareholders) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-24 bg-muted animate-pulse" />
          ))}
        </div>
        <div className="border-b-2 border-border/60" />
        <Card className="h-96 bg-muted animate-pulse" />
      </div>
    )
  }

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

      <OwnershipOverview stats={stats} shareholders={shareholders} />

      {/* Shareholders Table */}
      {activeTab === 'owners' && (
        <div className="space-y-4 pt-8 border-t-2 border-border/60">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">{text.owners.shareholdersTable}</h2>
            <div className="flex items-center gap-2">
              <SearchBar
                placeholder={text.owners.searchOwners}
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
                {text.owners.transactions}
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
            <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">{text.owners.transactionsTable}</h2>
            <div className="flex items-center gap-2">
              <SearchBar
                placeholder={text.owners.searchTransactions}
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
            getTransactionTypeLabel={(type) => type === 'nyemission' ? 'Nyemission' : type === 'köp' ? 'Köp' : type as any}
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
})

Aktiebok.displayName = 'Aktiebok'
