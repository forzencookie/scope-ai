"use client"

import Link from "next/link"
import {
    ArrowLeft, TerminalSquare,
    ArrowLeftRight, CalendarCheck, Coins, FileBarChart, Building2, MessageCircleQuestion,
} from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
    { href: "/test-ui/ai-streaming/bokforing", label: "Bokföring", icon: ArrowLeftRight, description: "Transaktioner, fakturor, verifikationer, inventarier", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { href: "/test-ui/ai-streaming/handelser", label: "Händelser", icon: CalendarCheck, description: "Månadsavslut, deadlines, aktivitetsöversikt", color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
    { href: "/test-ui/ai-streaming/loner", label: "Löner", icon: Coins, description: "Lönekörning, team, förmåner, egenavgifter, delägaruttag", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    { href: "/test-ui/ai-streaming/rapporter", label: "Rapporter", icon: FileBarChart, description: "Resultaträkning, moms, AGI, balanskontroll, bokslut", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/40" },
    { href: "/test-ui/ai-streaming/agare", label: "Ägare", icon: Building2, description: "Delägare, aktiebok, utdelning, bolagsstämma, medlemmar", color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
    { href: "/test-ui/ai-streaming/allmant", label: "Allmänt", icon: MessageCircleQuestion, description: "Kunskapsfrågor, skatteoptimering, onboarding, uppgifter", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
]

export default function AIStreamingIndex() {
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
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <TerminalSquare className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">AI Streaming UIs</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Hur Scooby svarar per domän — verktygsanrop, text, kort och bekräftelser i konversation.
                    </p>
                </div>

                <div className="grid gap-2">
                    {categories.map((cat) => {
                        const Icon = cat.icon
                        return (
                            <Link
                                key={cat.href}
                                href={cat.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3.5 rounded-xl",
                                    "bg-gradient-to-r",
                                    cat.color,
                                    "hover:scale-[1.01] active:scale-[0.995]",
                                    "transition-all duration-200 group",
                                    "border border-transparent hover:border-border/40"
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                    "transition-all duration-200 group-hover:scale-110 group-hover:shadow-md",
                                    cat.iconBg
                                )}>
                                    <Icon className={cn("h-5 w-5", cat.iconColor)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold">{cat.label}</p>
                                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
