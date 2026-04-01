"use client"

import Link from "next/link"
import {
    Sparkles, LayoutTemplate, MessageSquareText
} from "lucide-react"
import { cn } from "@/lib/utils"

const testCategories = [
    { 
        href: "/test-ui/read-only", 
        label: "Read Only UIs", 
        icon: LayoutTemplate, 
        description: "Registersidor, tabeller och konfiguration (ex. Aktiebok, Utdelning)", 
        color: "from-blue-500/20 to-blue-500/5", 
        iconColor: "text-blue-600 dark:text-blue-400", 
        iconBg: "bg-blue-100 dark:bg-blue-900/40" 
    },
    { 
        href: "/test-ui/walkthroughs", 
        label: "Walkthroughs & Overlays", 
        icon: Sparkles, 
        description: "Godkännandedesign, AI Block Renderers och interaktiva vyer", 
        color: "from-amber-500/20 to-amber-500/5", 
        iconColor: "text-amber-600 dark:text-amber-400", 
        iconBg: "bg-amber-100 dark:bg-amber-900/40" 
    },
    { 
        href: "/test-ui/ai-streaming", 
        label: "AI Streaming UIs", 
        icon: MessageSquareText, 
        description: "Scenarier för hur text och verktyg strömmar in i konversationen", 
        color: "from-indigo-500/20 to-indigo-500/5", 
        iconColor: "text-indigo-600 dark:text-indigo-400", 
        iconBg: "bg-indigo-100 dark:bg-indigo-900/40" 
    },
]

export default function TestUIIndex() {
    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Test UI Central</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Kategorier för designgranskning av Scoobys gränssnitt.
                    </p>
                </div>

                <div className="grid gap-2">
                    {testCategories.map((cat) => {
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
