"use client"

import { useState, useEffect } from "react"
import { Analytics } from "@vercel/analytics/react"
import Link from "next/link"
import { Shield } from "lucide-react"
import { usePathname } from "next/navigation"

export function CookieBanner() {
    const pathname = usePathname()
    const [consent, setConsent] = useState<"all" | "necessary" | null>(null)
    const [mounted, setMounted] = useState(false)

    // Hide cookie banner completely on app/internal routes
    const isAppRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/onboarding')

    useEffect(() => {
        setMounted(true)
        const savedConsent = localStorage.getItem("cookie_consent") as "all" | "necessary" | null
        if (savedConsent) {
            setConsent(savedConsent)
        }
    }, [])

    const handleAcceptAll = () => {
        localStorage.setItem("cookie_consent", "all")
        setConsent("all")
    }

    const handleAcceptNecessary = () => {
        localStorage.setItem("cookie_consent", "necessary")
        setConsent("necessary")
    }

    // Don't render anything until mounted to avoid hydration mismatch, or if on an internal app route
    if (!mounted || isAppRoute) return null

    return (
        <>
            {/* Endast ladda Vercel Analytics om användaren har accepterat alla cookies */}
            {consent === "all" && <Analytics />}

            {/* Visa bannern om användaren inte gjort ett val än */}
            {consent === null && (
                <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 pointer-events-none">
                    <div className="mx-auto max-w-4xl bg-[#111]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        {/* Text Content */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-blue-400" />
                                <h3 className="text-white font-medium text-lg tracking-tight">Vi värnar om din integritet</h3>
                            </div>
                            <p className="text-white/60 text-[14px] leading-relaxed max-w-2xl">
                                Vi döljer ingenting i det finstilta. <strong className="text-white/80 font-medium whitespace-nowrap">scope ai</strong> använder strikt nödvändiga cookies för säkerhet och inloggning, samt analyscookies för att förstå hur vår webtjänst används. Välj nedan om du vill acceptera alla, eller bara de absolut nödvändiga för driften.
                                Läs mer i vår <Link href="/cookies" className="text-white hover:text-blue-400 underline underline-offset-4 transition-colors">Cookiepolicy</Link>.
                            </p>
                        </div>

                        {/* Buttons & Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                            <button
                                onClick={handleAcceptNecessary}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-[14px] font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/5 hover:border-white/10"
                            >
                                Endast nödvändiga
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl text-[14px] font-semibold text-[#050505] bg-white hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
                            >
                                Acceptera alla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
