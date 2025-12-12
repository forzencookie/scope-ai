"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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

export function Aktiebok() {
  const [shareholders] = useState<Shareholder[]>(mockShareholders)
  const [transactions] = useState<ShareTransaction[]>(mockShareTransactions)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'owners' | 'transactions'>('owners')

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('sv-SE')
  }

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

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Totalt antal aktier"
          value={stats.totalShares.toLocaleString('sv-SE')}
          icon={FileText}
        />
        <StatCard
          label="Antal ägare"
          value={stats.shareholderCount.toString()}
          icon={Users}
        />
        <StatCard
          label="Totalt röstetal"
          value={stats.totalVotes.toLocaleString('sv-SE')}
          icon={Vote}
        />
        <StatCard
          label="Totalt anskaffningsvärde"
          value={formatCurrency(stats.totalValue)}
          icon={TrendingUp}
        />
      </StatCardGrid>

      {/* Shareholders Table */}
      {activeTab === 'owners' && (
        <DataTable
          title="Aktieägare"
          headerActions={
            <>
              <SearchBar
                placeholder="Sök ägare..."
                value={searchQuery}
                onChange={setSearchQuery}
              />

              <Button
                variant="outline"
                size="sm"
                className="h-8 border-2 border-border/60"
                onClick={() => setActiveTab('transactions')}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transaktioner
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="h-8">
                    <Plus className="h-4 w-4 mr-2" />
                    Åtgärder
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till ägare
                  </DropdownMenuItem>
                  <DropdownMenuItem>
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
              <DataTableRow key={shareholder.id}>
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
                    <div className="font-mono">{shareholder.shares.toLocaleString('sv-SE')}</div>
                    <div className="text-xs text-muted-foreground">{shareholder.shareClass}</div>
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <span className="font-medium">{shareholder.ownershipPercentage}%</span>
                </DataTableCell>
                <DataTableCell>
                  <div>
                    <div className="font-mono">{shareholder.votes.toLocaleString('sv-SE')}</div>
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
          title="Aktietransaktioner"
          headerActions={
            <>
              <SearchBar
                placeholder="Sök transaktion..."
                value={searchQuery}
                onChange={setSearchQuery}
              />

              <Button
                variant="outline"
                size="sm"
                className="h-8 border-2 border-border/60"
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
                  <DropdownMenuItem onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ny transaktion
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
              <DataTableRow key={tx.id}>
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
                    <div className="font-mono">{tx.shares.toLocaleString('sv-SE')}</div>
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

      {filteredShareholders.length === 0 && activeTab === 'owners' && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Inga aktieägare hittades</p>
        </div>
      )}

      {/* Add Owner/Transaction Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'owners' ? 'Lägg till aktieägare' : 'Registrera aktietransaktion'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'owners' 
                ? 'Lägg till en ny ägare i aktieboken'
                : 'Registrera köp, försäljning eller annan aktietransaktion'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {activeTab === 'owners' ? (
              <>
                <div className="space-y-2">
                  <Label>Namn</Label>
                  <Input placeholder="För- och efternamn eller företagsnamn" />
                </div>
                <div className="space-y-2">
                  <Label>Person-/Organisationsnummer</Label>
                  <Input placeholder="XXXXXX-XXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Antal aktier</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Aktieslag</Label>
                  <Input placeholder="Stamaktier" />
                </div>
                <div className="space-y-2">
                  <Label>Anskaffningsdatum</Label>
                  <Input type="date" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Transaktionstyp</Label>
                  <Input placeholder="Köp, försäljning, nyemission..." />
                </div>
                <div className="space-y-2">
                  <Label>Datum</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Antal aktier</Label>
                  <Input type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Pris per aktie (kr)</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={() => setShowAddDialog(false)}>
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
