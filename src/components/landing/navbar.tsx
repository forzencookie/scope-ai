"use client"

import { motion } from "framer-motion"
import Link from "next/link"

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 h-16 border-b border-stone-200 bg-white/80 backdrop-blur-md will-change-transform-opacity"
    >
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-stone-900 rounded-sm" />
          <span className="text-stone-900 font-bold tracking-tight text-lg">Scope AI</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link href="#features" className="hover:text-stone-900 transition-colors">Funktioner</Link>
            <Link href="#pricing" className="hover:text-stone-900 transition-colors">Priser</Link>
          </div>
          <div className="h-4 w-[1px] bg-stone-200 hidden md:block" />
          <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            Logga in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-md hover:bg-stone-800 transition-colors"
          >
            Kom igång
          </Link>
        </div>
      </div>
    </motion.nav>
  )
}
