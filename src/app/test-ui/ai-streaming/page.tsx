"use client"

import Link from "next/link"
import { Sparkles, TerminalSquare, MessageSquareText, FileCode2, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const streamingPages = [
    { href: "/test-ui/ai-streaming/standard", label: "Standard Streaming", icon: MessageSquareText, description: "Hur text skrivs ut tecken för tecken.", color: "from-indigo-500/20 to-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", iconBg: "bg-indigo-100 dark:bg-indigo-900/40" },
    { href: "/test-ui/ai-streaming/tool-call", label: "Tool Call Simulation", icon: FileCode2, description: "Design för när AI anropar externa verktyg (ex. sök i databas)", color: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-600 dark:text-purple-400", iconBg: "bg-purple-100 dark:bg-purple-900/40" },
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
                        Moduler som testar den iterativa uppbyggnaden av chattrutan när Scooby jobbar.
                    </p>
                </div>

                <div className="grid gap-2">
                    {streamingPages.map((page) => {
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
