"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  Users,
  Calendar,
  Wallet,
  TrendingUp,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  AlertTriangle,
  Info,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchBar } from "@/components/ui/search-bar"
import { Checkbox } from "@/components/ui/checkbox"
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
import { mockPartners, type Partner } from "@/data/ownership"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { LegalInfoCard } from "@/components/ui/legal-info-card"
import { 
  DataTable, 
  DataTableHeader, 
  DataTableHeaderCell, 
  DataTableBody, 
  DataTableRow, 
  DataTableCell 
} from "@/components/ui/data-table"
import { AppStatusBadge } from "@/components/ui/status-badge"

interface Withdrawal {
  id: string
  partnerId: string
  partnerName: string
  date: string
  amount: number
  type: 'uttag' | 'insättning' | 'lön'
  description: string
  approved: boolean
}

// Mock withdrawals data
const mockWithdrawals: Withdrawal[] = [
  {
    id: 'w1',
    partnerId: mockPartners[0].id,
    partnerName: mockPartners[0].name,
    date: '2024-05-15',
    amount: 25000,
    type: 'uttag',
    description: 'Privat uttag',
    approved: true,
  },
  {
    id: 'w2',
    partnerId: mockPartners[0].id,
    partnerName: mockPartners[0].name,
    date: '2024-05-01',
    amount: 30000,
    type: 'lön',
    description: 'Lön maj',
    approved: true,
  },
  {
    id: 'w3',
    partnerId: mockPartners[1].id,
    partnerName: mockPartners[1].name,
    date: '2024-05-10',
    amount: 15000,
    type: 'uttag',
    description: 'Privat uttag',
    approved: true,
  },
  {
    id: 'w4',
    partnerId: mockPartners[1].id,
    partnerName: mockPartners[1].name,
    date: '2024-04-28',
    amount: 50000,
    type: 'insättning',
    description: 'Kapitaltillskott',
    approved: true,
  },
  {
    id: 'w5',
    partnerId: mockPartners[0].id,
    partnerName: mockPartners[0].name,
    date: '2024-04-15',
    amount: 20000,
    type: 'uttag',
    description: 'Förskott',
    approved: false,
  },
]

const typeConfig = {
  uttag: { label: 'Uttag', color: 'text-red-600 bg-red-50 dark:text-red-500/70 dark:bg-red-950/50', icon: ArrowUpRight },
  insättning: { label: 'Insättning', color: 'text-green-600 bg-green-50 dark:text-green-500/70 dark:bg-green-950/50', icon: ArrowDownRight },
  lön: { label: 'Lön', color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/50', icon: Wallet },
}

export function DelagaruttagManager() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(mockWithdrawals)
  const [searchQuery, setSearchQuery] = useState("")
  const [partnerFilter, setPartnerFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Calculate stats per partner
  const partnerStats = useMemo(() => {
    return mockPartners.map(partner => {
      const partnerWithdrawals = withdrawals.filter(w => w.partnerId === partner.id)
      const totalUttag = partnerWithdrawals
        .filter(w => w.type === 'uttag')
        .reduce((sum, w) => sum + w.amount, 0)
      const totalInsattning = partnerWithdrawals
        .filter(w => w.type === 'insättning')
        .reduce((sum, w) => sum + w.amount, 0)
      const totalLon = partnerWithdrawals
        .filter(w => w.type === 'lön')
        .reduce((sum, w) => sum + w.amount, 0)
      
      const nettoUttag = totalUttag + totalLon - totalInsattning
      const kapitalkonto = partner.capitalContribution - nettoUttag

      return {
        ...partner,
        totalUttag,
        totalInsattning,
        totalLon,
        nettoUttag,
        kapitalkonto,
      }
    })
  }, [withdrawals])

  // Filtered withdrawals
  const filteredWithdrawals = useMemo(() => {
    let result = withdrawals

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(w =>
        w.partnerName.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query)
      )
    }

    if (partnerFilter) {
      result = result.filter(w => w.partnerId === partnerFilter)
    }

    if (typeFilter) {
      result = result.filter(w => w.type === typeFilter)
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [withdrawals, searchQuery, partnerFilter, typeFilter])

  // Overall stats
  const overallStats = useMemo(() => {
    const totalUttag = withdrawals
      .filter(w => w.type === 'uttag')
      .reduce((sum, w) => sum + w.amount, 0)
    const totalInsattning = withdrawals
      .filter(w => w.type === 'insättning')
      .reduce((sum, w) => sum + w.amount, 0)
    const totalLon = withdrawals
      .filter(w => w.type === 'lön')
      .reduce((sum, w) => sum + w.amount, 0)
    const pendingCount = withdrawals.filter(w => !w.approved).length

    return { totalUttag, totalInsattning, totalLon, pendingCount }
  }, [withdrawals])

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

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatCardGrid columns={4}>
        <StatCard
          label="Totala uttag"
          value={formatCurrency(overallStats.totalUttag)}
          subtitle="i år"
          icon={ArrowUpRight}
        />
        <StatCard
          label="Totala insättningar"
          value={formatCurrency(overallStats.totalInsattning)}
          subtitle="i år"
          icon={ArrowDownRight}
        />
        <StatCard
          label="Utbetalda löner"
          value={formatCurrency(overallStats.totalLon)}
          subtitle="i år"
          icon={Wallet}
        />
        <StatCard
          label="Att godkänna"
          value={overallStats.pendingCount.toString()}
          subtitle={overallStats.pendingCount > 0 ? "Väntar på godkännande" : "transaktioner"}
          icon={FileText}
        />
      </StatCardGrid>

      {/* Section Separator */}
      <div className="border-b-2 border-border/60" />

      {/* Partner Capital Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Kapitalkonton per delägare
          </CardTitle>
          <CardDescription>
            Översikt över varje delägares kapital och uttag
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {partnerStats.map(partner => (
              <Card key={partner.id} className="bg-background border-2 border-border/60">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{partner.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {partner.ownershipPercentage}% ägarandel
                      </p>
                    </div>
                    <AppStatusBadge 
                      status={partner.type === 'komplementär' ? 'Komplementär' : 'Kommanditdelägare'}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ursprungligt kapital</span>
                      <span className="font-mono">{formatCurrency(partner.capitalContribution)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 dark:text-red-500/70">
                      <span>Uttag + löner</span>
                      <span className="font-mono">-{formatCurrency(partner.totalUttag + partner.totalLon)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-500/70">
                      <span>Insättningar</span>
                      <span className="font-mono">+{formatCurrency(partner.totalInsattning)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-2 border-t">
                      <span>Kapitalkonto</span>
                      <span className={cn(
                        "font-mono",
                        partner.kapitalkonto < 0 && "text-red-600 dark:text-red-500/70"
                      )}>
                        {formatCurrency(partner.kapitalkonto)}
                      </span>
                    </div>
                  </div>

                  {partner.kapitalkonto < 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                      <AlertTriangle className="h-3 w-3" />
                      Negativt kapitalkonto
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaktionshistorik</CardTitle>
              <CardDescription>
                Alla uttag, insättningar och löner
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny transaktion
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrera transaktion</DialogTitle>
                  <DialogDescription>
                    Lägg till ett uttag, insättning eller löneutbetalning
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Delägare</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          Välj delägare
                          <Filter className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[200px]">
                        {mockPartners.map(p => (
                          <DropdownMenuItem key={p.id}>{p.name}</DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Label>Typ</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                          Välj typ
                          <Filter className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-[200px]">
                        <DropdownMenuItem>Uttag</DropdownMenuItem>
                        <DropdownMenuItem>Insättning</DropdownMenuItem>
                        <DropdownMenuItem>Lön</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <Label>Belopp (kr)</Label>
                    <Input type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Datum</Label>
                    <Input type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Beskrivning</Label>
                    <Input placeholder="T.ex. Privat uttag, Kapitaltillskott..." />
                  </div>
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
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <SearchBar
              placeholder="Sök..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-[180px] justify-between border-2 border-border/60">
                  {partnerFilter ? mockPartners.find(p => p.id === partnerFilter)?.name : "Alla delägare"}
                  <Filter className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setPartnerFilter(null)}>Alla delägare</DropdownMenuItem>
                <DropdownMenuSeparator />
                {mockPartners.map(p => (
                  <DropdownMenuItem key={p.id} onClick={() => setPartnerFilter(p.id)}>{p.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-[150px] justify-between border-2 border-border/60">
                  {typeFilter ? typeConfig[typeFilter as keyof typeof typeConfig]?.label : "Alla typer"}
                  <Filter className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setTypeFilter(null)}>Alla typer</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTypeFilter('uttag')}>Uttag</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('insättning')}>Insättning</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTypeFilter('lön')}>Lön</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <DataTable>
            <DataTableHeader>
              <DataTableHeaderCell label="Datum" icon={Calendar} />
              <DataTableHeaderCell label="Delägare" icon={Users} />
              <DataTableHeaderCell label="Typ" />
              <DataTableHeaderCell label="Beskrivning" />
              <DataTableHeaderCell label="Belopp" icon={Wallet} />
              <DataTableHeaderCell label="Status" />
              <DataTableHeaderCell label="" />
            </DataTableHeader>
            <DataTableBody>
              {filteredWithdrawals.map((w) => {
                const typeInfo = typeConfig[w.type]
                const TypeIcon = typeInfo.icon

                return (
                  <DataTableRow key={w.id}>
                    <DataTableCell>
                      {formatDate(w.date)}
                    </DataTableCell>
                    <DataTableCell bold>
                      {w.partnerName}
                    </DataTableCell>
                    <DataTableCell>
                      <AppStatusBadge status={typeInfo.label} />
                    </DataTableCell>
                    <DataTableCell muted>
                      {w.description}
                    </DataTableCell>
                    <DataTableCell>
                      <span className={cn(
                        "font-mono font-medium",
                        w.type === 'insättning' ? "text-green-600 dark:text-green-500/70" : "text-red-600 dark:text-red-500/70"
                      )}>
                        {w.type === 'insättning' ? '+' : '-'}{formatCurrency(w.amount)}
                      </span>
                    </DataTableCell>
                    <DataTableCell>
                      <AppStatusBadge status={w.approved ? 'Godkänd' : 'Väntar'} />
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
                          {!w.approved && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Godkänn</DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Ta bort</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DataTableCell>
                  </DataTableRow>
                )
              })}
            </DataTableBody>
          </DataTable>

          {filteredWithdrawals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Inga transaktioner hittades</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <LegalInfoCard
        title="Om kapitalkonton i handelsbolag"
        variant="info"
        items={[
          {
            content: "Varje delägare har ett kapitalkonto som visar deras andel av bolagets tillgångar. Uttag minskar kapitalkontot medan insättningar ökar det. Vid årets slut fördelas vinsten enligt ägarandelarna och läggs till på respektive kapitalkonto."
          }
        ]}
      />
    </div>
  )
}
