"use client"

import Link from "next/link"
import { Sparkles, Calculator, FileText, ArrowLeft, BarChart3, Receipt, LayoutGrid, ShieldCheck, FileStack, Users, PieChart, Building2, Play, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

const walkthroughPages = [
    { href: "/test-ui/walkthroughs/scenario", label: "Scenario: Månadsavslut", icon: Play, description: "Komplett konversation — balanskontroll → lönebesked → bokföring → AGI walkthrough", color: "from-green-500/20 to-green-500/5", iconColor: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-900/40" },
    { href: "/test-ui/walkthroughs/cards", label: "Alla kort (Layer 1)", icon: LayoutGrid, description: "Varje korttyp som Scooby visar inline i chatten — 22 display + 8 inline", color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
    { href: "/test-ui/walkthroughs/confirmation", label: "Bekräftelse & Interaktion", icon: ShieldCheck, description: "Godkännande-UI, åtgärdskvitton och batchbekräftelser", color: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-cyan-100 dark:bg-cyan-900/40" },
    { href: "/test-ui/walkthroughs/documents", label: "Dokument & Audit", icon: FileStack, description: "Lönebesked, protokoll, aktiebok + balanskontroll, resultatkontroll", color: "from-teal-500/20 to-teal-500/5", iconColor: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/40" },
    { href: "/test-ui/walkthroughs/agi", label: "Arbetsgivardeklaration (AGI)", icon: Users, description: "Block Renderer — Individuppgifter med härledning från lönekörningar", color: "from-pink-500/20 to-pink-500/5", iconColor: "text-pink-600 dark:text-pink-400", iconBg: "bg-pink-100 dark:bg-pink-900/40" },
    { href: "/test-ui/walkthroughs/k10", label: "K10 — Kvalificerade andelar", icon: PieChart, description: "Block Renderer — Gränsbelopp, 3:12-regler, härlett från aktiebok och löneregister", color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/40" },
    { href: "/test-ui/walkthroughs/inkomstdeklaration", label: "Inkomstdeklaration 2 (INK2)", icon: Building2, description: "Block Renderer — Skattemässiga justeringar med verifikationer som källa", color: "from-slate-500/20 to-slate-500/5", iconColor: "text-slate-600 dark:text-slate-400", iconBg: "bg-slate-100 dark:bg-slate-900/40" },
    { href: "/test-ui/walkthroughs/arsredovisning", label: "Årsredovisning", icon: BookOpen, description: "Block Renderer — Komplett K2-årsredovisning med provenance från bokföring, aktiebok, styrelseprotokoll", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/40" },
    { href: "/test-ui/walkthroughs/egenavgifter", label: "Egenavgifter", icon: Calculator, description: "Block Renderer - Visar beräkning av preliminärskatt och egenavgifter", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    { href: "/test-ui/walkthroughs/momsdeklaration", label: "Momsdeklaration", icon: FileText, description: "Document Overlay - Deklaration och kontroll av transaktioner", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { href: "/test-ui/walkthroughs/resultatrakning", label: "Resultaträkning", icon: BarChart3, description: "Block Renderer - Interaktiv månatlig resultatöversikt", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
    { href: "/test-ui/walkthroughs/balansrakning", label: "Balansräkning", icon: Receipt, description: "Block Renderer - Tillgångar, skulder och eget kapital över tid", color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
]

export default function WalkthroughsIndex() {
    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link
                    href="/test-ui"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Tillbaka
                </Link>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Walkthroughs & Overlays</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Här är alla olika godkännande-overlays och block renderers som Scooby ritar ut för olika use-cases.
                    </p>
                </div>

                <div className="grid gap-2">
                    {walkthroughPages.map((page) => {
                        const Icon = page.icon
                        return (
                            <Link
                                key={page.href}
                                href={page.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3.5 rounded-xl",
                                    "bg-gradient-to-r",
                                    page.color,
                                    "hover:scale-[1.01] active:scale-[0.995]",
                                    "transition-all duration-200 group",
                                    "border border-transparent hover:border-border/40"
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                    "transition-all duration-200 group-hover:scale-110 group-hover:shadow-md",
                                    page.iconBg
                                )}>
                                    <Icon className={cn("h-5 w-5", page.iconColor)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">{page.label}</p>
                                    <p className="text-xs text-muted-foreground">{page.description}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
