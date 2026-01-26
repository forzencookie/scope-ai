"use client"

import { motion } from "framer-motion"
import { Navbar, Footer, AnimatedDitherArt } from "@/components/landing"
import { SectionHeader } from "@/components/landing/shared/section-header"
import { StaticWorldMap } from "@/components/landing/sections/global-reach/static-world-map"
import { ThemeProvider } from "@/providers/theme-provider"

export default function AboutPage() {
    return (
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
            <main className="light min-h-screen bg-white font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 scroll-smooth relative overflow-x-hidden">
                <AnimatedDitherArt />

                <div className="relative z-10">
                    <Navbar />

                    {/* Hero / Header */}
                    <section className="pt-32 pb-16 px-6 md:px-12 lg:px-24 max-w-[1400px] mx-auto text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
                        >
                            Om oss
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed"
                        >
                            Vi bygger framtidens bokföringstjänst där AI gör grovjobbet och människor står för kvalitetskontrollen.
                        </motion.p>
                    </section>

                    {/* Problem & Team - Side by Side */}
                    <section className="px-6 md:px-12 lg:px-24 py-16 max-w-[1400px] mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                            {/* Left: The Problem */}
                            <div className="max-w-2xl">
                                <SectionHeader
                                    badge="Problemet"
                                    title="Varför vi finns"
                                    description=""
                                    align="left"
                                    className="mb-8"
                                />
                                <div className="space-y-6 text-lg text-stone-600 leading-relaxed">
                                    <p>
                                        Bokföring har länge varit synonymt med manuellt arbete, pappershögar och repetitiva uppgifter.
                                        För många företagare är det ett nödvändigt ont som tar tid från det som faktiskt betyder något – att driva och utveckla sin verksamhet.
                                    </p>
                                    <p>
                                        Traditionella byråer kämpar ofta med ineffektiva processer där konsulter lägger timmar på att stansa in siffror istället för att ge rådgivning.
                                        Vi såg ett behov av en förändring. En lösning där tekniken inte bara är ett stöd, utan motorn som driver hela processen framåt.
                                    </p>
                                    <p>
                                        Vår ambition var att eliminera den administrativa bördan helt. Genom att låta avancerad AI hantera tolkning, kontering och avstämning kan vi erbjuda en tjänst som är snabbare, säkrare och mer kostnadseffektiv än någonsin tidigare.
                                    </p>
                                </div>
                            </div>

                            {/* Right: The Team */}
                            <div className="w-full">
                                <SectionHeader
                                    badge="Teamet"
                                    title="Vilka vi är"
                                    description=""
                                    align="left"
                                    className="mb-12"
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="group relative max-w-sm mx-auto lg:mx-0"
                                >
                                    <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 mb-6 relative">
                                        {/* Placeholder for user photo */}
                                        <div className="absolute inset-0 flex items-center justify-center text-stone-400 bg-stone-100">
                                            <div className="text-center p-6">
                                                <span className="block text-4xl mb-2">👋</span>
                                                <span className="text-sm">Här kommer en bild på grundaren</span>
                                            </div>
                                        </div>
                                        {/* Overlay gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-bold mb-1">Grundaren</h3>
                                        <p className="text-stone-500 font-medium mb-3">Grundare</p>
                                        <p className="text-stone-600 text-sm leading-relaxed max-w-xs">
                                            Drivs av att förenkla företagande genom teknik. Med bakgrund inom både ekonomi och systemutveckling.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* Vision Section - Empowering & Scaled */}
                    <section className="px-6 md:px-12 lg:px-24 py-24 max-w-[1400px] mx-auto border-t border-stone-200">
                        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center mb-20">
                            {/* Left: Header & Long Term Goal */}
                            <div>
                                <SectionHeader
                                    badge="Vår Vision"
                                    title="Alla förtjänar en chans"
                                    description="Vi tror att företagande ska vara stärkande, inte skrämmande."
                                    align="left"
                                    className="mb-10"
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 }}
                                    className="text-left space-y-8"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold mb-3">Långsiktigt mål</h3>
                                        <p className="text-stone-600 leading-relaxed text-lg">
                                            Att skapa en global standard för automatiserad bokföring där varje idé får chansen att växa utan administrativa hinder.
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold mb-3">Kortsiktigt mål</h3>
                                        <p className="text-stone-600 leading-relaxed text-lg">
                                            Just nu fokuserar vi på att hjälpa Sveriges företagare att skala genom smart automatisering. Vi vill sänka tröskeln för att starta eget genom att göra administrationen transparent och begriplig – en gradvis &quot;microdosing&quot; av företagande som stärker snarare än skrämmer.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right: Map */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="w-full"
                            >
                                <StaticWorldMap className="w-full h-auto text-stone-200" dotColor="#8b5cf6" />
                            </motion.div>
                        </div>
                    </section>

                    <Footer />
                </div>
            </main>
        </ThemeProvider>
    )
}
