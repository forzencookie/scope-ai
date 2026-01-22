"use client"

import * as React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  Users,
  Calendar,
  Percent,
  TrendingUp,
  Plus,
  MoreHorizontal,
  FileText,
  Download,
  ArrowRightLeft,
  Building2,
  User,
  Vote,
  Hash,
  Banknote,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SearchBar } from "@/components/ui/search-bar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import {

  GridTableHeader,
  GridTableRow,
  GridTableRows
} from "@/components/ui/grid-table"

import { cn } from "@/lib/utils"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { type StockTransactionType } from "@/lib/status-types"
import {
  mockShareholders,
  mockShareTransactions,
  type Shareholder,
  type ShareTransaction
} from "@/data/ownership"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { DataErrorState, StatCardSkeleton } from "@/components/ui/data-error-state"
import { SectionErrorBoundary } from "@/components/shared/error-boundary"

import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { useTextMode } from "@/providers/text-mode-provider"
import { useCompliance } from "@/hooks/use-compliance"

export function Aktiebok() {
  const { addVerification } = useVerifications()
  const toast = useToast()
  const { text } = useTextMode()
  const { shareholders: realShareholders, isLoadingShareholders, updateShareholder, addShareholder } = useCompliance()

  // Local state for filtering/interaction
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'owners' | 'transactions'>('owners')
  const [selectedShareholders, setSelectedShareholders] = useState<Set<string>>(new Set())
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())

  // Form State
  const [txType, setTxType] = useState<StockTransactionType>('Nyemission')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txShares, setTxShares] = useState("")
  const [txPrice, setTxPrice] = useState("")
  const [txTo, setTxTo] = useState("")
  const [txFrom, setTxFrom] = useState("")
  const [txShareClass, setTxShareClass] = useState<'A' | 'B'>('B')

  const { verifications } = useVerifications()

  // Removed RPC stats fetching. 
  // Derive stats from realShareholders directly.
  const stats = useMemo(() => {
    const s = realShareholders || []
    return {
      totalShares: s.reduce((sum, sh) => sum + (sh.shares_count || 0), 0),
      totalVotes: s.reduce((sum, sh) => sum + ((sh.shares_count || 0) * (sh.share_class === 'A' ? 10 : 1)), 0),
      shareholderCount: s.length,
      totalValue: 0 // Not tracked yet
    }
  }, [realShareholders])

  // Map real shareholders to component format
  const shareholders = useMemo(() => {
    // Recalculate percentages based on live total
    const total = stats.totalShares || 1

    return (realShareholders || []).map(s => ({
      id: s.id,
      name: s.name,
      personalNumber: s.ssn_org_nr,
      type: 'person' as const, // Default for now
      shares: s.shares_count,
      shareClass: s.share_class || 'B',
      ownershipPercentage: Math.round((s.shares_count / total) * 100),
      acquisitionDate: '2024-01-01', // Placeholder
      acquisitionPrice: 0,
      votes: s.shares_count * (s.share_class === 'A' ? 10 : 1),
      votesPercentage: 0 // Simplified
    }))
  }, [realShareholders, stats.totalShares])

  // Derive transactions from Ledger (Real Data)
  const transactions = useMemo<ShareTransaction[]>(() => {
    return verifications
      .filter(v => v.sourceType === 'equity_issue' || v.description.toLowerCase().includes('nyemission'))
      .map(v => {
        // Parse details from verification if possible (Amount from row 1930 usually)
        const amountRow = v.rows.find(r => r.account === '1930')
        const total = amountRow ? amountRow.debit : 0

        // Try to extract share count from desc "Nyemission X aktier"
        const match = v.description.match(/(\d+) aktier/)
        const shares = match ? parseInt(match[1]) : 0
        const price = shares > 0 ? total / shares : 0
        const nameMatch = v.description.match(/till (.+)$/)
        const toName = nameMatch ? nameMatch[1] : "Okänd"

        return {
          id: v.id,
          date: v.date,
          type: 'Nyemission',
          fromShareholder: 'Bolaget',
          toShareholder: toName,
          shares: shares,
          shareClass: 'B', // Assumption
          pricePerShare: price,
          totalPrice: total
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [verifications])

  // Filter shareholders
  const filteredShareholders = useMemo(() => {
    if (!searchQuery) return shareholders
    const query = searchQuery.toLowerCase()
    return shareholders.filter(s =>
      s.name.toLowerCase().includes(query)
    )
  }, [shareholders, searchQuery])

  // Filter transactions
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

  const getTransactionTypeLabel = (type: string): StockTransactionType => {
    // Basic mapping
    if (type === 'nyemission') return 'Nyemission'
    if (type === 'köp') return 'Köp'
    if (type === 'försäljning') return 'Försäljning'
    return type as StockTransactionType
  }

  // Toggle shareholder selection
  const toggleShareholder = (id: string) => {
    setSelectedShareholders(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllShareholders = () => {
    if (selectedShareholders.size === filteredShareholders.length) {
      setSelectedShareholders(new Set())
    } else {
      setSelectedShareholders(new Set(filteredShareholders.map(s => s.id)))
    }
  }

  // Toggle transaction selection
  const toggleTransaction = (id: string) => {
    setSelectedTransactions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllTransactions = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set())
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map(t => t.id)))
    }
  }

  const handleSaveTransaction = async () => {
    if (!txTo || !txShares || !txPrice) {
      toast.error("Uppgifter saknas", "Fyll i alla obligatoriska fält.")
      return
    }

    const shares = parseInt(txShares)
    const price = parseFloat(txPrice)
    const total = shares * price

    try {
      // Update or Create Shareholder
      const shareholder = realShareholders.find(s => s.name === txTo)
      if (shareholder) {
        await updateShareholder({
          id: shareholder.id,
          shares_count: shareholder.shares_count + shares
        })
      } else if (txType === 'Nyemission') {
        // Create new shareholder if they don't exist
        await addShareholder({
          name: txTo,
          shares_count: shares,
          shares_percentage: 0,
          share_class: txShareClass
        })
      }

      // Ledger Entry for Nyemission
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
      {/* Page Heading */}
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
      {/* Ownership Overview */}
      {statsError ? (
        <DataErrorState
          message={statsError}
          variant="inline"
        />
      ) : isLoadingStats ? (
        <StatCardGrid columns={3}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </StatCardGrid>
      ) : (
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-violet-950/30 p-5">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Ownership Ring Visualization */}
            <div className="flex items-center gap-6">
              <div className="relative h-28 w-28 shrink-0">
                {/* SVG Donut Chart */}
                <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                  {shareholders.slice(0, 5).map((s, i) => {
                    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#94a3b8']
                    const prevPercent = shareholders.slice(0, i).reduce((sum, prev) => sum + prev.ownershipPercentage, 0)
                    return (
                      <circle
                        key={s.id}
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="transparent"
                        stroke={colors[i]}
                        strokeWidth="3"
                        strokeDasharray={`${s.ownershipPercentage} ${100 - s.ownershipPercentage}`}
                        strokeDashoffset={`-${prevPercent}`}
                        className="transition-all duration-500"
                      />
                    )
                  })}
                  <circle
                    cx="18"
                    cy="18"
                    r="12"
                    fill="currentColor"
                    className="text-background"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{stats.shareholderCount}</span>
                  <span className="text-xs text-muted-foreground">ägare</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-1.5">
                {shareholders.slice(0, 4).map((s, i) => {
                  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500']
                  return (
                    <div key={s.id} className="flex items-center gap-2">
                      <div className={cn("h-2.5 w-2.5 rounded-full", colors[i])} />
                      <span className="text-sm truncate max-w-[120px]">{s.name}</span>
                      <span className="text-sm font-medium tabular-nums">{s.ownershipPercentage}%</span>
                    </div>
                  )
                })}
                {shareholders.length > 4 && (
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    <span className="text-sm text-muted-foreground">+{shareholders.length - 4} till</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Key Metrics */}
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="flex flex-col justify-center p-4 rounded-lg bg-background/60 border border-border/50">
                <FileText className="h-5 w-5 text-indigo-500 mb-2" />
                <p className="text-2xl font-bold tabular-nums">{stats.totalShares.toLocaleString('sv-SE')}</p>
                <p className="text-xs text-muted-foreground">Totalt aktier</p>
              </div>
              <div className="flex flex-col justify-center p-4 rounded-lg bg-background/60 border border-border/50">
                <Vote className="h-5 w-5 text-violet-500 mb-2" />
                <p className="text-2xl font-bold tabular-nums">{stats.totalVotes.toLocaleString('sv-SE')}</p>
                <p className="text-xs text-muted-foreground">Totalt röster</p>
              </div>
              <div className="flex flex-col justify-center p-4 rounded-lg bg-background/60 border border-border/50">
                <Users className="h-5 w-5 text-purple-500 mb-2" />
                <p className="text-2xl font-bold tabular-nums">{stats.shareholderCount}</p>
                <p className="text-xs text-muted-foreground">Aktieägare</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shareholders Table */}
      {activeTab === 'owners' && (
        <div className="space-y-4 pt-8 border-t-2 border-border/60">
          {/* Header & Actions */}
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

          <div>
            <GridTableHeader
              columns={[
                { label: 'Aktieägare', icon: User, span: 3 },
                { label: 'Typ', icon: Building2, span: 2 },
                { label: 'Aktier', icon: Hash, span: 2, align: 'right' },
                { label: 'Ägarandel', icon: Percent, span: 1, align: 'right' },
                { label: 'Röster', icon: Vote, span: 2, align: 'right' },
                { label: 'Anskaffning', icon: Calendar, span: 1, align: 'right' },
                { label: '', span: 1 }, // Actions
              ]}
            />
            <GridTableRows>
              {filteredShareholders.map((shareholder) => (
                <GridTableRow key={shareholder.id}>
                  {/* 1. Ägare */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="mt-0.5 text-muted-foreground">
                      {shareholder.type === 'person' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{shareholder.name}</div>
                      <div className="text-xs text-muted-foreground">{shareholder.personalNumber}</div>
                    </div>
                  </div>

                  {/* 2. Typ */}
                  <div className="col-span-2">
                    <span className={cn(
                      "inline-flex px-2 py-0.5 rounded-full text-xs font-medium border",
                      shareholder.type === 'person'
                        ? "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900"
                        : "bg-purple-50 text-purple-600 border-purple-100"
                    )}>
                      {shareholder.type === 'person' ? 'Privatperson' : 'Bolag'}
                    </span>
                  </div>

                  {/* 3. Aktier */}
                  <div className="col-span-2">
                    <div className="tabular-nums font-medium">{shareholder.shares.toLocaleString('sv-SE')}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border",
                        shareholder.shareClass === 'A'
                          ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800"
                          : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                      )}>
                        {shareholder.shareClass}-aktier
                      </span>
                    </div>
                  </div>

                  {/* 4. Ägarandel */}
                  <div className="col-span-1">
                    <div className="font-medium tabular-nums">{shareholder.ownershipPercentage}%</div>
                  </div>

                  {/* 5. Röster */}
                  <div className="col-span-2">
                    <div className="tabular-nums font-medium">{shareholder.votes.toLocaleString('sv-SE')}</div>
                    <div className="text-xs text-muted-foreground">{shareholder.votesPercentage}% av röster</div>
                  </div>

                  {/* 6. Anskaffning (Simplified) */}
                  <div className="col-span-1 text-muted-foreground text-xs">
                    {formatDate(shareholder.acquisitionDate)}
                  </div>

                  {/* 7. Actions */}
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Visa detaljer</DropdownMenuItem>
                        <DropdownMenuItem>Redigera</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Registrera överlåtelse</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Ta bort</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </GridTableRow>
              ))}
            </GridTableRows>
          </div>
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

          <div>
            <GridTableHeader
              columns={[
                { label: "Datum", icon: Calendar, span: 2 },
                { label: "Typ", icon: CheckCircle2, span: 2 },
                { label: "Från", icon: User, span: 2 },
                { label: "Till", icon: User, span: 2 },
                { label: "Aktier", icon: Hash, span: 2, align: 'right' },
                { label: "Pris/aktie", icon: Banknote, span: 1, align: 'right' },
                { label: "Totalt", icon: Banknote, span: 1, align: 'right' },
              ]}
            />
            <GridTableRows>
              {filteredTransactions.map((tx) => (
                <GridTableRow key={tx.id}>
                  {/* 1. Datum */}
                  <div className="col-span-2 text-sm">
                    {formatDate(tx.date)}
                  </div>

                  {/* 2. Typ */}
                  <div className="col-span-2">
                    <AppStatusBadge status={getTransactionTypeLabel(tx.type)} />
                  </div>

                  {/* 3. Från */}
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {tx.fromShareholder || '—'}
                  </div>

                  {/* 4. Till */}
                  <div className="col-span-2 font-medium text-sm">
                    {tx.toShareholder}
                  </div>

                  {/* 5. Aktier */}
                  <div className="col-span-2 text-right">
                    <div className="tabular-nums font-medium">{tx.shares.toLocaleString('sv-SE')}</div>
                    <div className="text-xs text-muted-foreground">{tx.shareClass}-aktier</div>
                  </div>

                  {/* 6. Pris */}
                  <div className="col-span-1 tabular-nums text-sm text-muted-foreground text-right">
                    {formatCurrency(tx.pricePerShare)}
                  </div>

                  {/* 7. Totalt */}
                  <div className="col-span-1 font-medium tabular-nums text-sm text-right">
                    {formatCurrency(tx.totalPrice)}
                  </div>
                </GridTableRow>
              ))}
            </GridTableRows>
          </div>
        </div>
      )}

      {/* Add Owner/Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrera {txType === 'Nyemission' ? 'Nyemission' : 'Överlåtelse'}
            </DialogTitle>
            <DialogDescription>
              {txType === 'Nyemission'
                ? 'Registrera nya aktier och betalning.'
                : 'Registrera ägarbyte mellan aktieägare.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaktionstyp</Label>
                <Select value={txType} onValueChange={(v: StockTransactionType) => setTxType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nyemission">Nyemission</SelectItem>
                    <SelectItem value="Köp">Köp/Försäljning</SelectItem>
                    <SelectItem value="Gåva">Gåva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
              </div>
            </div>

            {txType !== 'Nyemission' && (
              <div className="space-y-2">
                <Label>Från (Säljare)</Label>
                <Select value={txFrom} onValueChange={setTxFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj säljare" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareholders.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name} ({s.shares} aktier)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{txType === 'Nyemission' ? 'Till (Tecknare)' : 'Till (Köpare)'}</Label>
              {txType === 'Nyemission' ? (
                <Input value={txTo} onChange={e => setTxTo(e.target.value)} placeholder="Namn på ny ägare..." />
              ) : (
                <Select value={txTo} onValueChange={setTxTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj köpare" />
                  </SelectTrigger>
                  <SelectContent>
                    {shareholders.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Antal aktier</Label>
                <Input type="number" value={txShares} onChange={e => setTxShares(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Aktieslag</Label>
                <Select value={txShareClass} onValueChange={(v: 'A' | 'B') => setTxShareClass(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A-aktier (10 röster)</SelectItem>
                    <SelectItem value="B">B-aktier (1 röst)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pris per aktie (kr)</Label>
              <Input type="number" value={txPrice} onChange={e => setTxPrice(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSaveTransaction}>
              Spara transaktion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
