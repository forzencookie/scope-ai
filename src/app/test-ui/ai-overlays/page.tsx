"use client"

import Link from "next/link"
import {
    ArrowLeft, FileText, BookOpen, Users, PieChart, Calculator, Send, Building2,
    Receipt, BarChart3, FileStack, CreditCard, Layers, Package, Calendar, Coins,
    Gift, BookMarked, Banknote, Wallet, UserPlus, Landmark, Building, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"

const walkthroughs = [
    { href: "/test-ui/ai-overlays/walkthroughs/resultatrakning", label: "Resultatrakning", icon: BarChart3, description: "Interaktiv resultatoversikt", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/balansrakning", label: "Balansrakning", icon: Receipt, description: "Tillgangar, skulder och eget kapital", color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/momsdeklaration", label: "Momsdeklaration", icon: FileText, description: "Deklaration och kontroll av transaktioner", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/k10", label: "K10", icon: PieChart, description: "Gransbelopp, 3:12-regler, kvalificerade andelar", color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/agi", label: "AGI", icon: Users, description: "Arbetsgivardeklaration med individuppgifter", color: "from-pink-500/20 to-pink-500/5", iconColor: "text-pink-600 dark:text-pink-400", iconBg: "bg-pink-100 dark:bg-pink-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/inkomstdeklaration", label: "Inkomstdeklaration (INK2)", icon: Building2, description: "Skattemassiga justeringar med verifikationer", color: "from-slate-500/20 to-slate-500/5", iconColor: "text-slate-600 dark:text-slate-400", iconBg: "bg-slate-100 dark:bg-slate-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/arsredovisning", label: "Arsredovisning", icon: BookOpen, description: "K2-arsredovisning med provenance fran bokforing", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/egenavgifter", label: "Egenavgifter", icon: Calculator, description: "Berakning av preliminarskatt och egenavgifter", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/transaktioner", label: "Transaktioner", icon: CreditCard, description: "Bokforda och obokforda transaktioner", color: "from-cyan-500/20 to-cyan-500/5", iconColor: "text-cyan-600 dark:text-cyan-400", iconBg: "bg-cyan-100 dark:bg-cyan-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/fakturor", label: "Fakturor", icon: Receipt, description: "Kund- och leverantorsfakturor", color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/verifikationer", label: "Verifikationer", icon: Layers, description: "Bokforda verifikationer med konteringar", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/tillgangar", label: "Tillgangar", icon: Package, description: "Inventarier och avskrivningsplaner", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/handelser", label: "Handelser", icon: Calendar, description: "Manadsavslut, checklista och arskalender", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/lonekorning", label: "Lonekörning", icon: Coins, description: "Lonekörning, skatteavdrag och AGI", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/team", label: "Team", icon: Users, description: "Anstallda, loner och kommunalskatt", color: "from-sky-500/20 to-sky-500/5", iconColor: "text-sky-600 dark:text-sky-400", iconBg: "bg-sky-100 dark:bg-sky-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/formaner", label: "Formaner", icon: Gift, description: "Friskvard, tjanstebil och formansbeskatning", color: "from-green-500/20 to-green-500/5", iconColor: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/aktiebok", label: "Aktiebok", icon: BookMarked, description: "Aktieagarregister, serier och overlatelser", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/utdelning", label: "Utdelning", icon: Banknote, description: "K10-berakning och utdelning till aktiagare", color: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400", iconBg: "bg-amber-100 dark:bg-amber-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/delagare", label: "Delagare", icon: Users, description: "Delagare, kapitalkon och andelar i HB/KB", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/delagaruttag", label: "Delagaruttag", icon: Wallet, description: "Uttag och insattningar per delagare", color: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", iconBg: "bg-blue-100 dark:bg-blue-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/bolagsstamma", label: "Bolagsstamma", icon: Landmark, description: "Stammer, styrelsemoten och protokoll", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/medlemsregister", label: "Medlemsregister", icon: UserPlus, description: "Foreningsmedlemmar och arsavgifter", color: "from-green-500/20 to-green-500/5", iconColor: "text-green-600 dark:text-green-400", iconBg: "bg-green-100 dark:bg-green-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/kund", label: "Kund", icon: Building, description: "Kunddossier med fakturor och betalhistorik", color: "from-teal-500/20 to-teal-500/5", iconColor: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/plan", label: "Plan", icon: Calendar, description: "Kvartalplan med uppgifter och deadlines", color: "from-orange-500/20 to-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", iconBg: "bg-orange-100 dark:bg-orange-900/40" },
    { href: "/test-ui/ai-overlays/walkthroughs/foretagsstatistik", label: "Foretagsstatistik", icon: TrendingUp, description: "Omsattning, marginaler och tillvaxt YoY", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
]

const documents = [
    { href: "/test-ui/ai-overlays/documents", label: "Dokument", icon: FileStack, description: "Lonebesked, styrelseprotokoll, aktiebok (PDF)", color: "from-teal-500/20 to-teal-500/5", iconColor: "text-teal-600 dark:text-teal-400", iconBg: "bg-teal-100 dark:bg-teal-900/40" },
]

export default function AIOverlaysIndex() {
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
                    <h1 className="text-2xl font-bold tracking-tight">AI Overlays</h1>
                    <p className="text-sm text-muted-foreground">
                        Walkthrough-rapporter och nedladdningsbara dokument.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Walkthroughs</h2>
                        <div className="grid gap-2">
                            {walkthroughs.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-xl",
                                            "bg-gradient-to-r",
                                            item.color,
                                            "hover:scale-[1.01] active:scale-[0.995]",
                                            "transition-all duration-200 group",
                                            "border border-transparent hover:border-border/40"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                            "transition-all duration-200 group-hover:scale-110 group-hover:shadow-md",
                                            item.iconBg
                                        )}>
                                            <Icon className={cn("h-5 w-5", item.iconColor)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dokument</h2>
                        <div className="grid gap-2">
                            {documents.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-xl",
                                            "bg-gradient-to-r",
                                            item.color,
                                            "hover:scale-[1.01] active:scale-[0.995]",
                                            "transition-all duration-200 group",
                                            "border border-transparent hover:border-border/40"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                            "transition-all duration-200 group-hover:scale-110 group-hover:shadow-md",
                                            item.iconBg
                                        )}>
                                            <Icon className={cn("h-5 w-5", item.iconColor)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.description}</p>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
