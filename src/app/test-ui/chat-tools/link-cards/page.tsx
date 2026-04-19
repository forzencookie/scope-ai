"use client"

import Link from "next/link"
import { ArrowLeft, ChevronRight, FileText, type LucideIcon, TrendingUp, Scale, Receipt, PieChart, Calculator, BookOpen, Send, FileBarChart } from "lucide-react"
import { cn } from "@/lib/utils"

interface LinkCard {
    title: string
    subtitle: string
    icon: LucideIcon
    iconBg: string
    iconColor: string
    href: string
}

const linkCards: LinkCard[] = [
    { title: "Resultaträkning Q1 2026", subtitle: "Intäkter 485 000 kr · Kostnader 312 000 kr · Resultat 173 000 kr", icon: TrendingUp, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-600 dark:text-emerald-500", href: "/test-ui/ai-overlays/walkthroughs/resultatrakning" },
    { title: "Balansräkning 2026-03-31", subtitle: "Tillgångar 1 245 000 kr · Skulder 892 000 kr · EK 353 000 kr", icon: Scale, iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-500", href: "/test-ui/ai-overlays/walkthroughs/balansrakning" },
    { title: "Momsdeklaration mars 2026", subtitle: "Utgående 24 500 kr · Ingående 12 050 kr · Att betala 12 450 kr", icon: Receipt, iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-500", href: "/test-ui/ai-overlays/walkthroughs/momsdeklaration" },
    { title: "K10-beräkning 2025", subtitle: "Gränsbelopp 187 550 kr · Utdelningsutrymme 187 550 kr", icon: PieChart, iconBg: "bg-purple-500/10", iconColor: "text-purple-600 dark:text-purple-500", href: "/test-ui/ai-overlays/walkthroughs/k10" },
    { title: "Egenavgifter 2026", subtitle: "Årsresultat 485 000 kr · Avgifter 152 163 kr · Sats 31,42%", icon: Calculator, iconBg: "bg-amber-500/10", iconColor: "text-amber-600 dark:text-amber-500", href: "/test-ui/ai-overlays/walkthroughs/egenavgifter" },
    { title: "AGI mars 2026", subtitle: "3 anställda · Bruttolön 125 000 kr · Arbetsgivaravgift 39 275 kr", icon: Send, iconBg: "bg-blue-500/10", iconColor: "text-blue-600 dark:text-blue-500", href: "/test-ui/ai-overlays/walkthroughs/agi" },
    { title: "Inkomstdeklaration 2025", subtitle: "Skattepliktig inkomst 612 000 kr · Slutlig skatt 198 400 kr", icon: FileText, iconBg: "bg-red-500/10", iconColor: "text-red-600 dark:text-red-500", href: "/test-ui/ai-overlays/walkthroughs/inkomstdeklaration" },
    { title: "Årsredovisning 2025", subtitle: "K2 · Förvaltningsberättelse + Resultat + Balans + Noter", icon: BookOpen, iconBg: "bg-indigo-500/10", iconColor: "text-indigo-600 dark:text-indigo-500", href: "/test-ui/ai-overlays/walkthroughs/arsredovisning" },
]

export default function LinkCardsPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-3xl mx-auto px-6 pt-6">
                <Link
                    href="/test-ui/chat-tools"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Chat Tools
                </Link>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight mb-1">Link Cards</h1>
                    <p className="text-sm text-muted-foreground mb-8">
                        Kort som öppnar en overlay — Scooby visar dessa när ett dokument eller en rapport är klar att granska. Klick öppnar walkthrough eller dokumentoverlay.
                    </p>

                    <div className="space-y-2">
                        {linkCards.map((card, i) => {
                            const Icon = card.icon
                            return (
                                <Link
                                    key={i}
                                    href={card.href}
                                    className="w-full max-w-md flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-border/60"
                                >
                                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", card.iconBg)}>
                                        <Icon className={cn("h-4 w-4", card.iconColor)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">{card.title}</p>
                                        <p className="text-xs text-muted-foreground truncate">{card.subtitle}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground shrink-0 transition-colors" />
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
