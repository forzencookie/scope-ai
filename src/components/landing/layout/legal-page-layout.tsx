"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/landing/layout/navbar"

interface LegalPageLayoutProps {
    brandLabel?: string
    title: string
    effectiveDate?: string
    children: React.ReactNode
}

export function LegalPageLayout({ brandLabel = "scope ai", title, effectiveDate, children }: LegalPageLayoutProps) {
    return (
        <div
            className="relative min-h-screen text-white font-sans selection:bg-white/30"
            style={{ backgroundColor: '#050505' }}
        >
                <div className="relative z-10 flex flex-col items-center w-full">
                    <Navbar />

                    <main className="w-full max-w-[440px] md:max-w-[640px] mx-auto px-5 pt-32 pb-24">
                        {/* Back link */}
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm mb-10"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Tillbaka
                        </Link>

                        {/* Brand name in blue */}
                        <p className="text-blue-400 font-semibold text-sm tracking-tight mb-6">{brandLabel}</p>

                        {/* Page title */}
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.15]">
                            {title}
                        </h1>

                        {/* Effective date */}
                        {effectiveDate && (
                            <p className="text-sm text-white/40 mb-10">
                                Ikraftträdandedatum: {effectiveDate}
                            </p>
                        )}

                        {/* Separator */}
                        <div className="h-px bg-white/10 mb-12" />

                        {/* Content */}
                        <div className="legal-content space-y-10 text-[16px] md:text-[17px] leading-[1.8] text-white/70">
                            {children}
                        </div>

                        {/* Footer separator + legal */}
                        <div className="mt-20 pt-8 border-t border-white/10">
                            <p className="text-xs text-white/30">
                                Copyright © 2026 scope ai. Alla rättigheter förbehållna.
                            </p>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/30">
                                <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookiepolicy</Link>
                                <Link href="/integritetspolicy" className="hover:text-white/60 transition-colors">Integritetspolicy</Link>
                                <Link href="/villkor" className="hover:text-white/60 transition-colors">Allmänna villkor</Link>
                                <Link href="/kontakt" className="hover:text-white/60 transition-colors">Kontakt</Link>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
    )
}
