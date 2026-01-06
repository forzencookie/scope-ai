"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-4 z-50 px-3 md:px-4 max-w-[2400px] mx-auto will-change-transform-opacity"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-2xl h-14 px-4 flex items-center justify-between">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center gap-2">
          <ScopeAILogo className="w-6 h-6" />
          <span className="text-stone-900 font-bold tracking-tight">Scope AI</span>
        </Link>

        {/* Nav Links - Center */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link href="#features" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Funktioner</Link>
          <Link href="#pricing" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Priser</Link>
          <Link href="#about" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">Om oss</Link>
        </div>

        {/* Auth - Right */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors hidden md:block">
            Logga in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Kom igång
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
