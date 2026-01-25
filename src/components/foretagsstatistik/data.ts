import {
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

// MOCK DATA (Migrated from rapporter/constants.ts)

// Monthly revenue data
export const monthlyRevenue = [
    { month: "Jan", revenue: 142000, expenses: 98000, profit: 44000 },
    { month: "Feb", revenue: 156000, expenses: 112000, profit: 44000 },
    { month: "Mar", revenue: 148000, expenses: 105000, profit: 43000 },
    { month: "Apr", revenue: 165000, expenses: 118000, profit: 47000 },
    { month: "Maj", revenue: 172000, expenses: 125000, profit: 47000 },
    { month: "Jun", revenue: 158000, expenses: 108000, profit: 50000 },
    { month: "Jul", revenue: 134000, expenses: 95000, profit: 39000 },
    { month: "Aug", revenue: 145000, expenses: 102000, profit: 43000 },
    { month: "Sep", revenue: 168000, expenses: 120000, profit: 48000 },
    { month: "Okt", revenue: 175000, expenses: 128000, profit: 47000 },
    { month: "Nov", revenue: 162000, expenses: 115000, profit: 47000 },
    { month: "Dec", revenue: 125000, expenses: 88000, profit: 37000 },
]

// Expense categories
export const expenseCategories = [
    { category: "Personal", amount: 520000, percentage: 37 },
    { category: "Lokalkostnader", amount: 180000, percentage: 13 },
    { category: "Marknadsföring", amount: 95000, percentage: 7 },
    { category: "IT & Teknik", amount: 125000, percentage: 9 },
    { category: "Övriga kostnader", amount: 500000, percentage: 34 },
]
