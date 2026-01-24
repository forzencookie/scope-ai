import { Calendar, Wallet, TrendingUp } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { formatCurrency } from "@/lib/utils"
import { termExplanations } from "@/components/rapporter/constants"

interface MomsStatsProps {
    stats: {
        nextPeriod: string
        deadline: string
        salesVat: number
        inputVat: number
        netVat: number
    }
    text: any
}

export function MomsStats({ stats, text }: MomsStatsProps) {
    return (
        <StatCardGrid columns={3}>
            <StatCard
                label={text.reports.nextDeclaration}
                value={stats.nextPeriod}
                subtitle={stats.deadline}
                headerIcon={Calendar}
                tooltip={termExplanations["Momsdeklaration"]}
            />
            <StatCard
                label={text.reports.vatToPay}
                value={formatCurrency(stats.netVat)}
                subtitle={`${text.reports.salesVat}: ${formatCurrency(stats.salesVat)}`}
                headerIcon={Wallet}
                tooltip={termExplanations["Moms att betala"]}
            />
            <StatCard
                label={text.reports.inputVat}
                value={formatCurrency(stats.inputVat)}
                subtitle={text.reports.deductible}
                headerIcon={TrendingUp}
                tooltip={termExplanations["Ingående moms"]}
            />
        </StatCardGrid>
    )
}
