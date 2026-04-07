"use client"

/**
 * Test page: Rapporter (Reports)
 *
 * Data display: report listing grouped by category (löpande, deklarationer, bokslut).
 * Each report is clickable → navigates to AI chat in production.
 * Also shows "Senaste rapporter" section with recent generated reports.
 */

import Link from "next/link"
import {
    ArrowLeft,
    TrendingUp,
    Scale,
    Receipt,
    Send,
    Users,
    PieChart,
    Calculator,
    BookOpen,
    FileBarChart,
    ChevronRight,
    FileText,
    Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Report definitions (mirrors production reports-page.tsx)
// ---------------------------------------------------------------------------

type ReportCategory = "lopande" | "deklarationer" | "bokslut"

interface ReportItem {
    id: string
    label: string
    description: string
    icon: LucideIcon
    category: ReportCategory
}

const REPORTS: ReportItem[] = [
    // Löpande
    { id: "resultatrakning", label: "Resultaträkning", description: "Intäkter och kostnader för vald period", icon: TrendingUp, category: "lopande" },
    { id: "balansrakning", label: "Balansräkning", description: "Tillgångar, skulder och eget kapital", icon: Scale, category: "lopande" },
    { id: "momsdeklaration", label: "Momsdeklaration", description: "Moms att betala eller få tillbaka", icon: Receipt, category: "lopande" },
    // Deklarationer
    { id: "inkomstdeklaration", label: "Inkomstdeklaration", description: "Årlig deklaration till Skatteverket", icon: Send, category: "deklarationer" },
    { id: "agi", label: "AGI", description: "Arbetsgivardeklaration på individnivå", icon: Users, category: "deklarationer" },
    { id: "k10", label: "K10", description: "Gränsbelopp och kvalificerade andelar", icon: PieChart, category: "deklarationer" },
    { id: "egenavgifter", label: "Egenavgifter", description: "Beräkning av egenavgifter för enskild firma", icon: Calculator, category: "deklarationer" },
    // Bokslut
    { id: "arsredovisning", label: "Årsredovisning", description: "Fullständig årsredovisning (K2/K3)", icon: BookOpen, category: "bokslut" },
    { id: "arsbokslut", label: "Årsbokslut", description: "Förenklat årsbokslut med periodiseringar", icon: FileBarChart, category: "bokslut" },
]

const CATEGORY_LABELS: Record<ReportCategory, string> = {
    lopande: "Löpande rapporter",
    deklarationer: "Deklarationer",
    bokslut: "Bokslut",
}

const CATEGORY_ORDER: ReportCategory[] = ["lopande", "deklarationer", "bokslut"]

// ---------------------------------------------------------------------------
// Recent reports (mock)
// ---------------------------------------------------------------------------

interface RecentReport {
    id: string
    label: string
    period: string
    generatedAt: string
}

const RECENT_REPORTS: RecentReport[] = [
    { id: "rr1", label: "Resultaträkning", period: "Q1 2026", generatedAt: "2 apr" },
    { id: "rr2", label: "Momsdeklaration", period: "Mars 2026", generatedAt: "1 apr" },
    { id: "rr3", label: "AGI", period: "Mars 2026", generatedAt: "28 mar" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TestRapporterPage() {
    const grouped = CATEGORY_ORDER.map(cat => ({
        category: cat,
        reports: REPORTS.filter(r => r.category === cat),
    }))

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui/read-only" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Read Only UIs
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rapporter</h1>
                    <p className="text-sm text-muted-foreground mt-1">Generera rapporter och deklarationer via Scooby.</p>
                </div>

                {/* Grouped report rows */}
                <div className="space-y-6">
                    {grouped.map(({ category, reports }) => (
                        <div key={category}>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-1">
                                {CATEGORY_LABELS[category]}
                            </h3>
                            <div>
                                {reports.map((report) => {
                                    const Icon = report.icon
                                    return (
                                        <button
                                            key={report.id}
                                            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                                        >
                                            <div className="h-9 w-9 shrink-0 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium">{report.label}</p>
                                                <p className="text-xs text-muted-foreground truncate">{report.description}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-b-2 border-border/60" />

                {/* Recent reports */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Senaste rapporter</h3>

                    {RECENT_REPORTS.length > 0 ? (
                        <div className="space-y-1">
                            {RECENT_REPORTS.map((rr) => (
                                <div key={rr.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{rr.label}</p>
                                        <p className="text-xs text-muted-foreground">{rr.period}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                                        <Clock className="h-3 w-3" />
                                        {rr.generatedAt}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Inga genererade rapporter ännu.</p>
                            <p className="text-xs mt-1">Be Scooby att generera en rapport så visas den här.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
