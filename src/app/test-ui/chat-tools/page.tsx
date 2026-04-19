"use client"

import Link from "next/link"
import {
    ArrowLeft, Zap, Info, Link2,
} from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
    { href: "/test-ui/chat-tools/action-cards", label: "Action Cards", icon: Zap, description: "Kort som ändrar data — bokföring, lön, fakturor, ägare. Fas 1 bekräftelse, fas 2 kvitto.", color: "from-rose-500/20 to-rose-500/5", iconColor: "text-rose-600 dark:text-rose-400", iconBg: "bg-rose-100 dark:bg-rose-900/40" },
    { href: "/test-ui/chat-tools/information-cards", label: "Information Cards", icon: Info, description: "Kort som visar data — tidslinjer, statusöversikter, beräkningar, listor. Ingen mutation.", color: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-900/40" },
    { href: "/test-ui/chat-tools/link-cards", label: "Link Cards", icon: Link2, description: "Kort som öppnar en overlay — walkthrough eller dokument.", color: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-600 dark:text-violet-400", iconBg: "bg-violet-100 dark:bg-violet-900/40" },
]

export default function ChatToolsIndex() {
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
                    <h1 className="text-2xl font-bold tracking-tight">Chat Tools</h1>
                    <p className="text-sm text-muted-foreground">
                        De tre korttyperna Scooby kan visa i chatten.
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
