import { Calendar, Wallet, Users } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { formatCurrency } from "@/lib/utils"

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
                value={formatCurrency(stats.tax + stats.contributions)}
                subtitle={`${formatCurrency(stats.tax)} skatt, ${formatCurrency(stats.contributions)} arbetsgivaravg.`}
                headerIcon={Wallet}
            />
            <StatCard
                label="Anställda"
                value={`${stats.employees}`}
                subtitle={`Bruttolön: ${formatCurrency(stats.totalSalary)}`}
                headerIcon={Users}
            />
        </StatCardGrid>
    )
}
