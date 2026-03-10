"use client"

import { Navbar } from "@/components/landing/layout/navbar"
import { TextModeProvider } from "@/providers/text-mode-provider"
import { motion } from "framer-motion"

export default function VantelistaPage() {
    return (
        <TextModeProvider>
            <div
                className="relative min-h-screen text-white font-sans selection:bg-white/30 overscroll-y-none flex flex-col"
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
                <div className="relative z-10 flex flex-col items-center w-full flex-grow">
                    <Navbar />

                    <main className="flex flex-col items-center justify-center flex-grow w-full px-4 pt-32 pb-20">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-[440px] md:max-w-[540px] w-full p-10 md:p-12 rounded-[2rem] bg-black/40 backdrop-blur-2xl border border-white/10 text-center"
                        >
                            <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-white/10 flex items-center justify-center">
                                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
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

                            <div className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/60">
                                Din plats är säkrad
                            </div>
                        </motion.div>
                    </main>
                </div>
            </div>
        </TextModeProvider>
    )
}
