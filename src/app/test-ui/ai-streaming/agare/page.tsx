"use client"

import Link from "next/link"
import { ArrowLeft, Users, BookOpen, Landmark, BookMarked, Banknote } from "lucide-react"

const pages = [
    { href: "/test-ui/ai-streaming/agare/delagare", label: "Delägare", icon: Users, description: "Visa delägare · Uppdatera andel", badges: ["HB", "KB"] },
    { href: "/test-ui/ai-streaming/agare/medlemsregister", label: "Medlemsregister", icon: BookOpen, description: "Visa medlemmar · Lägg till medlem", badges: ["Förening"] },
    { href: "/test-ui/ai-streaming/agare/bolagsstamma", label: "Bolagsstämma", icon: Landmark, description: "Protokoll · Beslut · Utdelningsbeslut", badges: ["AB"] },
    { href: "/test-ui/ai-streaming/agare/aktiebok", label: "Aktiebok", icon: BookMarked, description: "Visa aktiebok · Registrera överlåtelse", badges: ["AB"] },
    { href: "/test-ui/ai-streaming/agare/utdelning", label: "Utdelning", icon: Banknote, description: "Beräkna utdelning · Registrera beslut", badges: ["AB"] },
]

export default function AgareStreamingIndex() {
    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/test-ui/ai-streaming" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Streaming
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ägare</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby hanterar delägare, aktiebok, utdelning och bolagsstämma.</p>
                </div>

                <div className="grid gap-2">
                    {pages.map((page) => {
                        const Icon = page.icon
                        return (
                            <Link
                                key={page.href}
                                href={page.href}
                                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gradient-to-r from-violet-500/10 to-violet-500/5 hover:scale-[1.01] active:scale-[0.995] transition-all duration-200 group border border-transparent hover:border-border/40"
                            >
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-violet-100 dark:bg-violet-900/40 transition-all duration-200 group-hover:scale-110">
                                    <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold">{page.label}</p>
                                        {page.badges?.map((b) => (
                                            <span key={b} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{b}</span>
                                        ))}
                                    </div>
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
