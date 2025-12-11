import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-stone-50 text-stone-600 py-24 px-6 border-t border-stone-200">
      <div className="max-w-[1400px] mx-auto grid md:grid-cols-5 gap-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 bg-stone-900 rounded-sm" />
            <span className="text-stone-900 font-bold tracking-tight text-lg">Scope AI</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs mb-8">
            The operating system for the next generation of Swedish companies.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {[
          { title: "Product", links: ["Platform", "Features", "Pricing", "API"] },
          { title: "Company", links: ["About", "Careers", "Blog", "Contact"] },
          { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR"] },
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
      
      <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-stone-200">
        <div className="text-xs text-stone-500">
          © 2024 Scope AI AB. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
