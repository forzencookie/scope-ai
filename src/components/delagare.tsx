'use client';

import { useState } from 'react';
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
  DataTable,
  DataTableHeader,
  DataTableHeaderCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
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
  FileText,
  Calendar,
  Banknote,
  Percent,
  User,
} from 'lucide-react';
import { mockPartners, mockPartnerWithdrawals, Partner, PartnerWithdrawal } from '@/data/ownership';
import { useCompany } from '@/providers/company-provider';

export function Delagare() {
  const { companyType } = useCompany();
  const [partners, setPartners] = useState<Partner[]>(mockPartners);
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

  const totalCapital = partners.reduce((sum, p) => sum + p.currentCapitalBalance, 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => 
    w.type === 'uttag' ? sum + w.amount : sum - w.amount, 0
  );
  const komplementarer = partners.filter(p => p.type === 'komplementär');
  const kommanditdelägare = partners.filter(p => p.type === 'kommanditdelägare');

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPersonalNumber = (pnr: string) => {
    // Mask personal number for privacy
    return `${pnr.substring(0, 8)}-****`;
  };

  // Filtered partners based on search
  const filteredPartners = partners.filter(partner =>
    partner.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    partner.personalNumber.includes(partnerSearch)
  );

  // Filtered withdrawals based on type filter
  const filteredWithdrawals = withdrawals.filter(withdrawal =>
    withdrawalFilter === 'all' || withdrawal.type === withdrawalFilter
  );

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

      {/* Statistics */}
      <StatCardGrid columns={3}>
        <StatCard
          label="Antal delägare"
          value={partners.length.toString()}
          subtitle={showKommanditdelägare 
            ? `${komplementarer.length} komplementärer, ${kommanditdelägare.length} kommanditdelägare`
            : 'Aktiva delägare'
          }
          icon={Users}
        />
        <StatCard
          label="Totalt kapital"
          value={formatCurrency(totalCapital)}
          subtitle="Aktuellt kapitalsaldo"
          icon={Wallet}
        />
        <StatCard
          label="Uttag i år"
          value={formatCurrency(totalWithdrawals)}
          subtitle={`${withdrawals.length} transaktioner`}
          icon={TrendingDown}
        />
      </StatCardGrid>

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
          <DataTable>
            <DataTableHeader>
              <DataTableHeaderCell label="Namn" icon={User} />
              <DataTableHeaderCell label="Personnummer" />
              {showKommanditdelägare && <DataTableHeaderCell label="Typ" />}
              <DataTableHeaderCell label="Ägarandel" icon={Percent} align="right" />
              <DataTableHeaderCell label="Insatskapital" icon={Banknote} align="right" />
              <DataTableHeaderCell label="Kapitalsaldo" icon={Wallet} align="right" />
            </DataTableHeader>
            <DataTableBody>
              {filteredPartners.map((partner) => (
                <DataTableRow key={partner.id}>
                  <DataTableCell bold>{partner.name}</DataTableCell>
                  <DataTableCell mono muted>
                    {formatPersonalNumber(partner.personalNumber)}
                  </DataTableCell>
                  {showKommanditdelägare && (
                    <DataTableCell>
                      <AppStatusBadge 
                        status={partner.type === 'komplementär' ? 'Komplementär' : 'Kommanditdelägare'}
                      />
                    </DataTableCell>
                  )}
                  <DataTableCell align="right">{partner.ownershipPercentage}%</DataTableCell>
                  <DataTableCell align="right" mono>
                    {formatCurrency(partner.capitalContribution)}
                  </DataTableCell>
                  <DataTableCell align="right" mono>
                    <span className={partner.currentCapitalBalance < partner.capitalContribution ? 'text-amber-600' : 'text-green-600 dark:text-green-500/70'}>
                      {formatCurrency(partner.currentCapitalBalance)}
                    </span>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
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
          <DataTable>
            <DataTableHeader>
              <DataTableHeaderCell label="Datum" icon={Calendar} />
              <DataTableHeaderCell label="Delägare" icon={User} />
              <DataTableHeaderCell label="Typ" />
              <DataTableHeaderCell label="Beskrivning" />
              <DataTableHeaderCell label="Belopp" icon={Banknote} align="right" />
            </DataTableHeader>
            <DataTableBody>
              {filteredWithdrawals.map((withdrawal) => (
                <DataTableRow key={withdrawal.id}>
                  <DataTableCell muted>{withdrawal.date}</DataTableCell>
                  <DataTableCell bold>{withdrawal.partnerName}</DataTableCell>
                  <DataTableCell>
                    <AppStatusBadge 
                      status={withdrawal.type === 'uttag' ? 'Uttag' : 'Insättning'}
                    />
                  </DataTableCell>
                  <DataTableCell muted>
                    {withdrawal.description}
                  </DataTableCell>
                  <DataTableCell align="right" mono>
                    <span className={withdrawal.type === 'uttag' ? 'text-red-600 dark:text-red-500/70' : 'text-green-600 dark:text-green-500/70'}>
                      {withdrawal.type === 'uttag' ? '-' : '+'}{formatCurrency(withdrawal.amount)}
                    </span>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </CardContent>
      </Card>

      {/* Legal Information */}
      <LegalInfoCard
        items={companyType === 'hb' ? legalInfoContent.hb : legalInfoContent.kb}
      />
    </div>
  );
}
