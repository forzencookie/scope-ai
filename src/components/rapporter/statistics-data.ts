import {
    Shield,
    Droplets,
    Scale,
    Percent,
    type LucideIcon
} from "lucide-react"
import type { ChartConfig } from "@/components/ui/chart"

// Swedish accounting term explanations
export const termExplanations: Record<string, string> = {
    "Soliditet": "Andel eget kapital i förhållande till totala tillgångar. Högre = stabilare ekonomi. Över 30% anses bra.",
    "Kassalikviditet": "Förmåga att betala kortfristiga skulder med likvida medel. Över 100% = kan täcka alla kortsiktiga skulder.",
    "Skuldsättningsgrad": "Skulder delat med eget kapital. Lägre = mindre finansiell risk.",
    "Vinstmarginal": "Resultat delat med omsättning i procent. Visar hur stor del av försäljningen som blir vinst.",
}

// Financial health KPIs
export interface FinancialKPI {
    label: string
    value: string
    change: string
    positive: boolean
    icon: LucideIcon
    subtitle: string
}

// Expense categories
export interface ExpenseCategory {
    category: string
    amount: number
    percentage: number
    icon: LucideIcon
    color: string
}

// Chart configurations
export const revenueChartConfig = {
    intäkter: {
        label: "Intäkter",
        color: "var(--chart-1)",
    },
    kostnader: {
        label: "Kostnader",
        color: "var(--chart-5)",
    },
    resultat: {
        label: "Resultat",
        color: "var(--chart-3)",
    },
} satisfies ChartConfig

export const barChartConfig = {
    intäkter: {
        label: "Intäkter",
        color: "var(--chart-1)",
    },
    kostnader: {
        label: "Kostnader",
        color: "var(--chart-5)",
    },
} satisfies ChartConfig

export const transactionPieConfig = {
    bokförda: { label: "Bokförda", color: "var(--chart-1)" },
    attBokföra: { label: "Att bokföra", color: "var(--chart-2)" },
    saknarUnderlag: { label: "Saknar underlag", color: "var(--chart-5)" },
} satisfies ChartConfig

export const invoicePieConfig = {
    betalda: { label: "Betalda", color: "var(--chart-1)" },
    förfallna: { label: "Förfallna", color: "var(--chart-5)" },
    utkast: { label: "Utkast", color: "var(--chart-4)" },
} satisfies ChartConfig

// Expense pie chart colors and config
export const expensePieColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--muted-foreground)"
]

export const expensePieConfig = {
    personal: { label: "Personal", color: "var(--chart-1)" },
    lokalkostnader: { label: "Lokalkostnader", color: "var(--chart-2)" },
    material: { label: "Material & Varor", color: "var(--chart-3)" },
    it: { label: "IT & Programvara", color: "var(--chart-4)" },
    resor: { label: "Resor & Representation", color: "var(--chart-5)" },
    övrigt: { label: "Övriga kostnader", color: "var(--muted-foreground)" },
} satisfies ChartConfig

// Time range options
export const timeRangeOptions = [
    { value: "3m", label: "Senaste 3 månader" },
    { value: "6m", label: "Senaste 6 månader" },
    { value: "12m", label: "Senaste 12 månader" },
    { value: "2y", label: "Senaste 2 år" },
    { value: "4y", label: "Senaste 4 år" },
    { value: "6y", label: "Senaste 6 år" },
]
