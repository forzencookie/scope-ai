"use client"

import Link from "next/link"
import { ArrowLeft, Coins, Users, Gift, Calculator, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const pages = [
    { href: "/test-ui/ai-streaming/loner/lonekorning", label: "Lönekörning", icon: Coins, description: "Kör lönerna · Löneberäkning · AGI-koppling" },
    { href: "/test-ui/ai-streaming/loner/team", label: "Team", icon: Users, description: "Lägg till anställd · Visa teamet · Uppdatera uppgifter" },
    { href: "/test-ui/ai-streaming/loner/formaner", label: "Förmåner", icon: Gift, description: "Tilldela förmån · Friskvårdsbidrag · Tjänstebil" },
    { href: "/test-ui/ai-streaming/loner/egenavgifter", label: "Egenavgifter", icon: Calculator, description: "Beräkna egenavgifter · Skattejustering", badges: ["EF"] },
    { href: "/test-ui/ai-streaming/loner/delagaruttag", label: "Delägaruttag", icon: Wallet, description: "Registrera uttag · Periodöversikt", badges: ["HB", "KB"] },
]

export default function LonerStreamingIndex() {
    return (
        <div className="min-h-screen bg-background px-6 py-10">
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href="/test-ui/ai-streaming" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    AI Streaming
                </Link>

                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Löner</h1>
                    <p className="text-sm text-muted-foreground mt-1">Hur Scooby hanterar löner, team, förmåner och bolagsspecifika uttag.</p>
                </div>

                <div className="grid gap-2">
                    {pages.map((page) => {
                        const Icon = page.icon
                        return (
                            <Link
                                key={page.href}
                                href={page.href}
                                className="flex items-center gap-4 px-4 py-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 hover:scale-[1.01] active:scale-[0.995] transition-all duration-200 group border border-transparent hover:border-border/40"
                            >
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-900/40 transition-all duration-200 group-hover:scale-110">
                                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold">{page.label}</p>
                                        {"badges" in page && page.badges?.map((b: string) => (
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
