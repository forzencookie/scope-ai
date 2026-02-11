import { Calendar, Wallet, TrendingUp } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { ResponsiveCurrency } from "@/components/ui/responsive-currency"
import { formatCurrency } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { termExplanations } from "@/components/rapporter/constants"

interface MomsStatsProps {
    stats: {
        nextPeriod: string
        deadline: string
        salesVat: number
        inputVat: number
        netVat: number
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                value={<ResponsiveCurrency amount={stats.netVat} />}
                subtitle={`${text.reports.salesVat}: ${formatCurrencyCompact(stats.salesVat)}`}
                headerIcon={Wallet}
                tooltip={termExplanations["Moms att betala"]}
            />
            <StatCard
                label={text.reports.inputVat}
                value={<ResponsiveCurrency amount={stats.inputVat} />}
                subtitle={text.reports.deductible}
                headerIcon={TrendingUp}
                tooltip={termExplanations["Ingående moms"]}
            />
        </StatCardGrid>
    )
}
