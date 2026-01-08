"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"

export function Footer() {
  return (
    <footer className="bg-stone-50 text-stone-600 py-24 px-3 md:px-4 border-t border-stone-200">
      <div className="max-w-[2400px] mx-auto grid md:grid-cols-5 gap-12">
        <div className="col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <ScopeAILogo className="w-6 h-6" />
            <span className="font-mono text-stone-900 font-bold tracking-widest uppercase text-sm">
              ScopeAI
            </span>
          </Link>
          <p className="text-sm leading-relaxed max-w-xs mb-8">
            AI-driven bokföring för svenska företag. Automatisera hela din ekonomi.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Kom igång gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {[
          { title: "Produkt", links: ["Plattform", "Funktioner", "Priser", "API"] },
          { title: "Företag", links: ["Om oss", "Karriär", "Blogg", "Kontakt"] },
          { title: "Juridik", links: ["Integritetspolicy", "Villkor", "Säkerhet", "GDPR"] },
        ].map((col) => (
          <nav key={col.title} aria-labelledby={`footer-${col.title.toLowerCase()}`}>
            <h4 id={`footer-${col.title.toLowerCase()}`} className="text-stone-900 font-medium mb-6">{col.title}</h4>
            <ul className="space-y-4 text-sm">
              {col.links.map(link => (
                <li key={link}>
                  <Link
                    href="#"
                    className="hover:text-stone-900 transition-colors"
                    aria-label={`${link} - ${col.title}`}
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="max-w-[2400px] mx-auto mt-16 pt-8 border-t border-stone-200">
        <div className="text-xs text-stone-500">
          © 2024 Scope AI AB. Alla rättigheter förbehållna.
        </div>
      </div>
    </footer>
  )
}
