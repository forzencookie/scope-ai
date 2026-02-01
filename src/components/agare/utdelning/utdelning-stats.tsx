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
                value={stats.planerad > 0 ? formatCurrency(stats.planerad) : "Ingen planerad"}
                subtitle={stats.planerad > 0
                    ? (stats.planerad <= stats.gransbelopp ? "Inom gränsbeloppet" : "Överstiger gränsbeloppet")
                    : "Registrera via knappen ovan"
                }
                headerIcon={DollarSign}
                tooltip={termExplanations["Utdelning"]}
            />
            <StatCard
                label="Skatt på utdelning"
                value={stats.skatt > 0 ? formatCurrency(stats.skatt) : "–"}
                subtitle={stats.skatt > 0 ? "20% kapitalskatt" : "Ingen utdelning planerad"}
                headerIcon={Calculator}
            />
        </StatCardGrid>
    )
}
