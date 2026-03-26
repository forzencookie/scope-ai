"use client"

import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/landing/layout/navbar"
import { AppDemoShowcase } from "@/components/landing/sections/app-demo-showcase"
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
                    // More deliberate, thoughtful typing speed: 80-180ms per character
                    const delay = Math.random() * 100 + 80
                    timeoutId = setTimeout(typeChar, delay)
                }
            }

            // Longer initial pause for impact
            timeoutId = setTimeout(typeChar, 800)
        } else {
            setDisplayedText("")
        }

        return () => clearTimeout(timeoutId)
    }, [isInView, line1, line2])

    const parts = displayedText.split("\n")

    return (
        <h1 ref={ref} className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-8 leading-[1.15] text-white min-h-[2.4em] md:min-h-[2.2em]">
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

function WaitlistForm() {
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        
        // In a real app we'd save this to Supabase. For now we mock the delay.
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setSubmitted(true)
        setLoading(false)
    }

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-6 px-6 bg-white/5 rounded-xl border border-white/10 w-full mt-4 animate-in fade-in zoom-in duration-300">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                    <Check className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-white font-medium text-lg">Tack! Din plats är säkrad.</p>
                <p className="text-white/60 mt-1">Vi skickar ett mail när vi öppnar upp.</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full mt-2">
            <input 
                type="email" 
                placeholder="Din e-postadress..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors text-[15px]"
            />
            <button 
                type="submit" 
                disabled={loading || !email}
                className={`px-6 py-3.5 rounded-xl font-medium transition-all text-[15px] flex items-center justify-center min-w-[160px] ${
                    !email 
                        ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                        : 'bg-[#f5f5f5] text-black hover:bg-white hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
                {loading ? "Skickar..." : "Gå med i väntelistan"}
            </button>
        </form>
    )
}

const IS_PRE_LAUNCH = process.env.NEXT_PUBLIC_PRE_LAUNCH_MODE === 'true'

export default function LandingPage() {

    return (
        <div className="relative min-h-screen text-white font-sans selection:bg-white/30 landing-bg">
                {/* Main scrollable container */}
                <div className="relative z-10 flex flex-col items-center w-full">

                    {/* Fixed minimal Header */}
                    <Navbar />

                    {/* Section 1: Hero */}
                    <section className="flex flex-col items-center justify-center min-h-[80vh] text-center px-5 w-full pt-16 md:pt-0">
                        <div className="w-full max-w-[calc(100%-1rem)] sm:max-w-[400px] md:max-w-[640px] mx-auto flex flex-col items-center md:mt-24">
                            <div className="px-3 py-1 rounded text-[10px] font-bold text-white/70 bg-white/10 mb-6 tracking-widest uppercase border border-white/10">
                                Beta
                            </div>

                            <TypewriterHeroText line1="bokföring för framtiden." line2="starta ditt bolag." />

                            <Link href="/logga-in" className="flex items-center justify-center gap-2 px-8 py-3 bg-[#f5f5f5] text-black rounded-2xl hover:bg-white transition-all font-medium text-base w-fit hover:scale-[1.02] active:scale-[0.98]">
                                kom igång <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </section>

                    {/* Section 2: App Demo */}
                    <div className="w-full flex flex-col items-center z-20 py-24 md:py-32">
                        <div className="w-full max-w-[calc(100%-3rem)] sm:max-w-[400px] md:max-w-[640px] mx-auto px-5">
                            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white text-center mb-12 leading-tight">
                                Din AI-assistent som jobbar dygnet runt.
                            </h2>
                        </div>
                        <div className="w-full">
                            <AppDemoShowcase />
                        </div>
                    </div>

                    {/* Section 3: Vision */}
                    <section className="flex flex-col items-center justify-center px-4 w-full py-24 md:py-32">
                        <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white gap-2 text-center mb-12 leading-tight">
                            Vision
                        </h2>
                        <div className="max-w-[calc(100%-3rem)] sm:max-w-[400px] md:max-w-[640px] w-full p-8 md:p-12 rounded-[2rem] bg-black/30 backdrop-blur-2xl">
                            <p className="text-xl md:text-2xl font-medium leading-normal mb-16 text-white/95 tracking-tight">
                                scope ai har som uppdrag att förenkla företagande genom en autonom AI-plattform som underlättar och planerar din bokföring, så att du kan ägna mer tid till att fokusera på det du gör bäst.
                            </p>
                            <p className="text-white/60 text-lg">
                                <Link href="/logga-in" className="text-white border-b border-white/30 hover:border-white transition-colors pb-1 border-dotted">kom igång nu</Link> för att framtidssäkra din bokföring
                            </p>
                        </div>
                    </section>

                    {/* Section 4: Priser / Waitlist */}
                    {IS_PRE_LAUNCH ? (
                        <section className="flex flex-col items-center justify-center px-4 w-full py-24 md:py-32">
                            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white text-center mb-8 md:mb-12 leading-tight">
                                Få tidig åtkomst
                            </h2>
                            <div className="flex flex-col gap-5 w-full max-w-[calc(100%-3rem)] sm:max-w-[400px] md:max-w-[640px]">
                                <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl p-1.5">
                                    <div className="rounded-[1.6rem] bg-black/30 p-8 md:p-10 flex flex-col items-center text-center">
                                        <div className="mb-6 space-y-1">
                                            <p className="text-base md:text-lg text-white/90 font-medium tracking-tight">
                                                Få exklusiv tillgång före alla andra.
                                            </p>
                                            <p className="text-sm md:text-base text-white/60">
                                                Skriv upp dig på väntelistan och bli först att uppleva framtidens bokföring.
                                            </p>
                                        </div>
                                        
                                        <WaitlistForm />
                                        
                                        <p className="text-white/40 text-sm mt-8">
                                            Eller <Link href="/logga-in" className="text-white hover:underline transition-colors">skapa ett konto</Link> för att spara dina uppgifter.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className="flex flex-col items-center justify-center px-4 w-full py-24 md:py-32">
                            <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white text-center mb-12 leading-tight">
                                Priser
                            </h2>
                            <div className="flex flex-col gap-5 w-full max-w-[calc(100%-3rem)] sm:max-w-[400px] md:max-w-[640px]">

                                {/* Bento Row 1: Max — hero card, full width */}
                                <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl p-1.5">
                                    <div className="rounded-[1.6rem] bg-black/30 p-7 md:p-9 flex flex-col md:flex-row md:items-center md:gap-10">
                                        <div className="md:flex-1">
                                            <div className="flex items-center gap-3 mb-4">
                                                <p className="text-xs font-bold text-white/50 tracking-widest uppercase">Max</p>
                                                <span className="px-3 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/20 backdrop-blur-md text-[10px] font-bold text-purple-300 tracking-widest uppercase flex items-center gap-1.5">
                                                    Populärast
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-1 mb-6 md:mb-0">
                                                <span className="text-5xl md:text-6xl font-medium tracking-tight text-white">449</span>
                                                <span className="text-lg text-white/50 mb-1.5">kr/mån</span>
                                            </div>
                                            <p className="text-sm text-white/50 mt-2">För Aktiebolag, Handelsbolag och KB</p>
                                        </div>
                                        <div className="md:flex-1">
                                            <ul className="space-y-3 mb-8 md:mb-6 mt-4 md:mt-0">
                                                <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                    <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                    Allt i Pro
                                                </li>
                                                <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                    <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                    Flera användare & team
                                                </li>
                                                <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                    <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                    K10 och Årsredovisning
                                                </li>
                                                <li className="flex items-start gap-3 text-white/70 text-[15px]">
                                                    <Check className="w-4 h-4 mt-0.5 text-white/40 shrink-0" />
                                                    Prioriterad support
                                                </li>
                                            </ul>
                                            <Link
                                                href="/logga-in"
                                                className="block w-full py-3 rounded-xl text-center font-medium text-black bg-[#f5f5f5] hover:bg-white transition-all text-[15px] hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                Välj Max
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Bento Row 2: Pro + Enterprise side by side */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    {/* Pro */}
                                    <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl p-1.5">
                                        <div className="rounded-[1.6rem] bg-black/30 p-7 flex flex-col h-full">
                                            <p className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Pro</p>
                                            <div className="flex items-end gap-1 mb-2">
                                                <span className="text-4xl font-medium tracking-tight text-white">249</span>
                                                <span className="text-base text-white/50 mb-1">kr/mån</span>
                                            </div>
                                            <p className="text-xs text-white/50 mb-6">För Enskild Firma och Förening</p>
                                            <ul className="space-y-2.5 mb-8 flex-1">
                                                <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                    <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                    AI-kategoriserar transaktioner
                                                </li>
                                                <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                    <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                    Riktig banksynkronisering
                                                </li>
                                                <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                    <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                    1 Användare
                                                </li>
                                            </ul>
                                            <Link
                                                href="/logga-in"
                                                className="w-full py-2.5 rounded-xl text-center font-medium text-white/90 bg-white/[0.08] hover:bg-white/[0.12] transition-all text-sm"
                                            >
                                                Välj Pro
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Enterprise */}
                                    <div className="rounded-[2rem] bg-white/[0.04] backdrop-blur-2xl p-1.5">
                                        <div className="rounded-[1.6rem] bg-black/30 p-7 flex flex-col h-full">
                                            <p className="text-xs font-bold text-white/50 tracking-widest uppercase mb-4">Enterprise</p>
                                            <div className="flex items-end gap-1 mb-2">
                                                <span className="text-xl font-medium tracking-tight text-white/90">Anpassat</span>
                                            </div>
                                            <p className="text-xs text-white/50 mb-6">För koncerner och flerbolag</p>
                                            <ul className="space-y-2.5 mb-8 flex-1">
                                                <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                    <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                    Allt i Max
                                                </li>
                                                <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                    <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                    Obegränsad AI-användning
                                                </li>
                                                <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                    <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                    Anpassade integrationer
                                                </li>
                                                <li className="flex items-start gap-2.5 text-white/70 text-sm">
                                                    <Check className="w-3.5 h-3.5 mt-0.5 text-white/40 shrink-0" />
                                                    SLA & dedikerad support
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
                    )}

                    {/* Section 5: Footer */}
                    <section className="flex flex-col justify-end w-full px-8 pb-0 py-24 md:py-32 overflow-hidden">
                        <div className="w-full max-w-[calc(100%-3rem)] sm:max-w-[400px] md:max-w-[640px] mx-auto z-10 flex flex-col px-5">

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
    )
}
