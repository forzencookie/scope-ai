import { TrendingUp, DollarSign, Calculator } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { termExplanations } from "@/components/loner/constants"
import { formatCurrency } from "@/lib/utils"

interface UtdelningStatsProps {
    stats: {
        gransbelopp: number
        planerad: number
        skatt: number
    }
}

export function UtdelningStats({ stats }: UtdelningStatsProps) {
    return (
        <StatCardGrid columns={3}>
            <StatCard
                label={`Gränsbelopp ${new Date().getFullYear()}`}
                value={`${formatCurrency(stats.gransbelopp)}`}
                subtitle="Schablonmetoden (2,75 IBB)"
                headerIcon={TrendingUp}
                tooltip={termExplanations["Gränsbelopp"]}
            />
            <StatCard
                label="Planerad utdelning"
                value={`${formatCurrency(stats.planerad)}`}
                subtitle={stats.planerad <= stats.gransbelopp ? "Inom gränsbeloppet" : "Överstiger gränsbeloppet"}
                headerIcon={DollarSign}
                tooltip={termExplanations["Utdelning"]}
            />
            <StatCard
                label="Skatt på utdelning"
                value={`${formatCurrency(stats.skatt)}`}
                subtitle="20% kapitalskatt"
                headerIcon={Calculator}
            />
        </StatCardGrid>
    )
}
