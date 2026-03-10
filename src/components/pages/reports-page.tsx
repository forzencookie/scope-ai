"use client"

import { Suspense, useMemo } from "react"
import {
    Loader2,
    FileText,
    ArrowRight,
} from "lucide-react"
import { useCompany } from "@/providers/company-provider"
import type { FeatureKey } from "@/lib/company-types"
import type { AIPageType } from "@/lib/ai/context"
import { useNavigateToAIChat, getDefaultAIContext } from "@/lib/ai/context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shared"

// Report card definitions — maps feature keys to AI page types for "Generera" action
interface ReportCard {
    id: string
    label: string
    description: string
    color: string
    feature: FeatureKey
    aiPageType: AIPageType
}

const allReports: ReportCard[] = [
    {
        id: "resultatrakning",
        label: "Resultaträkning",
        description: "Intäkter och kostnader för vald period",
        color: "bg-emerald-500",
        feature: "resultatrakning",
        aiPageType: "resultatrakning",
    },
    {
        id: "balansrakning",
        label: "Balansräkning",
        description: "Tillgångar, skulder och eget kapital",
        color: "bg-blue-500",
        feature: "balansrakning",
        aiPageType: "balansrakning",
    },
    {
        id: "momsdeklaration",
        label: "Momsdeklaration",
        description: "Moms att betala eller få tillbaka",
        color: "bg-purple-500",
        feature: "momsdeklaration",
        aiPageType: "moms",
    },
    {
        id: "inkomstdeklaration",
        label: "Inkomstdeklaration",
        description: "Årlig deklaration till Skatteverket",
        color: "bg-amber-500",
        feature: "inkomstdeklaration",
        aiPageType: "inkomstdeklaration",
    },
    {
        id: "agi",
        label: "AGI",
        description: "Arbetsgivardeklaration på individnivå",
        color: "bg-emerald-500",
        feature: "agi",
        aiPageType: "agi",
    },
    {
        id: "arsredovisning",
        label: "Årsredovisning",
        description: "Fullständig årsredovisning (K2/K3)",
        color: "bg-indigo-500",
        feature: "arsredovisning",
        aiPageType: "arsredovisning",
    },
    {
        id: "arsbokslut",
        label: "Årsbokslut",
        description: "Förenklat årsbokslut med periodiseringar",
        color: "bg-indigo-400",
        feature: "arsbokslut",
        aiPageType: "arsbokslut",
    },
    {
        id: "k10",
        label: "K10",
        description: "Gränsbelopp och kvalificerade andelar",
        color: "bg-purple-400",
        feature: "k10",
        aiPageType: "k10",
    },
    {
        id: "egenavgifter",
        label: "Egenavgifter",
        description: "Beräkning av egenavgifter för enskild firma",
        color: "bg-amber-500",
        feature: "egenavgifter",
        aiPageType: "lonebesked", // Uses lonebesked AI type as closest match
    },
]

function ReportsPageContent() {
    const { hasFeature } = useCompany()
    const navigateToAI = useNavigateToAIChat()

    const availableReports = useMemo(() => {
        return allReports.filter(report => hasFeature(report.feature))
    }, [hasFeature])

    const handleGenerate = (report: ReportCard) => {
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
                    {availableReports.map((report) => (
                        <Card key={report.id} className="group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${report.color}`} />
                                        <CardTitle className="text-base">{report.label}</CardTitle>
                                    </div>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <CardDescription className="text-sm">
                                    {report.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                                    onClick={() => handleGenerate(report)}
                                >
                                    Generera
                                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Recent Reports Section */}
                {availableReports.length > 0 && (
                    <div className="max-w-5xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Senaste rapporter
                            </h3>
                        </div>

                        <div className="rounded-lg border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider text-left">
                                        <th className="px-4 py-2.5 font-medium">Rapport</th>
                                        <th className="px-4 py-2.5 font-medium">Period</th>
                                        <th className="px-4 py-2.5 font-medium text-right">Skapad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {/* Mocked data for now, would be fetched from activity log in production */}
                                    <tr className="hover:bg-muted/50 cursor-pointer group">
                                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                            Resultaträkning
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">Jan 2026 – Mar 2026</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground group-hover:text-foreground">
                                            Idag 14:32
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-muted/50 cursor-pointer group">
                                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                            Balansräkning
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">Per 2026-03-10</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground group-hover:text-foreground">
                                            Idag 10:15
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-muted/50 cursor-pointer group">
                                        <td className="px-4 py-3 font-medium flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                            Momsdeklaration
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">Februari 2026</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground group-hover:text-foreground">
                                            Igår 16:45
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div className="p-3 bg-muted/20 text-center border-t">
                                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                                    Visa hela arkivet
                                </Button>
                            </div>
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
