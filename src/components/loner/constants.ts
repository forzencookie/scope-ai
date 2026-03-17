// ============================================
// Payroll - Shared Constants & Data
// ============================================

//     FileText,
//     Percent,
//     Users,
//     Car,
//     Gift,
//     type LucideIcon
// } from "lucide-react"
import type { FeatureKey } from "@/lib/company-types"

// Swedish payroll term explanations
export const termExplanations: Record<string, string> = {
    "Lönebesked": "Specifikation av lönen till anställd. Visar bruttolön, skatteavdrag och nettolön.",
    "AGI": "Arbetsgivardeklaration på individnivå. Månadsvis rapport till Skatteverket om löner och skatter.",
    "Utdelning": "Vinst som betalas ut till aktieägare. I fåmansbolag gäller särskilda 3:12-regler.",
    "3:12-regler": "Skatteregler för fåmansbolag. Bestämmer hur utdelning beskattas - som kapital (30%) eller tjänst (upp till 52%).",
    "Gränsbelopp": "Max belopp du kan ta ut som kapitalinkomst (30% skatt) enligt 3:12-reglerna. Beräknas årligen.",
    "Arbetsgivaravgifter": "Avgifter arbetsgivaren betalar utöver lönen (ca 31,42%). Inkluderar pensionsavgift, sjukförsäkring m.m.",
    "Preliminärskatt": "Skatt som dras från lönen varje månad. Justeras vid deklarationen.",
    "Bruttolön": "Lön före skatteavdrag.",
    "Nettolön": "Lön efter skatteavdrag - det som betalas ut till den anställde.",
}

// Tab configuration - some tabs are feature-gated
export interface PayrollTabConfig {
    id: string
    label: string
    color: string
    feature: FeatureKey | null
}

export const allTabs: PayrollTabConfig[] = [
    { id: "lonebesked", label: "Löneöversikt", color: "bg-green-500", feature: 'lonebesked' },
    { id: "formaner", label: "Förmåner", color: "bg-orange-500", feature: 'formaner' },
    { id: "team", label: "Team", color: "bg-blue-500", feature: null },
    { id: "egenavgifter", label: "Egenavgifter", color: "bg-indigo-500", feature: 'egenavgifter' },
    { id: "delagaruttag", label: "Delägaruttag", color: "bg-rose-500", feature: 'delagaruttag' },
]

// Mock data removed. Data is now fetched from API.
