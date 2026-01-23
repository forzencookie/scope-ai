import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  AlertCircle
} from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { formatCurrency } from "@/lib/utils"

interface MemberStatsProps {
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

export function MemberStatsGrid({ stats }: MemberStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Medlemmar"
        value={stats.totalMembers.toString()}
        icon={Users}
        description={`Varav ${stats.boardMembers} i styrelsen`}
        trend={{ value: 5, label: "från förra månaden", direction: "up" }}
      />
      <StatCard
        title="Aktiva"
        value={stats.activeMembers.toString()}
        icon={UserCheck}
        description={`${stats.pendingMembers} nya ansökningar`}
      />
      <StatCard
        title="Inbetalda avgifter"
        value={formatCurrency(stats.totalFees)}
        icon={CreditCard}
        description="För innevarande år"
      />
      <StatCard
        title="Obetalda avgifter"
        value={formatCurrency(stats.unpaidFees)}
        icon={UserX}
        description={`${stats.unpaidCount} st förfallna`}
        status="danger"
      />
    </div>
  )
}
