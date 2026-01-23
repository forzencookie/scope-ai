import { AlertTriangle } from "lucide-react"
import { SectionCard } from "@/components/ui/section-card"

export function RulesCard() {
    return (
        <SectionCard
            icon={AlertTriangle}
            title="3:12-reglerna"
            description="Som fåmansföretagare gäller särskilda regler för utdelning. Utdelning inom gränsbeloppet beskattas med 20% kapitalskatt. Utdelning över gränsbeloppet beskattas som tjänst."
            variant="warning"
        />
    )
}
