"use client"

import { motion } from "framer-motion"
import { Navbar, Footer, AnimatedDitherArt, Pricing, FAQ } from "@/components/landing"
import { ThemeProvider } from "@/providers/theme-provider"

export default function PricingPage() {
    return (
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
            <main className="light min-h-screen bg-white font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 scroll-smooth relative overflow-x-hidden">
                <AnimatedDitherArt />

                <div className="relative z-10">
                    <Navbar />

                    {/* Hero / Header */}
                    <section className="pt-32 pb-4 px-6 md:px-12 lg:px-24 max-w-[1400px] mx-auto text-center">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
                        >
                            Priser
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed"
                        >
                            Inga dolda avgifter. Inga bindningstider. Betala för det du använder.
                        </motion.p>
                    </section>

                    {/* Pricing Section */}
                    {/* The Pricing component likely includes its own padding/layout structure, 
                        but usually fits in a section. Let's see if it needs adjustments. 
                        Assuming it works standalone like on home page. */}
                    <div className="pb-24">
                        <Pricing />
                    </div>

                    {/* FAQ is good to have on Pricing page */}
                    <FAQ />

                    <Footer />
                </div>
            </main>
        </ThemeProvider>
    )
}
