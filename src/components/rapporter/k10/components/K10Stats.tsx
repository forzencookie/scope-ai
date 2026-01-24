import { Calendar, TrendingUp, Percent, Clock } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { formatCurrency } from "@/lib/utils"
import { INVOICE_STATUS_LABELS } from "@/lib/localization"
import { K10Data } from "../use-k10-calculation"

interface K10StatsProps {
    data: K10Data
    deadline: string
}

export function K10Stats({ data, deadline }: K10StatsProps) {
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
                value={formatCurrency(data.gransbelopp)}
                subtitle="Totalt beräknat"
                headerIcon={TrendingUp}
            />
            <StatCard
                label="Utnyttjat"
                value={formatCurrency(data.totalDividends)}
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
