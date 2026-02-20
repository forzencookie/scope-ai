"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { TestNavbar } from "@/components/landing/layout/test-navbar"

export default function TestBgPage() {
    return (
        <div
            className="relative min-h-screen text-white font-sans selection:bg-white/30"
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
                <TestNavbar />

                {/* Section 1: Hero */}
                <section className="flex flex-col items-center justify-center min-h-[90vh] text-center px-4 w-full pt-24 md:pt-0">
                    <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto flex flex-col items-center">
                        <div className="px-3 py-1 rounded text-[10px] font-bold text-white/70 bg-white/10 mb-8 tracking-widest uppercase border border-white/10">
                            Beta
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight mb-10 leading-[1.1] text-white">
                            bokföring för framtiden.<br />
                            starta ditt bolag.
                        </h1>

                        <Link href="/test-login" className="flex items-center justify-center gap-2 px-10 py-3.5 bg-[#f5f5f5] text-black rounded-2xl hover:bg-white transition-all font-medium text-lg w-fit hover:scale-[1.02] active:scale-[0.98]">
                            kom igång <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* Section 2: Statement Card */}
                <section className="flex items-center justify-center min-h-screen px-4 w-full">
                    <div className="max-w-[440px] md:max-w-[640px] w-full p-10 md:p-12 rounded-[2rem] bg-black/30 backdrop-blur-2xl">
                        <p className="text-xl md:text-2xl font-medium leading-normal mb-20 text-white/95 tracking-tight">
                            scope ai har som uppdrag att förenkla företagande genom en autonom AI-plattform som underlättar och planerar din bokföring, så att du kan ägna mer tid till att fokusera på det du gör bäst.
                        </p>
                        <p className="text-white/60 text-lg">
                            <Link href="/test-login" className="text-white border-b border-white/30 hover:border-white transition-colors pb-1 border-dotted">gå med nu</Link> för att skapa ditt fria konto
                        </p>
                    </div>
                </section>

                {/* Section 3: Footer */}
                <section className="min-h-screen flex flex-col justify-end w-full px-8 pb-0 pt-32 overflow-hidden">
                    <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto z-10 flex flex-col px-5">

                        {/* Links Row */}
                        <div className="flex flex-row justify-between w-full mb-8 md:mb-12">
                            <div>
                                <h3 className="text-white/40 text-xl font-medium mb-6">Företag</h3>
                                <ul className="space-y-3 text-2xl font-medium text-white/90">
                                    <li><a href="#" className="hover:text-white transition-colors">Information</a></li>
                                    <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
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
                        <div className="w-full pb-6 md:pb-10">
                            <svg viewBox="0 0 380 90" className="w-full h-auto opacity-90 fill-white overflow-visible">
                                <text x="50%" y="85%" textAnchor="middle" className="font-bold tracking-tighter" style={{ fontSize: '110px' }}>
                                    scope ai
                                </text>
                            </svg>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    )
}
