import { DollarSign, Calculator } from "lucide-react"
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
    const isOverLimit = stats.planerad > stats.gransbelopp

    return (
        <StatCardGrid columns={2}>
            <StatCard
                label="Planerad utdelning"
                value={stats.planerad > 0 ? formatCurrency(stats.planerad) : "Ingen planerad"}
                subtitle={stats.planerad > 0
                    ? (isOverLimit ? "Överstiger gränsbeloppet" : "Inom gränsbeloppet")
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
