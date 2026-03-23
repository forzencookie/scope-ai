"use client"

import { Suspense, useMemo } from "react"
import {
    Loader2,
    FileText,
    ChevronRight,
    TrendingUp,
    Scale,
    Receipt,
    Send,
    Users,
    BookOpen,
    FileBarChart,
    PieChart,
    Calculator,
} from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import type { AIPageType } from "@/lib/ai/context"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { PageHeader } from "@/components/shared"
import type { LucideIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Report definitions
// ---------------------------------------------------------------------------

interface ReportItem {
    id: string
    label: string
    description: string
    icon: LucideIcon
    feature: FeatureKey
    aiPageType: AIPageType
    category: "lopande" | "deklarationer" | "bokslut"
}

const allReports: ReportItem[] = [
    // Löpande rapporter
    {
        id: "resultatrakning",
        label: "Resultaträkning",
        description: "Intäkter och kostnader för vald period",
        icon: TrendingUp,
        feature: "resultatrakning",
        aiPageType: "resultatrakning",
        category: "lopande",
    },
    {
        id: "balansrakning",
        label: "Balansräkning",
        description: "Tillgångar, skulder och eget kapital",
        icon: Scale,
        feature: "balansrakning",
        aiPageType: "balansrakning",
        category: "lopande",
    },
    {
        id: "momsdeklaration",
        label: "Momsdeklaration",
        description: "Moms att betala eller få tillbaka",
        icon: Receipt,
        feature: "momsdeklaration",
        aiPageType: "moms",
        category: "lopande",
    },
    // Deklarationer
    {
        id: "inkomstdeklaration",
        label: "Inkomstdeklaration",
        description: "Årlig deklaration till Skatteverket",
        icon: Send,
        feature: "inkomstdeklaration",
        aiPageType: "inkomstdeklaration",
        category: "deklarationer",
    },
    {
        id: "agi",
        label: "AGI",
        description: "Arbetsgivardeklaration på individnivå",
        icon: Users,
        feature: "agi",
        aiPageType: "agi",
        category: "deklarationer",
    },
    {
        id: "k10",
        label: "K10",
        description: "Gränsbelopp och kvalificerade andelar",
        icon: PieChart,
        feature: "k10",
        aiPageType: "k10",
        category: "deklarationer",
    },
    {
        id: "egenavgifter",
        label: "Egenavgifter",
        description: "Beräkning av egenavgifter för enskild firma",
        icon: Calculator,
        feature: "egenavgifter",
        aiPageType: "lonebesked",
        category: "deklarationer",
    },
    // Bokslut
    {
        id: "arsredovisning",
        label: "Årsredovisning",
        description: "Fullständig årsredovisning (K2/K3)",
        icon: BookOpen,
        feature: "arsredovisning",
        aiPageType: "arsredovisning",
        category: "bokslut",
    },
    {
        id: "arsbokslut",
        label: "Årsbokslut",
        description: "Förenklat årsbokslut med periodiseringar",
        icon: FileBarChart,
        feature: "arsbokslut",
        aiPageType: "arsbokslut",
        category: "bokslut",
    },
]

const categoryLabels: Record<ReportItem["category"], string> = {
    lopande: "Löpande rapporter",
    deklarationer: "Deklarationer",
    bokslut: "Bokslut",
}

const categoryOrder: ReportItem["category"][] = ["lopande", "deklarationer", "bokslut"]

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function ReportRow({ report, onGenerate }: { report: ReportItem; onGenerate: (r: ReportItem) => void }) {
    const Icon = report.icon
    return (
        <button
            onClick={() => onGenerate(report)}
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
}

function ReportsPageContent() {
    const { hasFeature } = useCompany()
    const navigateToAI = useNavigateToAIChat()

    const availableReports = useMemo(() => {
        return allReports.filter(report => hasFeature(report.feature))
    }, [hasFeature])

    const groupedReports = useMemo(() => {
        const groups: Partial<Record<ReportItem["category"], ReportItem[]>> = {}
        for (const report of availableReports) {
            if (!groups[report.category]) groups[report.category] = []
            groups[report.category]!.push(report)
        }
        return groups
    }, [availableReports])

    const handleGenerate = (report: ReportItem) => {
        const context = getDefaultAIContext(report.aiPageType, true)
        navigateToAI(context)
    }

    return (
        <div className="flex flex-col min-h-svh">
            <div className="px-4 md:px-6 pt-6">
                <PageHeader
                    title="Rapporter"
                    subtitle="Generera rapporter och deklarationer via Scooby"
                />
            </div>

            <main className="flex-1 p-4 md:p-6 space-y-8">
                {/* Grouped report rows */}
                <div className="w-full space-y-6">
                    {categoryOrder.map((category) => {
                        const reports = groupedReports[category]
                        if (!reports?.length) return null
                        return (
                            <div key={category}>
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-1">
                                    {categoryLabels[category]}
                                </h3>
                                <div>
                                    {reports.map((report) => (
                                        <ReportRow key={report.id} report={report} onGenerate={handleGenerate} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Recent Reports Section — will be populated from activity log */}
                {availableReports.length > 0 && (
                    <div className="w-full space-y-4">
                        <div className="border-b-2 border-border/60" />
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Senaste rapporter
                        </h3>
                        <div className="py-8 text-center text-muted-foreground">
                            <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">Inga genererade rapporter ännu.</p>
                            <p className="text-xs mt-1">Be Scooby att generera en rapport så visas den här.</p>
                        </div>
                    </div>
                )}

                {availableReports.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p>Inga rapporter tillgängliga för din bolagsform.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

function ReportsPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar rapporter...
        </div>
    )
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<ReportsPageLoading />}>
            <ReportsPageContent />
        </Suspense>
    )
}
