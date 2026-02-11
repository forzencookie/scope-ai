import { Calendar, Wallet, Users } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { ResponsiveCurrency } from "@/components/ui/responsive-currency"
import { formatCurrencyCompact } from "@/lib/formatters"

interface AgiStatsProps {
    stats: {
        nextPeriod: string;
        deadline: string;
        tax: number;
        contributions: number;
        totalSalary: number;
        employees: number;
    }
}

export function AgiStats({ stats }: AgiStatsProps) {
    return (
        <StatCardGrid columns={3}>
            <StatCard
                label="Kommande period"
                value={stats.nextPeriod}
                subtitle={stats.deadline}
                headerIcon={Calendar}
            />
            <StatCard
                label="Att betala"
                value={<ResponsiveCurrency amount={stats.tax + stats.contributions} />}
                subtitle={`${formatCurrencyCompact(stats.tax)} skatt, ${formatCurrencyCompact(stats.contributions)} avg.`}
                headerIcon={Wallet}
            />
            <StatCard
                label="Anställda"
                value={`${stats.employees}`}
                subtitle={`Bruttolön: ${formatCurrencyCompact(stats.totalSalary)}`}
                headerIcon={Users}
            />
        </StatCardGrid>
    )
}
