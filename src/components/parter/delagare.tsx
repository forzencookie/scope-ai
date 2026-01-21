'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { LegalInfoCard, legalInfoContent } from '@/components/ui/legal-info-card';
import {
  GridTableHeader,
  GridTableRow,
  GridTableRows,
} from '@/components/ui/grid-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AppStatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { SearchBar } from '@/components/ui/search-bar';
import {
  Users,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Banknote,
  Percent,
  User,
} from 'lucide-react';
import { mockPartners, mockPartnerWithdrawals, Partner, PartnerWithdrawal, PARTNER_ACCOUNTS } from '@/data/ownership';
import { useCompany } from '@/providers/company-provider';
import { useBulkSelection } from '@/components/shared/bulk-action-toolbar';
import { useVerifications } from '@/hooks/use-verifications';

export function Delagare() {
  const { companyType } = useCompany();
  const { verifications } = useVerifications();

  const [partners, setPartners] = useState<Partner[]>(mockPartners);

  // Calculate verified balances for partners
  const enrichedPartners = useMemo(() => {
    return partners.map(p => {
      const accounts = PARTNER_ACCOUNTS[p.id];
      if (!accounts) return p;

      let balance = p.capitalContribution; // Start with initial contribution logic if tracked there, or 0 if capital is also in ledger

      // In a real system, initial capital might be a verification too. 
      // For now, let's assume 'capital' account transactions add to it, 'deposit' adds, 'withdrawal' subtracts.

      if (verifications) {
        let ledgerBalance = 0;
        verifications.forEach(v => {
          v.rows.forEach(row => {
            // Credit to Capital (2010/2020) -> Increase
            if (row.account === accounts.capital) {
              ledgerBalance += row.credit - row.debit;
            }
            // Credit to Deposit (2018/2028) -> Increase
            if (row.account === accounts.deposit) {
              ledgerBalance += row.credit - row.debit;
            }
            // Debit to Withdrawal (2013/2023) -> Decrease (Technically it's a debit balance account, so it reduces equity)
            // If we are calculating "Eget Kapital" (Equity), 2013 is a negative equity account.
            // So: Equity = 2010 + 2018 - 2013
            if (row.account === accounts.withdrawal) {
              ledgerBalance -= (row.debit - row.credit);
            }
          })
        })
        // If we have ledger entries, they likely supercede standard simple math, but assuming mock initial capital is separate:
        balance = ledgerBalance;
        // Note: If mockPartners has a base capitalContribution that IS NOT in the verifications (legacy), we might add it.
        // But for this "Production Readiness", let's assume verifications drive it if they exist.
        // However, our mock verifications might be empty early on.

        // Quick fix: If ledgerBalance is 0 and we have a hardcoded capitalContribution, allow it to remain as base.
        if (ledgerBalance !== 0) {
          balance = ledgerBalance;
        } else {
          // Fallback to mock data logic for prototype feel if no ledger data
          balance = p.currentCapitalBalance;
        }
      }
      return { ...p, currentCapitalBalance: balance };
    })
  }, [partners, verifications]);

  const [withdrawals] = useState<PartnerWithdrawal[]>(mockPartnerWithdrawals);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'uttag' | 'insättning'>('all');
  const [newPartner, setNewPartner] = useState({
    name: '',
    personalNumber: '',
    type: 'komplementär' as Partner['type'],
    ownershipPercentage: 0,
    capitalContribution: 0,
  });


  // Fetch stats from server
  const [stats, setStats] = useState({
    partnerCount: 0,
    totalCapital: 0,
    totalWithdrawals: 0
  })

  useEffect(() => {
    async function fetchStats() {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.rpc('get_partner_stats')

      if (!error && data) {
        setStats({
          partnerCount: Number(data.partnerCount) || 0,
          totalCapital: Number(data.totalCapital) || 0,
          totalWithdrawals: Number(data.totalWithdrawals) || 0
        })
      }
    }
    fetchStats()
  }, [])


  const komplementarer = enrichedPartners.filter(p => p.type === 'komplementär');
  const kommanditdelägare = enrichedPartners.filter(p => p.type === 'kommanditdelägare');

  const partnerTypeLabel = companyType === 'hb' ? 'Handelsbolag' : 'Kommanditbolag';
  const showKommanditdelägare = companyType === 'kb';

  const handleAddPartner = () => {
    const partner: Partner = {
      id: `p-${Date.now()}`,
      name: newPartner.name,
      personalNumber: newPartner.personalNumber,
      type: newPartner.type,
      ownershipPercentage: newPartner.ownershipPercentage,
      profitSharePercentage: newPartner.ownershipPercentage,
      capitalContribution: newPartner.capitalContribution,
      currentCapitalBalance: newPartner.capitalContribution,
      joinDate: new Date().toISOString().split('T')[0],
      isLimitedLiability: newPartner.type === 'kommanditdelägare',
    };
    setPartners([...partners, partner]);
    setIsAddDialogOpen(false);
    setNewPartner({
      name: '',
      personalNumber: '',
      type: 'komplementär',
      ownershipPercentage: 0,
      capitalContribution: 0,
    });
  };

  const formatPersonalNumber = (pnr: string) => {
    return `${pnr.substring(0, 8)}-****`;
  };

  // Filtered partners based on search
  const filteredPartners = enrichedPartners.filter(partner =>
    partner.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    partner.personalNumber.includes(partnerSearch)
  );

  // Filtered withdrawals based on type filter
  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    withdrawalFilter === 'all' || withdrawal.type === withdrawalFilter
  );

  // Use shared bulk selection hook (must be after filtered arrays are defined)
  const partnerSelection = useBulkSelection(filteredPartners);
  const withdrawalSelection = useBulkSelection(filteredWithdrawals);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Delägare</h2>
          <p className="text-muted-foreground">
            Hantera delägare i ditt {partnerTypeLabel.toLowerCase()}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Lägg till delägare
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till ny delägare</DialogTitle>
              <DialogDescription>
                Registrera en ny delägare i {partnerTypeLabel.toLowerCase()}et.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="partnerName">Namn</Label>
                <Input
                  id="partnerName"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="Anna Andersson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalNumber">Personnummer</Label>
                <Input
                  id="personalNumber"
                  value={newPartner.personalNumber}
                  onChange={(e) => setNewPartner({ ...newPartner, personalNumber: e.target.value })}
                  placeholder="YYYYMMDD-XXXX"
                />
              </div>
              {showKommanditdelägare && (
                <div className="space-y-2">
                  <Label htmlFor="partnerType">Typ av delägare</Label>
                  <Select
                    value={newPartner.type}
                    onValueChange={(value: Partner['type']) =>
                      setNewPartner({ ...newPartner, type: value })
                    }
                  >
                    <SelectTrigger id="partnerType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="komplementär">Komplementär</SelectItem>
                      <SelectItem value="kommanditdelägare">Kommanditdelägare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="ownership">Ägarandel (%)</Label>
                <Input
                  id="ownership"
                  type="number"
                  min="0"
                  max="100"
                  value={newPartner.ownershipPercentage}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, ownershipPercentage: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capital">Insatskapital (SEK)</Label>
                <Input
                  id="capital"
                  type="number"
                  min="0"
                  value={newPartner.capitalContribution}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, capitalContribution: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <Button onClick={handleAddPartner} className="w-full">
                Lägg till delägare
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Partner Capital Overview */}
      <div className="rounded-xl border bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Capital Bar Visualization */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold">Kapitalfördelning</h3>
              <span className="text-sm text-muted-foreground ml-auto">
                Totalt: {formatCurrency(stats.totalCapital)}
              </span>
            </div>

            {/* Stacked Bar */}
            <div className="h-8 rounded-lg bg-muted/50 overflow-hidden flex mb-3">
              {enrichedPartners.map((partner, index) => {
                const percentage = stats.totalCapital > 0
                  ? (partner.currentCapitalBalance / stats.totalCapital) * 100
                  : 0
                const colors = [
                  'bg-emerald-500',
                  'bg-teal-500',
                  'bg-cyan-500',
                  'bg-green-500',
                  'bg-lime-500',
                ]
                return (
                  <div
                    key={partner.id}
                    className={cn("h-full transition-all relative group", colors[index % colors.length])}
                    style={{ width: `${Math.max(percentage, 0)}%` }}
                    title={`${partner.name}: ${formatCurrency(partner.currentCapitalBalance)}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Partner Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {enrichedPartners.slice(0, 4).map((partner, index) => {
                const colors = [
                  'bg-emerald-500',
                  'bg-teal-500',
                  'bg-cyan-500',
                  'bg-green-500',
                ]
                return (
                  <div key={partner.id} className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", colors[index % colors.length])} />
                    <span className="text-sm">{partner.name}</span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(partner.currentCapitalBalance)}
                    </span>
                  </div>
                )
              })}
              {enrichedPartners.length > 4 && (
                <span className="text-sm text-muted-foreground">+{enrichedPartners.length - 4} till</span>
              )}
            </div>
          </div>

          {/* Right: Key Metrics */}
          <div className="grid grid-cols-3 gap-3 lg:w-auto lg:min-w-[360px]">
            <div className="flex flex-col p-3 rounded-lg bg-background/60 border border-border/50">
              <Users className="h-4 w-4 text-emerald-500 mb-1" />
              <p className="text-xl font-bold tabular-nums">{stats.partnerCount}</p>
              <p className="text-xs text-muted-foreground">Delägare</p>
            </div>
            <div className="flex flex-col p-3 rounded-lg bg-background/60 border border-border/50">
              <Wallet className="h-4 w-4 text-teal-500 mb-1" />
              <p className="text-xl font-bold tabular-nums">{formatCurrency(stats.totalCapital)}</p>
              <p className="text-xs text-muted-foreground">Kapital</p>
            </div>
            <div className="flex flex-col p-3 rounded-lg bg-background/60 border border-border/50">
              <TrendingDown className="h-4 w-4 text-red-500 mb-1" />
              <p className="text-xl font-bold tabular-nums">{formatCurrency(stats.totalWithdrawals)}</p>
              <p className="text-xs text-muted-foreground">Uttag i år</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Separator */}
      <div className="border-b-2 border-border/60" />

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registrerade delägare</CardTitle>
              <CardDescription>
                {showKommanditdelägare
                  ? 'Komplementärer har obegränsat personligt ansvar, kommanditdelägare har begränsat ansvar.'
                  : 'Alla delägare har solidariskt och obegränsat personligt ansvar.'
                }
              </CardDescription>
            </div>
            <SearchBar
              placeholder="Sök delägare..."
              value={partnerSearch}
              onChange={setPartnerSearch}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div>
            <GridTableHeader
              columns={[
                { label: "", span: 1 }, // Checkbox
                { label: "Namn", icon: User, span: 3 },
                { label: "Personnummer", span: 2 },
                // Conditional 'Typ' column handled by spans or rendering logic? 
                // GridTable doesn't strictly support conditional columns well in 'columns' array if we want 12-grid stability.
                // We'll include it if showKommanditdelägare is true.
                ...(showKommanditdelägare ? [{ label: "Typ", span: 2 }] : []),
                { label: "Ägarandel", icon: Percent, span: 1, align: 'right' },
                { label: "Insatskapital", icon: Banknote, span: showKommanditdelägare ? 1.5 : 2, align: 'right' },
                { label: "Kapitalsaldo", icon: Wallet, span: showKommanditdelägare ? 1.5 : 2, align: 'right' },
              ]}
            />
            <GridTableRows>
              {filteredPartners.map((partner) => (
                <GridTableRow key={partner.id}>
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={partnerSelection.isSelected(partner.id)}
                      onCheckedChange={() => partnerSelection.toggleItem(partner.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Name */}
                  <div className="col-span-3 font-semibold">
                    {partner.name}
                  </div>

                  {/* PNR */}
                  <div className="col-span-2 font-mono text-sm text-muted-foreground">
                    {formatPersonalNumber(partner.personalNumber)}
                  </div>

                  {/* Type (Conditional) */}
                  {showKommanditdelägare && (
                    <div className="col-span-2">
                      <AppStatusBadge
                        status={partner.type === 'komplementär' ? 'Komplementär' : 'Kommanditdelägare'}
                      />
                    </div>
                  )}

                  {/* Ownership */}
                  <div className="col-span-1 text-right">
                    {partner.ownershipPercentage}%
                  </div>

                  {/* Capital */}
                  <div className={cn("text-right font-mono", showKommanditdelägare ? "col-span-[1.5]" : "col-span-2")}>
                    {formatCurrency(partner.capitalContribution)}
                  </div>

                  {/* Balance */}
                  <div className={cn("text-right font-mono", showKommanditdelägare ? "col-span-[1.5]" : "col-span-2")}>
                    <span className={partner.currentCapitalBalance < partner.capitalContribution ? 'text-amber-600' : 'text-green-600 dark:text-green-500/70'}>
                      {formatCurrency(partner.currentCapitalBalance)}
                    </span>
                  </div>
                </GridTableRow>
              ))}
            </GridTableRows>
          </div>
        </CardContent>
      </Card>

      {/* Recent Withdrawals */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Senaste uttag & insättningar</CardTitle>
              <CardDescription>
                Kapitalrörelser per delägare
              </CardDescription>
            </div>
            <FilterTabs
              options={[
                { value: 'all', label: 'Alla', count: withdrawals.length },
                { value: 'uttag', label: 'Uttag', icon: <TrendingDown className="h-3 w-3" />, count: withdrawals.filter(w => w.type === 'uttag').length },
                { value: 'insättning', label: 'Insättningar', icon: <TrendingUp className="h-3 w-3" />, count: withdrawals.filter(w => w.type === 'insättning').length },
              ]}
              value={withdrawalFilter}
              onChange={(v) => setWithdrawalFilter(v as 'all' | 'uttag' | 'insättning')}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div>
            <GridTableHeader
              columns={[
                { label: "", span: 1 }, // Checkbox
                { label: "Datum", icon: Calendar, span: 2 },
                { label: "Delägare", icon: User, span: 2 },
                { label: "Typ", span: 2 },
                { label: "Beskrivning", span: 3 },
                { label: "Belopp", icon: Banknote, span: 2, align: 'right' },
              ]}
            />
            <GridTableRows>
              {filteredWithdrawals.map((withdrawal) => (
                <GridTableRow key={withdrawal.id}>
                  {/* Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={withdrawalSelection.isSelected(withdrawal.id)}
                      onCheckedChange={() => withdrawalSelection.toggleItem(withdrawal.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div className="col-span-2 text-sm text-muted-foreground">{withdrawal.date}</div>
                  <div className="col-span-2 font-medium">{withdrawal.partnerName}</div>
                  <div className="col-span-2">
                    <AppStatusBadge
                      status={withdrawal.type === 'uttag' ? 'Uttag' : 'Insättning'}
                    />
                  </div>
                  <div className="col-span-3 text-sm text-muted-foreground truncate">{withdrawal.description}</div>
                  <div className="col-span-2 text-right font-mono">
                    <span className={withdrawal.type === 'uttag' ? 'text-red-600 dark:text-red-500/70' : 'text-green-600 dark:text-green-500/70'}>
                      {withdrawal.type === 'uttag' ? '-' : '+'}{formatCurrency(withdrawal.amount)}
                    </span>
                  </div>
                </GridTableRow>
              ))}
            </GridTableRows>
          </div>
        </CardContent>
      </Card>

      {/* Legal Information */}
      <LegalInfoCard
        items={companyType === 'hb' ? legalInfoContent.hb : legalInfoContent.kb}
      />
    </div>
  );
}
