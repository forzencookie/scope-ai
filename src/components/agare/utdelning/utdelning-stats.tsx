import { DollarSign, FileCheck, Landmark } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { ResponsiveCurrency } from "@/components/ui/responsive-currency"
import { termExplanations } from "@/components/loner/constants"
import { formatCurrencyCompact } from "@/lib/formatters"

interface UtdelningStatsProps {
    stats: {
        gransbelopp: number
        planerad: number
        beslutad: number
        bokford: number
        skatt: number
    }
}

export function UtdelningStats({ stats }: UtdelningStatsProps) {
    const totalActive = stats.planerad + stats.beslutad
    const isOverLimit = totalActive > stats.gransbelopp

    return (
        <StatCardGrid columns={3}>
            <StatCard
                label="Planerad"
                value={stats.planerad > 0 ? <ResponsiveCurrency amount={stats.planerad} /> : "–"}
                subtitle={stats.planerad > 0
                    ? "Väntar på stämmobeslut"
                    : "Ingen planerad utdelning"
                }
                headerIcon={DollarSign}
                tooltip="Utdelning som är föreslagen men ännu inte beslutad på bolagsstämma."
            />
            <StatCard
                label="Beslutad"
                value={stats.beslutad > 0 ? <ResponsiveCurrency amount={stats.beslutad} /> : "–"}
                subtitle={stats.beslutad > 0
                    ? (isOverLimit ? "Överstiger gränsbeloppet!" : "Väntar på bokföring")
                    : "Ingen beslutad utdelning"
                }
                headerIcon={FileCheck}
                tooltip={termExplanations["Utdelning"]}
            />
            <StatCard
                label="Bokförd"
                value={stats.bokford > 0 ? <ResponsiveCurrency amount={stats.bokford} /> : "–"}
                subtitle={stats.bokford > 0 ? `Skatt: ${formatCurrencyCompact(Math.round(stats.bokford * 0.2))}` : "Ingen bokförd utdelning"}
                headerIcon={Landmark}
                tooltip="Utdelning som är bokförd och klar för utbetalning."
            />
        </StatCardGrid>
    )
}
