"use client"

import Link from "next/link"
import { ArrowLeft, FileBarChart } from "lucide-react"

const pages = [
    { href: "/test-ui/streaming/rapporter/rapporter", label: "Rapporter & Deklarationer", icon: FileBarChart, description: "Resultaträkning · Balansräkning · Moms · AGI · K10 · Bokslut" },
]

export default function RapporterStreamingIndex() {
    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/test-ui/streaming" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Streaming
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Rapporter</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby genererar rapporter, deklarationer och bokslut.</p>
                </div>

                <div className="grid gap-2">
                    {pages.map((page) => {
                        const Icon = page.icon
                        return (
                            <Link
                                key={page.href}
                                href={page.href}
                                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gradient-to-r from-sky-500/10 to-sky-500/5 hover:scale-[1.01] active:scale-[0.995] transition-all duration-200 group border border-transparent hover:border-border/40"
                            >
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 dark:bg-sky-900/40 transition-all duration-200 group-hover:scale-110">
                                    <Icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
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
