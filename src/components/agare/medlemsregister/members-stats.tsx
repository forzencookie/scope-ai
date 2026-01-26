import {
  Users,
  UserCheck,
  CreditCard
} from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import { formatCurrency } from "@/lib/utils"

interface MembersStatsProps {
  stats: {
    totalMembers: number
    activeMembers: number
    pendingMembers: number
    totalFees: number
    unpaidFees: number
    unpaidCount: number
    boardMembers: number
  }
}

export function MembersStats({ stats }: MembersStatsProps) {
  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Medlemmar"
        value={stats.totalMembers.toString()}
        headerIcon={Users}
        subtitle={`Varav ${stats.boardMembers} i styrelsen`}
        change="+5"
        changeType="positive"
      />
      <StatCard
        label="Aktiva"
        value={stats.activeMembers.toString()}
        headerIcon={UserCheck}
        subtitle={`${stats.pendingMembers} nya ansökningar`}
      />
      <StatCard
        label="Inbetalda avgifter"
        value={formatCurrency(stats.totalFees)}
        headerIcon={CreditCard}
        subtitle="För innevarande år"
      />
      <StatCard
        label="Obetalda avgifter"
        value={formatCurrency(stats.unpaidFees)}
        headerIcon={UserX}
        subtitle={`${stats.unpaidCount} st förfallna`}
      />
    </div>
  )
}
