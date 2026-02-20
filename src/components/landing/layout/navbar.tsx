"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { AnimatePresence, motion } from "framer-motion"

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <header className="fixed top-6 left-0 right-0 z-[60] w-full max-w-[440px] md:max-w-[640px] mx-auto transition-all duration-300">
                <div className="flex items-center justify-between px-5 py-3 bg-black/40 backdrop-blur-xl rounded-full shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
                    <Link href="/" className="flex items-center gap-3 font-medium cursor-pointer" onClick={() => setIsOpen(false)}>
                        <ScopeAILogo className="w-5 h-5 text-white" />
                        <span className="text-[15px] font-semibold tracking-tight text-white mt-[1px]">scope ai</span>
                    </Link>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1 text-white hover:text-white/70 transition-colors"
                    >
                        {isOpen ? (
                            <X className="w-5 h-5" strokeWidth={1.5} />
                        ) : (
                            <Menu className="w-5 h-5" strokeWidth={1.5} />
                        )}
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center"
                    >
                        <nav className="flex flex-col items-center gap-8 text-[32px] font-medium tracking-tight">
                            <Link
                                href="/logga-in"
                                className="text-white hover:text-white/70 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Sign up
                            </Link>
                            <Link
                                href="/logga-in"
                                className="text-white hover:text-white/70 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                Log in
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
