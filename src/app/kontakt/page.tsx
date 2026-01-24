"use client"

import { motion } from "framer-motion"
import { Navbar, Footer, AnimatedDitherArt, Contact } from "@/components/landing"
import { ThemeProvider } from "@/providers/theme-provider"

export default function ContactPage() {
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
                            Kontakta oss
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed"
                        >
                            Har du frågor eller funderingar? Vi hjälper dig gärna.
                        </motion.p>
                    </section>

                    <Contact />

                    <Footer />
                </div>
            </main>
        </ThemeProvider>
    )
}
