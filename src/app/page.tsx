"use client"

import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/landing/layout/navbar"
import { AppDemoShowcase } from "@/components/landing/sections/app-demo-showcase"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { motion, useInView } from "framer-motion"
import { useState, useEffect, useRef } from "react"

function TypewriterHeroText({ line1, line2 }: { line1: string; line2: string }) {
    const [displayedText, setDisplayedText] = useState("")
    const ref = useRef(null)
    const isInView = useInView(ref, { margin: "-10%" })

    useEffect(() => {
        let timeoutId: NodeJS.Timeout

        if (isInView) {
            setDisplayedText("")
            let i = 0
            const fullText = line1 + "\n" + line2

            const typeChar = () => {
                if (i <= fullText.length) {
                    setDisplayedText(fullText.substring(0, i))
                    i++
                    // Natural, deliberate typing speed: 50-120ms per character
                    const delay = Math.random() * 70 + 50
                    timeoutId = setTimeout(typeChar, delay)
                }
            }

            // Initial pause before typing starts
            timeoutId = setTimeout(typeChar, 400)
        } else {
            setDisplayedText("")
        }

        return () => clearTimeout(timeoutId)
    }, [isInView, line1, line2])

    const parts = displayedText.split("\n")

    return (
        <h1 ref={ref} className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-10 leading-[1.1] text-white min-h-[2.2em] md:min-h-[2.2em]">
            {parts[0]}
            {parts.length > 1 && <><br />{parts[1]}</>}
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.9, ease: [1, 0, 1, 0] }}
                className="inline-block w-[4px] h-[0.85em] bg-white ml-2 align-middle -translate-y-[4px]"
            />
        </h1>
    )
}

export default function LandingPage() {
    return (
        <TextModeProvider>
            <div
                className="relative min-h-screen text-white font-sans selection:bg-white/30 overscroll-y-none"
                style={{
                    backgroundColor: '#050505',
                    backgroundImage: "url('/premiumbg-clean.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: '85% center',
                    backgroundAttachment: 'fixed',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* Main scrollable container */}
                <div className="relative z-10 flex flex-col items-center w-full">

                    {/* Fixed minimal Header */}
                    <Navbar />

                    {/* Section 1: Hero */}
                    <section className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4 w-full pt-24 md:pt-0">
                        <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto flex flex-col items-center md:mt-32">
                            <div className="px-3 py-1 rounded text-[10px] font-bold text-white/70 bg-white/10 mb-8 tracking-widest uppercase border border-white/10">
                                Beta
                            </div>

                            <TypewriterHeroText line1="bokföring för framtiden." line2="starta ditt bolag." />

                            <Link href="/logga-in" className="flex items-center justify-center gap-2 px-10 py-3.5 bg-[#f5f5f5] text-black rounded-2xl hover:bg-white transition-all font-medium text-lg w-fit hover:scale-[1.02] active:scale-[0.98]">
                                kom igång <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </section>

                    {/* Section 2: App Demo */}
                    <div className="w-full flex flex-col items-center z-20">
                        <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto px-5">
                            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white text-center mt-32 mb-0 leading-tight pb-0">
                                Din AI-assistent som jobbar dygnet runt.
                            </h2>
                        </div>
                        <div className="-mt-[40px] w-full">
                            <AppDemoShowcase />
                        </div>
                    </div>

                    {/* Section 3: Vision */}
                    <section className="flex flex-col items-center justify-center min-h-screen px-4 w-full">
                        <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white gap-2 text-center mb-16 leading-tight">
                            Vision
                        </h2>
                        <div className="max-w-[440px] md:max-w-[640px] w-full p-10 md:p-12 rounded-[2rem] bg-black/30 backdrop-blur-2xl">
                            <p className="text-xl md:text-2xl font-medium leading-normal mb-20 text-white/95 tracking-tight">
                                scope ai har som uppdrag att förenkla företagande genom en autonom AI-plattform som underlättar och planerar din bokföring, så att du kan ägna mer tid till att fokusera på det du gör bäst.
                            </p>
                            <p className="text-white/60 text-lg">
                                <Link href="/logga-in" className="text-white border-b border-white/30 hover:border-white transition-colors pb-1 border-dotted">gå med nu</Link> för att skapa ditt fria konto
                            </p>
                        </div>
                    </section>

                    {/* Section 4: Priser */}
                    <section className="flex flex-col items-center justify-center min-h-screen px-4 w-full">
                        <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white text-center mb-16 leading-tight">
                            Priser
                        </h2>
                        <div className="flex flex-col gap-5 w-full max-w-[440px] md:max-w-[640px]">

                            {/* Bento Row 1: Pro — hero card, full width */}
                            <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl p-1.5">
                                <div className="rounded-[1.6rem] bg-black/30 p-7 md:p-9 flex flex-col md:flex-row md:items-center md:gap-10">
                                    <div className="md:flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <p className="text-xs font-bold text-white/50 tracking-widest uppercase">Pro</p>
                                            <span className="px-3 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/20 backdrop-blur-md text-[10px] font-bold text-blue-300 tracking-widest uppercase flex items-center gap-1.5">
                                                Populärast
                                            </span>
                                        </div>
                                        <div className="flex items-end gap-1 mb-6 md:mb-0">
                                            <span className="text-5xl md:text-6xl font-medium tracking-tight text-white">449</span>
                                            <span className="text-lg text-white/50 mb-1.5">kr/mån</span>
                                        </div>
                                    </div>
                                    <div className="md:flex-1">
                                        <ul className="space-y-3 mb-8 md:mb-6">
                                            <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                Allt i Fri
                                            </li>
                                            <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                Obegränsad AI-assistans
                                            </li>
                                            <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                Automatisk kvittohantering
                                            </li>
                                            <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                Obegränsat antal bolag
                                            </li>
                                        </ul>
                                        <Link
                                            href="/logga-in"
                                            className="block w-full py-3 rounded-xl text-center font-medium text-black bg-[#f5f5f5] hover:bg-white transition-all text-[15px] hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            Välj Pro
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Bento Row 2: Fri + Enterprise side by side */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* Fri */}
                                <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl p-1.5">
                                    <div className="rounded-[1.6rem] bg-black/30 p-7 flex flex-col h-full">
                                        <p className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Fri</p>
                                        <div className="flex items-end gap-1 mb-6">
                                            <span className="text-4xl font-medium tracking-tight text-white">0</span>
                                            <span className="text-base text-white/50 mb-1">kr/mån</span>
                                        </div>
                                        <ul className="space-y-2.5 mb-8 flex-1">
                                            <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                Grundläggande bokföring
                                            </li>
                                            <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                AI-assistans (begränsad)
                                            </li>
                                            <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                1 bolag
                                            </li>
                                        </ul>
                                        <Link
                                            href="/logga-in"
                                            className="w-full py-2.5 rounded-xl text-center font-medium text-white/90 bg-white/[0.08] hover:bg-white/[0.12] transition-all text-sm"
                                        >
                                            Kom igång gratis
                                        </Link>
                                    </div>
                                </div>

                                {/* Enterprise */}
                                <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl p-1.5">
                                    <div className="rounded-[1.6rem] bg-black/30 p-7 flex flex-col h-full">
                                        <p className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Enterprise</p>
                                        <div className="flex items-end gap-1 mb-6">
                                            <span className="text-xl font-medium tracking-tight text-white/60">Kommer snart</span>
                                        </div>
                                        <ul className="space-y-2.5 mb-8 flex-1">
                                            <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                Allt i Pro
                                            </li>
                                            <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                Dedikerad support
                                            </li>
                                            <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                Anpassade integrationer
                                            </li>
                                            <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                SLA &amp; prioriterad åtkomst
                                            </li>
                                        </ul>
                                        <a
                                            href="mailto:kontakt@scopeai.se"
                                            className="w-full py-2.5 rounded-xl text-center font-medium text-white/90 bg-white/[0.08] hover:bg-white/[0.12] transition-all text-sm"
                                        >
                                            Kontakta oss
                                        </a>
                                    </div>
                                </div>

                            </div>

                        </div>
                    </section>

                    {/* Section 5: Footer */}
                    <section className="min-h-screen flex flex-col justify-end w-full px-8 pb-0 pt-32 overflow-hidden">
                        <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto z-10 flex flex-col px-5">

                            {/* Links Row */}
                            <div className="flex flex-row justify-between w-full mb-8 md:mb-12">
                                <div>
                                    <h3 className="text-white/40 text-xl font-medium mb-6">Företag</h3>
                                    <ul className="space-y-3 text-2xl font-medium text-white/90">
                                        <li><Link href="/om-oss" className="hover:text-white transition-colors">Information</Link></li>
                                        <li><Link href="/kontakt" className="hover:text-white transition-colors">Kontakt</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-white/40 text-xl font-medium mb-6">Följ oss</h3>
                                    <ul className="space-y-3 text-2xl font-medium text-white/90">
                                        <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
                                    </ul>
                                </div>
                            </div>

                            {/* Huge logo perfectly constrained to the same vertical bounds left/right */}
                            <div className="w-full pb-8 md:pb-12">
                                <svg viewBox="0 0 380 90" className="w-full h-auto opacity-90 fill-white overflow-visible">
                                    <text x="50%" y="85%" textAnchor="middle" className="font-bold tracking-tighter" style={{ fontSize: '110px' }}>
                                        scope ai
                                    </text>
                                </svg>
                            </div>

                            {/* Legal Links Row */}
                            <div className="flex flex-col md:flex-row justify-between items-center py-6 border-t border-white/10 text-[13px] text-white/40 gap-4">
                                <div>
                                    Copyright © 2026 scope ai. Alla rättigheter förbehållna.
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link href="/cookies" className="hover:text-white transition-colors">Cookiepolicy</Link>
                                    <Link href="/integritetspolicy" className="hover:text-white transition-colors">Integritetspolicy</Link>
                                    <Link href="/villkor" className="hover:text-white transition-colors">Allmänna villkor</Link>
                                </div>
                            </div>

                        </div>
                    </section>
                </div>
            </div>
        </TextModeProvider>
    )
}
