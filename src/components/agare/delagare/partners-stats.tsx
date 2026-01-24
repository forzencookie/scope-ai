import { formatCurrency, cn } from '@/lib/utils';
import { Wallet, Users, TrendingDown } from 'lucide-react';
import { type Partner } from '@/data/ownership';

interface PartnersStatsProps {
    stats: {
        totalOwners: number;
        totalCapital: number;
        activePartners: number;
    }
    enrichedPartners: Partner[];
    totalWithdrawals: number; // This needs to come from similar source as before (or calculated)
}

export function PartnersStats({ stats, enrichedPartners, totalWithdrawals }: PartnersStatsProps) {
    return (
        <div className="rounded-xl border bg-muted/20 p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left: Capital Bar Visualization */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Kapitalfördelning</h3>
              <span className="text-sm text-muted-foreground ml-auto">
                Totalt: {formatCurrency(stats.totalCapital)}
              </span>
            </div>

            {/* Stacked Bar */}
            <div className="h-8 rounded-lg bg-muted/50 overflow-hidden flex mb-3">
              {enrichedPartners.map((partner, index) => {
                const percentage = stats.totalCapital > 0
                  // @ts-ignore - currentCapitalBalance might be added by enrichment
                  ? (partner.currentCapitalBalance / stats.totalCapital) * 100
                  : 0
                const colors = [
                  'bg-foreground',
                  'bg-foreground/80',
                  'bg-foreground/60',
                  'bg-foreground/40',
                  'bg-foreground/20',
                ]
                return (
                  <div
                    key={partner.id}
                    className={cn("h-full transition-all relative group", colors[index % colors.length])}
                    // @ts-ignore
                    style={{ width: `${Math.max(percentage, 0)}%` }}
                    // @ts-ignore
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
                  'bg-foreground',
                  'bg-foreground/80',
                  'bg-foreground/60',
                  'bg-foreground/40',
                ]
                return (
                  <div key={partner.id} className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", colors[index % colors.length])} />
                    <span className="text-sm">{partner.name}</span>
                    <span className="text-sm font-medium tabular-nums">
                        {/* @ts-ignore */}
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
              <Users className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xl font-bold tabular-nums">{stats.totalOwners}</p>
              <p className="text-xs text-muted-foreground">Delägare</p>
            </div>
            <div className="flex flex-col p-3 rounded-lg bg-background/60 border border-border/50">
              <Wallet className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xl font-bold tabular-nums">{formatCurrency(stats.totalCapital)}</p>
              <p className="text-xs text-muted-foreground">Kapital</p>
            </div>
            <div className="flex flex-col p-3 rounded-lg bg-background/60 border border-border/50">
              <TrendingDown className="h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-xl font-bold tabular-nums">{formatCurrency(totalWithdrawals)}</p>
              <p className="text-xs text-muted-foreground">Uttag i år</p>
            </div>
          </div>
        </div>
      </div>
    )
}
