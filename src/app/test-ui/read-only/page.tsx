"use client"

import Link from "next/link"
import {
    Settings, ArrowDownUp, Users, BookOpen,
    Landmark, Building2, BadgeDollarSign, LayoutTemplate, ArrowLeft,
    ArrowLeftRight, FileText, Hash, Package,
    Coins, User, Gift, Calculator,
    CalendarCheck, FileBarChart,
} from "lucide-react"
import { cn } from "@/lib/utils"

const testPages = [
    // Bokföring
    { href: "/test-ui/read-only/transaktioner", label: "Transaktioner", icon: ArrowLeftRight, description: "Alla transaktioner — bokförda, obokförda, ignorerade", tag: "Bokföring", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    { href: "/test-ui/read-only/fakturor", label: "Fakturor", icon: FileText, description: "Kund- och leverantörsfakturor i kanban-vy", tag: "Bokföring", color: "from-teal-500/20 to-teal-500/5", iconColor: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/40" },
    { href: "/test-ui/read-only/verifikationer", label: "Verifikationer", icon: Hash, description: "Alla bokförda verifikationer med debet/kredit", tag: "Bokföring", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { href: "/test-ui/read-only/inventarier", label: "Tillgångar", icon: Package, description: "Inventarier, avskrivningar och bokfört värde", tag: "Bokföring", color: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-cyan-100 dark:bg-cyan-900/40" },
    // Händelser
    { href: "/test-ui/read-only/handelser", label: "Händelser", icon: CalendarCheck, description: "Månadsavslut, periodstängning och deadlines", tag: "Händelser", color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
    // Rapporter
    { href: "/test-ui/read-only/rapporter", label: "Rapporter", icon: FileBarChart, description: "Resultaträkning, moms, AGI, bokslut m.m.", tag: "Rapporter", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/40" },
    // Inställningar
    { href: "/test-ui/read-only/settings", label: "Inställningar", icon: Settings, description: "Konto, företag, notiser, utseende", tag: null, color: "from-slate-500/20 to-slate-500/5", iconColor: "text-slate-600 dark:text-slate-400", iconBg: "bg-slate-100 dark:bg-slate-900/50" },
    // Löner
    { href: "/test-ui/read-only/lonekörning", label: "Lönekörning", icon: Coins, description: "Lönebesked per anställd och period", tag: "Löner", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    { href: "/test-ui/read-only/team", label: "Team", icon: User, description: "Anställda, utlägg och milersättning", tag: "Löner", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
    { href: "/test-ui/read-only/formaner", label: "Förmåner", icon: Gift, description: "Personalförmåner och skattefria avdrag", tag: "Löner", color: "from-pink-500/20 to-pink-500/5", iconColor: "text-pink-600 dark:text-pink-400", iconBg: "bg-pink-100 dark:bg-pink-900/40" },
    { href: "/test-ui/read-only/egenavgifter", label: "Egenavgifter", icon: Calculator, description: "Egenavgifter och sociala avgifter · EF", tag: "Löner", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
    { href: "/test-ui/read-only/delagaruttag", label: "Delägaruttag", icon: ArrowDownUp, description: "Uttags- och insättningsregister per delägare · HB/KB", tag: "Löner", color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/40" },
    { href: "/test-ui/read-only/delagare", label: "Delägare", icon: Users, description: "Ägarregister och kapitalkonton · HB/KB", tag: "Ägare", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/40" },
    { href: "/test-ui/read-only/medlemsregister", label: "Medlemsregister", icon: BookOpen, description: "Föreningens medlemmar och avgifter · Förening", tag: "Ägare", color: "from-teal-500/20 to-teal-500/5", iconColor: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/40" },
    { href: "/test-ui/read-only/bolagsstamma", label: "Möten & Beslut", icon: Landmark, description: "Bolagsstämmor och styrelsemöten med PDF · AB", tag: "Ägare", color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
    { href: "/test-ui/read-only/aktiebok", label: "Aktiebok & Styrning", icon: Building2, description: "Aktieägarregister och händelsehistorik · AB", tag: "Ägare", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
    { href: "/test-ui/read-only/utdelning", label: "Utdelning", icon: BadgeDollarSign, description: "K10-kalkylator och utdelningshistorik · AB", tag: "Ägare", color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
]

const TAG_COLORS: Record<string, string> = {
    "Bokföring": "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40",
    "Händelser": "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40",
    "Rapporter": "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40",
    "Löner": "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40",
    "Ägare": "bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/40",
}

export default function ReadOnlyIndex() {
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
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <LayoutTemplate className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Read Only UIs</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Moduler som agerar "read-only"-presentationer av bokförd data. All mutation sker via AI-chatten.
                    </p>
                </div>

                <div className="grid gap-2">
                    {testPages.map((page) => {
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
                                {page.tag && (
                                    <span className={cn(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0",
                                        TAG_COLORS[page.tag]
                                    )}>
                                        {page.tag}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
