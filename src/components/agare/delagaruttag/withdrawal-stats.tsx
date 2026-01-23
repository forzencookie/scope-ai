import { formatCurrency } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Wallet, AlertTriangle } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"

interface WithdrawalStatsProps {
  stats: {
    totalUttag: number
    totalInsattning: number
    totalLon: number
    pendingCount: number
  }
}

export function WithdrawalStats({ stats }: WithdrawalStatsProps) {
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
        status={stats.pendingCount > 0 ? "warning" : "default"}
        headerIcon={AlertTriangle}
      />
    </StatCardGrid>
  )
}
