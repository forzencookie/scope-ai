"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Navbar, Footer, AnimatedDitherArt } from "@/components/landing"
import { ThemeProvider } from "@/providers/theme-provider"
import { Shield, Lock, Eye, Server, UserCheck, FileText, Mail, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Section Data for easier mapping and TOC generation
const sections = [
    {
        id: "collection",
        title: "Information vi samlar in",
        icon: FileText,
        content: (
            <div className="space-y-4 text-stone-600">
                <p>
                    Vi samlar in information som du aktivt tillhandahåller till oss för att kunna leverera en automatiserad och träffsäker bokföringstjänst.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm">
                        <h4 className="font-semibold text-stone-900 mb-1">Användardata</h4>
                        <p className="text-sm">Namn, e-post, telefonnummer och inloggningsuppgifter för att hantera ditt konto.</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm">
                        <h4 className="font-semibold text-stone-900 mb-1">Företagsdata</h4>
                        <p className="text-sm">Organisationsnummer, företagsnamn och adressuppgifter för fakturering och bokföring.</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm">
                        <h4 className="font-semibold text-stone-900 mb-1">Finansiell Data</h4>
                        <p className="text-sm">Kvitton, leverantörsfakturor, kontoutdrag och Z-rapporter som du laddar upp för tolkning.</p>
                    </div>
                    <div className="p-4 bg-white rounded-xl border border-stone-100 shadow-sm">
                        <h4 className="font-semibold text-stone-900 mb-1">Användningsdata</h4>
                        <p className="text-sm">Loggar över hur du interagerar med plattformen för att hjälpa oss förbättra UX och säkerhet.</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: "usage",
        title: "Hur vi använder datan",
        icon: Server,
        content: (
            <div className="space-y-4 text-stone-600">
                <p>
                    Datat används primärt för att leverera kärntjänsten: automatiserad bokföring. Vi tränar inte publika AI-modeller på din specifika data utan ditt medgivande.
                </p>
                <ul className="list-disc pl-5 space-y-2 mt-2 marker:text-stone-400">
                    <li>För att extrahera och kategorisera data från dina uppladdade dokument med AI.</li>
                    <li>För att generera verifikationsförslag och rapporter.</li>
                    <li>För att säkerställa driftsäkerhet, upptäcka fel och förhindra missbruk.</li>
                    <li>För att kommunicera viktiga uppdateringar om tjänsten.</li>
                </ul>
            </div>
        )
    },
    {
        id: "sharing",
        title: "Delning av information",
        icon: Eye,
        content: (
            <div className="space-y-4 text-stone-600">
                <p>
                    Din data är din tillgång. Vi säljer aldrig personuppgifter till annonsörer eller tredje part. Delning sker endast när det är strikt nödvändigt för tjänstens funktion.
                </p>
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 text-sm">
                    <strong>Tjänsteleverantörer:</strong> Vi använder betrodda underbiträden för hosting (t.ex. molnservrar), betalningslösningar och mailutskick. Alla dessa binds av strikta databehandlingsavtal (DPA).
                </div>
            </div>
        )
    },
    {
        id: "security",
        title: "Säkerhet & Lagring",
        icon: Lock,
        content: (
            <div className="space-y-4 text-stone-600">
                <p>
                    Säkerhet är inbyggt i vår plattform från grunden.
                </p>
                <ul className="grid sm:grid-cols-2 gap-3 text-sm">
                    <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        All data krypteras (&quot;at rest&quot;) och vid överföring.
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Regelbundna säkerhetskopior (backups).
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Strikta åtkomstkontroller för personal.
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Servrar placerade inom EU/EES.
                    </li>
                </ul>
            </div>
        )
    },
    {
        id: "rights",
        title: "Dina Rättigheter (GDPR)",
        icon: UserCheck,
        content: (
            <div className="space-y-4 text-stone-600">
                <p>
                    Du har full kontroll över din data enligt Dataskyddsförordningen.
                </p>
                <div className="grid gap-3 mt-4">
                    {[
                        { label: "Rätten till tillgång", desc: "Begär utdrag av all data vi har om dig." },
                        { label: "Rätten till radering", desc: "Begär att vi raderar all din personliga data ('Rätten att bli bortglömd')." },
                        { label: "Rätten till rättelse", desc: "Korrigera felaktig information." },
                        { label: "Dataportabilitet", desc: "Få ut din data i ett maskinläsbart format." },
                    ].map((right) => (
                        <div key={right.label} className="flex items-start gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors">
                            <Shield className="w-5 h-5 text-stone-400 mt-0.5" />
                            <div>
                                <strong className="text-stone-900 block text-sm">{right.label}</strong>
                                <span className="text-sm text-stone-500">{right.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    },
    {
        id: "contact",
        title: "Kontakt",
        icon: Mail,
        content: (
            <div className="text-stone-600">
                <p className="mb-4">
                    Om du har frågor om hur vi hanterar din data eller vill utöva dina rättigheter, tveka inte att höra av dig.
                </p>
                <a href="mailto:support@scopeai.se" className="inline-flex items-center gap-2 text-stone-900 font-semibold border-b-2 border-stone-200 hover:border-stone-900 transition-colors pb-0.5">
                    support@scopeai.se
                </a>
            </div>
        )
    }
]

export default function PrivacyPolicyPage() {
    const [activeSection, setActiveSection] = useState("collection")

    // Handle scroll spy
    useEffect(() => {
        const handleScroll = () => {
            const sectionElements = sections.map(s => document.getElementById(s.id))
            const scrollPosition = window.scrollY + 200 // Offset

            for (const section of sectionElements) {
                if (section && section.offsetTop <= scrollPosition && (section.offsetTop + section.offsetHeight) > scrollPosition) {
                    setActiveSection(section.id)
                }
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id)
        if (element) {
            const offset = 100 // adjust for sticky header
            const bodyRect = document.body.getBoundingClientRect().top
            const elementRect = element.getBoundingClientRect().top
            const elementPosition = elementRect - bodyRect
            const offsetPosition = elementPosition - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            })
        }
    }

    return (
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
            <main className="light min-h-screen bg-white font-sans text-stone-900 selection:bg-stone-200 selection:text-stone-900 overflow-x-hidden">
                <AnimatedDitherArt />
                
                <div className="relative z-10">
                    <Navbar />

                    <div className="pt-32 pb-16 px-6 md:px-12 lg:px-24 max-w-[1400px] mx-auto">
                        {/* Header */}
                        <div className="max-w-3xl mb-16">
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                                Integritet & Säkerhet
                            </h1>
                            <p className="text-xl text-stone-600 leading-relaxed">
                                Vi värdesätter ditt förtroende. Här går vi igenom hur vi hanterar, skyddar och använder din data för att ge dig en så bra tjänst som möjligt.
                            </p>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
                            {/* Desktop Sidebar / TOC */}
                            <aside className="hidden lg:block w-72 shrink-0 h-fit sticky top-32">
                                <div className="space-y-1">
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 px-3">Innehåll</h3>
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => scrollToSection(section.id)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 flex items-center justify-between group",
                                                activeSection === section.id 
                                                    ? "bg-stone-100 text-stone-900 font-medium" 
                                                    : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                                            )}
                                        >
                                            <span className="flex items-center gap-3">
                                                <section.icon className={cn("w-4 h-4", activeSection === section.id ? "text-stone-900" : "text-stone-400 group-hover:text-stone-600")} />
                                                {section.title}
                                            </span>
                                            {activeSection === section.id && (
                                                <ChevronRight className="w-3 h-3 text-stone-900" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </aside>

                            {/* Main Content */}
                            <div className="flex-1 max-w-3xl space-y-16">
                                {sections.map((section, idx) => (
                                    <motion.section
                                        key={section.id}
                                        id={section.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                                        className="scroll-mt-32"
                                    >
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                                                <section.icon className="w-5 h-5 text-stone-700" />
                                            </div>
                                            <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
                                        </div>
                                        
                                        <div className="text-lg leading-relaxed pl-1 md:pl-14">
                                            {section.content}
                                        </div>

                                        {idx !== sections.length - 1 && (
                                            <div className="mt-16 h-px bg-stone-100 w-full" />
                                        )}
                                    </motion.section>
                                ))}
                                
                                <div className="pt-8 border-t border-stone-100">
                                    <p className="text-sm text-stone-400 italic">Senast uppdaterad: 24 Januari 2026</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>
            </main>
        </ThemeProvider>
    )
}
