import { Calendar, Wallet, Users } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { ResponsiveCurrency } from "@/components/ui/responsive-currency"
import { formatCurrencyCompact } from "@/lib/formatters"
import { Skeleton } from "@/components/ui/skeleton"

interface AgiStatsProps {
    stats: {
        nextPeriod: string;
        deadline: string;
        tax: number;
        contributions: number;
        totalSalary: number;
        employees: number;
    }
    isLoading?: boolean
}

export function AgiStats({ stats, isLoading }: AgiStatsProps) {
    if (isLoading) {
        return (
            <StatCardGrid columns={3}>
                {Array.from({ length: 3 }).map((_, i) => (
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
