import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { Skeleton } from "@/components/ui/skeleton"

interface WithdrawalStatsProps {
  stats: {
    totalUttag: number
    totalInsattning: number
    totalLon: number
    pendingCount: number
  }
  isLoading?: boolean
}

export function WithdrawalStats({ stats, isLoading }: WithdrawalStatsProps) {
  if (isLoading) {
    return (
      <StatCardGrid columns={4}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border-2 border-border/60 space-y-3">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </StatCardGrid>
    )
  }

  return (
    <StatCardGrid columns={4}>
      <StatCard
        label="Totala uttag"
        value={formatCurrency(stats.totalUttag)}
        subtitle="i år"
        headerIcon={ArrowUpRight}
      />
      <StatCard
        label="Totala insättningar"
        value={formatCurrency(stats.totalInsattning)}
        subtitle="i år"
        headerIcon={ArrowDownRight}
      />
      <StatCard
        label="Utbetalda löner"
        value={formatCurrency(stats.totalLon)}
        subtitle="i år"
        headerIcon={Wallet}
      />
      <StatCard
        label="Att attestera"
        value={stats.pendingCount.toString()}
        subtitle="transaktioner"
        headerIcon={AlertTriangle}
      />
    </StatCardGrid>
  )
}
