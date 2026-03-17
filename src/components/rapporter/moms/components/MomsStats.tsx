import { Calendar, Wallet, TrendingUp } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { ResponsiveCurrency } from "@/components/ui/responsive-currency"
import { formatCurrency } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"
import { termExplanations } from "@/components/rapporter/constants"
import { Skeleton } from "@/components/ui/skeleton"

interface MomsTextContent {
    reports: {
        nextDeclaration: string
        vatToPay: string
        salesVat: string
        inputVat: string
        deductible: string
    }
}

interface MomsStatsProps {
    stats: {
        nextPeriod: string
        deadline: string
        salesVat: number
        inputVat: number
        netVat: number
    }
    text: MomsTextContent
    isLoading?: boolean
}

export function MomsStats({ stats, text, isLoading }: MomsStatsProps) {
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
