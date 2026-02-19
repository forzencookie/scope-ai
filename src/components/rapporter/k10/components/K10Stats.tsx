import { Calendar, TrendingUp, Percent, Clock } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { ResponsiveCurrency } from "@/components/ui/responsive-currency"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { K10Data } from "../use-k10-calculation"
import { Skeleton } from "@/components/ui/skeleton"

interface K10StatsProps {
    data: K10Data
    deadline: string
    isLoading?: boolean
}

export function K10Stats({ data, deadline, isLoading }: K10StatsProps) {
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
                label="Inkomstår"
                value={data.year}
                subtitle="Blankett K10"
                headerIcon={Calendar}
            />
            <StatCard
                label="Gränsbelopp"
                value={<ResponsiveCurrency amount={data.gransbelopp} />}
                subtitle="Totalt beräknat"
                headerIcon={TrendingUp}
            />
            <StatCard
                label="Utnyttjat"
                value={<ResponsiveCurrency amount={data.totalDividends} />}
                subtitle="I utdelning"
                headerIcon={Percent}
            />
            <StatCard
                label="Status"
                value={INVOICE_STATUS_LABELS.DRAFT}
                subtitle={`Deadline: ${deadline}`}
                headerIcon={Clock}
            />
        </StatCardGrid>
    )
}
