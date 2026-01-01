// ============================================
// Payroll - Shared Constants & Data
// ============================================

import {
    FileText,
    Percent,
    Users,
    Car,
    Gift,
    type LucideIcon
} from "lucide-react"
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
    icon: LucideIcon
    feature: FeatureKey | null
}

export const allTabs: PayrollTabConfig[] = [
    { id: "lonebesked", label: "Lönekörning", icon: FileText, feature: 'lonebesked' },
    { id: "benefits", label: "Förmåner", icon: Gift, feature: 'lonebesked' }, // Grouped with payroll/lonebesked feature for now
    { id: "team", label: "Team & Rapportering", icon: Users, feature: null }, // Team tab
    { id: "egenavgifter", label: "Egenavgifter", icon: Percent, feature: 'egenavgifter' },
    { id: "delagaruttag", label: "Delägaruttag", icon: Users, feature: 'delagaruttag' },
]

// Payslip data
export const payslips = [
    { id: 1, employee: "Anna Andersson", period: "December 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "pending" },
    { id: 2, employee: "Erik Eriksson", period: "December 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "pending" },
    { id: 3, employee: "Anna Andersson", period: "November 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "sent" },
    { id: 4, employee: "Erik Eriksson", period: "November 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "sent" },
    { id: 5, employee: "Anna Andersson", period: "Oktober 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "sent" },
    { id: 6, employee: "Erik Eriksson", period: "Oktober 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "sent" },
]

// AGI reports data
export const agiReports = [
    { period: "December 2024", dueDate: "12 jan 2025", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "pending" },
    { period: "November 2024", dueDate: "12 dec 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
    { period: "Oktober 2024", dueDate: "12 nov 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
    { period: "September 2024", dueDate: "12 okt 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
]

// Dividend history data
export const dividendHistory = [
    { year: "2024", amount: 150000, taxRate: "20%", tax: 30000, netAmount: 120000, status: "planned" },
    { year: "2023", amount: 120000, taxRate: "20%", tax: 24000, netAmount: 96000, status: "paid" },
    { year: "2022", amount: 100000, taxRate: "20%", tax: 20000, netAmount: 80000, status: "paid" },
    { year: "2021", amount: 95000, taxRate: "20%", tax: 19000, netAmount: 76000, status: "paid" },
    { year: "2020", amount: 80000, taxRate: "20%", tax: 16000, netAmount: 64000, status: "paid" },
    { year: "2019", amount: 75000, taxRate: "20%", tax: 15000, netAmount: 60000, status: "paid" },
    { year: "2018", amount: 60000, taxRate: "20%", tax: 12000, netAmount: 48000, status: "paid" },
]

// K10 declarations data
export const k10Declarations = [
    { year: "2024", status: "draft", deadline: "2025-05-02", gransbelopp: 195250, usedAmount: 150000, savedAmount: 45250 },
    { year: "2023", status: "submitted", deadline: "2024-05-02", gransbelopp: 187550, usedAmount: 120000, savedAmount: 67550 },
    { year: "2022", status: "submitted", deadline: "2023-05-02", gransbelopp: 177100, usedAmount: 100000, savedAmount: 77100 },
]

// Employee list for payroll
export const employees = [
    { id: "anna", name: "Anna Andersson", role: "VD", lastSalary: 45000 },
    { id: "erik", name: "Erik Eriksson", role: "Utvecklare", lastSalary: 40000 },
]
