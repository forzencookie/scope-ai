// ============================================
// Reports - Shared Constants & Data
// ============================================

import type { CompanyType } from "@/lib/company-types"
import {
    Calculator,
    TrendingUp,
    Scale,
    Send,
    FileBarChart,
    type LucideIcon
} from "lucide-react"

// Swedish tax/accounting term explanations
export const termExplanations: Record<string, string> = {
    "Momsdeklaration": "Rapport till Skatteverket om moms (mervärdesskatt) du samlat in och betalat. Lämnas månads- eller kvartalsvis.",
    "Inkomstdeklaration": "Årlig rapport till Skatteverket om företagets inkomster och kostnader. Används för att beräkna inkomstskatt.",
    "Årsredovisning": "Sammanfattning av företagets ekonomi för ett räkenskapsår. Obligatorisk för aktiebolag.",
    "Utgående moms": "Moms du tar ut av dina kunder vid försäljning (25%, 12% eller 6%).",
    "Ingående moms": "Moms du betalar på inköp som du får dra av.",
    "Moms att betala": "Skillnaden mellan utgående och ingående moms. Betalas till Skatteverket.",
    "INK2": "Inkomstdeklaration 2 - skatteblanketten för aktiebolag.",
    "Rörelseresultat": "Vinst/förlust från kärnverksamheten, före finansiella poster och skatt.",
    "3:12-regler": "Regler för hur utdelning från fåmansbolag beskattas. Påverkar hur mycket du kan ta ut som kapitalinkomst.",
    "Gränsbelopp": "Max belopp du kan ta ut som kapitalinkomst (lägre skatt) enligt 3:12-reglerna.",
}

// Tab configuration - some tabs vary by company type
export interface TabConfig {
    id: string
    label: string
    icon: LucideIcon
    companyTypes: CompanyType[]
}

export const allTabs: TabConfig[] = [
    { id: "momsdeklaration", label: "Momsdeklaration", icon: Calculator, companyTypes: ['ab', 'ef', 'hb', 'kb', 'forening'] },
    { id: "resultatrakning", label: "Resultaträkning", icon: TrendingUp, companyTypes: ['ab', 'ef', 'hb', 'kb', 'forening'] },
    { id: "balansrakning", label: "Balansräkning", icon: Scale, companyTypes: ['ab', 'ef', 'hb', 'kb', 'forening'] },
    { id: "inkomstdeklaration", label: "Inkomstdeklaration", icon: Send, companyTypes: ['ab', 'ef', 'hb', 'kb', 'forening'] },
    { id: "arsredovisning", label: "Årsredovisning", icon: FileBarChart, companyTypes: ['ab', 'forening'] },
    { id: "arsbokslut", label: "Årsbokslut", icon: FileBarChart, companyTypes: ['ef', 'hb', 'kb'] },
]

// Get declaration type label based on company type
export function getDeclarationLabel(companyType: CompanyType): string {
    const labels: Record<CompanyType, string> = {
        'ab': 'INK2',
        'ef': 'NE-bilaga',
        'hb': 'INK4',
        'kb': 'INK4',
        'forening': 'INK3',
    }
    return labels[companyType]
}
