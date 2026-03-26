"use client"

import { Navbar } from "@/components/landing/layout/navbar"
import { PixelDog } from "@/components/ai/mascots/dog"
import { motion } from "framer-motion"

export default function VantelistaPage() {
    return (
        <div className="relative min-h-screen text-white font-sans selection:bg-white/30 overscroll-y-none flex flex-col landing-bg">
                <div className="relative z-10 flex flex-col items-center w-full flex-grow">
                    <Navbar />

                    <main className="flex flex-col items-center justify-center flex-grow w-full px-4 pt-32 pb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-[calc(100%-3rem)] sm:max-w-[400px] md:max-w-[540px] w-full p-10 md:p-12 rounded-[2rem] bg-black/30 backdrop-blur-2xl text-center"
                        >
                            <div className="mx-auto mb-8 flex items-center justify-center">
                                <PixelDog size={80} />
                            </div>

                            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-6 leading-tight text-white">
                                Du är på väntelistan
                            </h1>

                            <p className="text-lg md:text-xl font-medium leading-relaxed mb-8 text-white/70 tracking-tight">
                                Tack för att du skapat ett konto! Vi befinner oss just nu i en stängd beta-fas för att säkerställa högsta kvalitet.
                            </p>

                            <p className="text-white/50 text-base mb-8">
                                Vi kommer att skicka ett e-postmeddelande till dig så fort vi öppnar upp åtkomsten till plattformen.
                            </p>

                            <div className="inline-block px-4 py-2 rounded-full bg-white/5 text-sm font-medium text-white/60">
                                Din plats är säkrad
                            </div>
                        </motion.div>
                    </main>
                </div>
            </div>
    )
}
