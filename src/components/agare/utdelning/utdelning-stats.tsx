import { DollarSign, FileCheck, Landmark, Scale } from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { ResponsiveCurrency } from "@/components/ui/responsive-currency"
import { termExplanations } from "@/components/loner/constants"

interface UtdelningStatsProps {
    stats: {
        gransbelopp: number
        planerad: number
        beslutad: number
        bokford: number
        skatt: number
        distributableEquity?: number
    }
}

export function UtdelningStats({ stats }: UtdelningStatsProps) {
    const totalActive = stats.planerad + stats.beslutad
    const isOverLimit = totalActive > stats.gransbelopp

    return (
        <StatCardGrid columns={4}>
            <StatCard
                label="Fritt eget kapital"
                value={stats.distributableEquity != null
                    ? <ResponsiveCurrency amount={stats.distributableEquity} />
                    : "–"
                }
                subtitle="Utdelningsbart (ABL 17:3)"
                headerIcon={Scale}
                tooltip="Totalt eget kapital minus bundet eget kapital (aktiekapital + reservfond) plus årets resultat. Utdelningen får inte överstiga detta belopp."
            />
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
                subtitle={stats.bokford > 0
                    ? `Skatt: ~${Math.round(stats.skatt).toLocaleString('sv-SE')} kr`
                    : "Ingen bokförd utdelning"
                }
                headerIcon={Landmark}
                tooltip="Utdelning som är bokförd. Utbetalning sker via bank."
            />
        </StatCardGrid>
    )
}
