"use client"

import Link from "next/link"
import { ArrowLeft, MessageCircleQuestion, Brain, Lightbulb, ListChecks } from "lucide-react"

const pages = [
    { href: "/test-ui/streaming/allmant/kunskap", label: "Kunskapsfrågor", icon: Brain, description: "Hur fungerar utdelning? · Förklara BAS-kontoplanen · Vad är K10?" },
    { href: "/test-ui/streaming/allmant/optimering", label: "Skatteoptimering & Rådgivning", icon: Lightbulb, description: "Optimera min skatt · Lön vs utdelning · Ska jag momsregistrera?" },
    { href: "/test-ui/streaming/allmant/uppgifter", label: "Uppgifter & Påminnelser", icon: ListChecks, description: "Kom ihåg att… · Vad har jag kvar? · Onboarding" },
]

export default function AllmantStreamingIndex() {
    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/test-ui/streaming" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Streaming
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Allmänt</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby hanterar kunskapsfrågor, rådgivning, uppgifter och allmän konversation.</p>
                </div>

                <div className="grid gap-2">
                    {pages.map((page) => {
                        const Icon = page.icon
                        return (
                            <Link
                                key={page.href}
                                href={page.href}
                                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 hover:scale-[1.01] active:scale-[0.995] transition-all duration-200 group border border-transparent hover:border-border/40"
                            >
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900/40 transition-all duration-200 group-hover:scale-110">
                                    <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
