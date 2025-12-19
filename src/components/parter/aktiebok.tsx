"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  DataTable,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableBody,
  DataTableRow,
  DataTableCell
} from "@/components/ui/data-table"
import { useVerifications } from "@/hooks/use-verifications"
import { useToast } from "@/components/ui/toast"
import { useTextMode } from "@/providers/text-mode-provider"

export function Aktiebok() {
  const { addVerification } = useVerifications()
  const toast = useToast()
  const { text } = useTextMode()
  const [shareholders, setShareholders] = useState<Shareholder[]>(mockShareholders)
  const [transactions, setTransactions] = useState<ShareTransaction[]>(mockShareTransactions)

  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'owners' | 'transactions'>('owners')
  const [selectedShareholders, setSelectedShareholders] = useState<Set<string>>(new Set())
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set())

  // Form State
  const [txType, setTxType] = useState<ShareTransaction['type']>('nyemission')
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0])
  const [txShares, setTxShares] = useState("")
  const [txPrice, setTxPrice] = useState("")
  const [txTo, setTxTo] = useState("")
  const [txFrom, setTxFrom] = useState("")

  // Calculate stats
  const stats = useMemo(() => {
    const totalShares = shareholders.reduce((sum, s) => sum + s.shares, 0)
    const totalVotes = shareholders.reduce((sum, s) => sum + s.votes, 0)
    const totalValue = shareholders.reduce((sum, s) => sum + s.acquisitionPrice, 0)

    return {
      totalShares,
      totalVotes,
      totalValue,
      shareholderCount: shareholders.length,
    }
  }, [shareholders])

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

    return result.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [transactions, searchQuery])

  const getTransactionTypeLabel = (type: ShareTransaction['type']): StockTransactionType => {
    const labels: Record<ShareTransaction['type'], StockTransactionType> = {
      nyemission: 'Nyemission',
      köp: 'Köp',
      försäljning: 'Försäljning',
      gåva: 'Gåva',
      arv: 'Arv',
      split: 'Split',
    }
    return labels[type]
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

    const newTx: ShareTransaction = {
      id: `st-${Date.now()}`,
      date: txDate,
      type: txType,
      fromShareholder: txType === 'nyemission' ? undefined : txFrom,
      toShareholder: txTo,
      shares: shares,
      pricePerShare: price,
      totalPrice: total,
      shareClass: 'stamaktier'
    }

    // Update local state
    setTransactions(prev => [newTx, ...prev])

    // Logic to update shareholders based on transaction
    // (Simplified: assuming new shareholder if not exists, or update existing)
    if (txType === 'nyemission') {
      // Add shares to 'toShareholder'
      setShareholders(prev => {
        const exists = prev.find(s => s.name === txTo)
        if (exists) {
          return prev.map(s => s.name === txTo ? { ...s, shares: s.shares + shares, votes: s.votes + shares, acquisitionPrice: s.acquisitionPrice + total } : s)
        } else {
          return [...prev, {
            id: `sh-${Date.now()}`,
            name: txTo,
            type: 'person', // Default
            shares: shares,
            shareClass: 'stamaktier',
            ownershipPercentage: 0, // Needs re-calc of all
            acquisitionDate: txDate,
            acquisitionPrice: total,
            votes: shares,
            votesPercentage: 0
          }]
        }
      })

      // Ledger Entry for Nyemission
      await addVerification({
        date: txDate,
        description: `Nyemission ${shares} aktier till ${txTo}`,
        sourceType: 'equity_issue',
        rows: [
          { account: "1930", description: `Inbetalning nyemission ${txTo}`, debit: total, credit: 0 },
          { account: "2081", description: `Aktiekapital`, debit: 0, credit: total } // Simplified: All to share capital, usually split with premium reserve
        ]
      })

      toast.success("Nyemission registrerad", "Transaktionen och verifikatet har skapats.")

    } else if (txType === 'köp' || txType === 'försäljning') {
      // Transfer logic
      setShareholders(prev => {
        return prev.map(s => {
          if (s.name === txFrom) {
            return { ...s, shares: s.shares - shares, votes: s.votes - shares } // Simplified: assumes simple subtraction
          }
          if (s.name === txTo) {
            return { ...s, shares: s.shares + shares, votes: s.votes + shares }
          }
          return s
        })
      })
      toast.success("Överlåtelse registrerad", "Ägarförhållandena har uppdaterats.")
    }

    setShowAddDialog(false)
    setTxTo("")
    setTxFrom("")
    setTxShares("")
    setTxPrice("")
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          label={text.owners.totalShares}
          value={stats.totalShares.toLocaleString('sv-SE')}
          icon={FileText}
        />
        <StatCard
          label={text.owners.shareholderCount}
          value={stats.shareholderCount.toString()}
          icon={Users}
        />
        <StatCard
          label={text.owners.totalVotes}
          value={stats.totalVotes.toLocaleString('sv-SE')}
          icon={Vote}
        />
        <StatCard
          label={text.owners.shareValue}
          value={formatCurrency(stats.totalValue)}
          icon={TrendingUp}
        />
      </StatCardGrid>

      {/* Shareholders Table */}
      {activeTab === 'owners' && (
        <DataTable
          title={text.owners.shareholdersTable}
          headerActions={
            <>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-2" />
                    Åtgärder
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => { setTxType('nyemission'); setShowAddDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nyemission
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setTxType('köp'); setShowAddDialog(true); }}>
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
            </>
          }
        >
          <DataTableHeader>
            <DataTableHeaderCell className="w-10">
              <Checkbox
                checked={selectedShareholders.size === filteredShareholders.length && filteredShareholders.length > 0}
                onCheckedChange={toggleAllShareholders}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell label="Aktieägare" icon={User} />
            <DataTableHeaderCell label="Typ" icon={Building2} />
            <DataTableHeaderCell label="Aktier" icon={Hash} />
            <DataTableHeaderCell label="Ägarandel" icon={Percent} />
            <DataTableHeaderCell label="Röster" icon={Vote} />
            <DataTableHeaderCell label="Anskaffning" icon={Calendar} />
            <DataTableHeaderCell label="" />
          </DataTableHeader>
          <DataTableBody>
            {filteredShareholders.map((shareholder) => (
              <DataTableRow
                key={shareholder.id}
                selected={selectedShareholders.has(shareholder.id)}
              >
                <DataTableCell className="w-10">
                  <Checkbox
                    checked={selectedShareholders.has(shareholder.id)}
                    onCheckedChange={() => toggleShareholder(shareholder.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DataTableCell>
                <DataTableCell bold>
                  <div className="flex items-center gap-2">
                    {shareholder.type === 'person' ? (
                      <User className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">{shareholder.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {shareholder.personalNumber || shareholder.orgNumber}
                      </div>
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <span className={cn(
                    "inline-flex px-2 py-1 rounded-full text-xs font-medium",
                    shareholder.type === 'person'
                      ? "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400"
                      : "bg-purple-50 text-purple-600"
                  )}>
                    {shareholder.type === 'person' ? 'Person' : 'Företag'}
                  </span>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <div className="tabular-nums">{shareholder.shares.toLocaleString('sv-SE')}</div>
                    <div className="text-xs text-muted-foreground">{shareholder.shareClass}</div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <span className="font-medium">{shareholder.ownershipPercentage}%</span>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <div className="tabular-nums">{shareholder.votes.toLocaleString('sv-SE')}</div>
                    <div className="text-xs text-muted-foreground">{shareholder.votesPercentage}%</div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <div>{formatDate(shareholder.acquisitionDate)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(shareholder.acquisitionPrice)}
                    </div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}

      {/* Transactions Table */}
      {activeTab === 'transactions' && (
        <DataTable
          title={text.owners.transactionsTable}
          headerActions={
            <>
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
                  <DropdownMenuItem onClick={() => { setTxType('nyemission'); setShowAddDialog(true); }}>
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
            </>
          }
        >
          <DataTableHeader>
            <DataTableHeaderCell className="w-10">
              <Checkbox
                checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                onCheckedChange={toggleAllTransactions}
              />
            </DataTableHeaderCell>
            <DataTableHeaderCell label="Datum" icon={Calendar} />
            <DataTableHeaderCell label="Typ" icon={CheckCircle2} />
            <DataTableHeaderCell label="Från" icon={User} />
            <DataTableHeaderCell label="Till" icon={User} />
            <DataTableHeaderCell label="Aktier" icon={Hash} />
            <DataTableHeaderCell label="Pris/aktie" icon={Banknote} />
            <DataTableHeaderCell label="Totalt" icon={Banknote} />
            <DataTableHeaderCell label="" />
          </DataTableHeader>
          <DataTableBody>
            {filteredTransactions.map((tx) => (
              <DataTableRow
                key={tx.id}
                selected={selectedTransactions.has(tx.id)}
              >
                <DataTableCell className="w-10">
                  <Checkbox
                    checked={selectedTransactions.has(tx.id)}
                    onCheckedChange={() => toggleTransaction(tx.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DataTableCell>
                <DataTableCell>
                  {formatDate(tx.date)}
                </DataTableCell>
                <DataTableCell>
                  <AppStatusBadge status={getTransactionTypeLabel(tx.type)} />
                </DataTableCell>
                <DataTableCell muted>
                  {tx.fromShareholder || '—'}
                </DataTableCell>
                <DataTableCell bold>
                  {tx.toShareholder}
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <div className="tabular-nums">{tx.shares.toLocaleString('sv-SE')}</div>
                    <div className="text-xs text-muted-foreground">{tx.shareClass}</div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  {formatCurrency(tx.pricePerShare)}
                </DataTableCell>
                <DataTableCell>
                  <span className="font-medium">{formatCurrency(tx.totalPrice)}</span>
                </DataTableCell>
                <DataTableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Visa detaljer</DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner dokument
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}

      {/* Add Owner/Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Registrera {txType === 'nyemission' ? 'Nyemission' : 'Överlåtelse'}
            </DialogTitle>
            <DialogDescription>
              {txType === 'nyemission'
                ? 'Registrera nya aktier och betalning.'
                : 'Registrera ägarbyte mellan aktieägare.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transaktionstyp</Label>
                <Select value={txType} onValueChange={(v: ShareTransaction['type']) => setTxType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nyemission">Nyemission</SelectItem>
                    <SelectItem value="köp">Köp/Försäljning</SelectItem>
                    <SelectItem value="gåva">Gåva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
              </div>
            </div>

            {txType !== 'nyemission' && (
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
              <Label>{txType === 'nyemission' ? 'Till (Tecknare)' : 'Till (Köpare)'}</Label>
              {txType === 'nyemission' ? (
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
                    {/* In real app, allow adding new owner inline or assume existing */}
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
                <Label>Pris per aktie (kr)</Label>
                <Input type="number" value={txPrice} onChange={e => setTxPrice(e.target.value)} placeholder="0" />
              </div>
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
