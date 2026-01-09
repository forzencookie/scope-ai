"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronDown, Sparkles, FileText, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompanyType } from "@/lib/company-types"
import type { LucideIcon } from "lucide-react"

interface FeatureItem {
    title: string
    description: string
}

interface FeatureColumn {
    icon: LucideIcon
    title: string
    items: FeatureItem[]
}

// ============================================
// AI-Core & Automatisering - Same for all company types
// ============================================
const aiCoreFeatures: FeatureItem[] = [
    { title: "Bokföringsautopilot", description: "Vår AI sköter löpande bokföring, kontering och matchning automatiskt." },
    { title: "Smart händelselogg", description: "Allt som händer i bolaget loggas och sparas i en sökbar tidslinje." },
    { title: "Kvitto- & Faktura-AI", description: "Ladda upp kvitton och fakturor så tolkar och bokför AI:n åt dig direkt." },
    { title: "Ditt jobb", description: "AI:n gör grovjobbet, men du har alltid full kontroll och sista ordet." },
    { title: "Prata med AI", description: "Styr bokföringen med din röst via appen eller webben." }
]

// ============================================
// Skatt, Lön & Deklarationer - Per company type
// ============================================
const taxPayrollFeaturesByType: Record<CompanyType, FeatureItem[]> = {
    ab: [
        { title: "Lönehantering & Lönebesked", description: "Skapa löner och hantera utbetalningar till anställda smidigt." },
        { title: "Arbetsgivardeklaration (AGI)", description: "Automatisk arbetsgivardeklaration på individnivå till Skatteverket." },
        { title: "Momsdeklaration", description: "AI-assisterad momsdeklaration med automatiska beräkningar." },
        { title: "Inkomstdeklaration (INK2)", description: "Färdiga underlag för aktiebolagets årliga inkomstdeklaration." },
        { title: "K10 & Utdelning", description: "Beräkning av gränsbelopp och K10-blankett för fåmansföretag." },
        { title: "Årsredovisning (K2/K3)", description: "Komplett årsredovisning enligt K2 eller K3-regelverket." }
    ],
    ef: [
        { title: "Egenavgifter", description: "Automatisk beräkning och deklaration av dina egenavgifter." },
        { title: "Momsdeklaration", description: "AI-assisterad momsdeklaration med automatiska beräkningar." },
        { title: "NE-bilaga", description: "Färdiga underlag för NE-bilagan till din privata deklaration." },
        { title: "Förenklat årsbokslut", description: "Förenklat årsbokslut för enskilda firmor." },
        { title: "Lönehantering (om anställda)", description: "Skapa löner om du har anställda i din enskilda firma." },
        { title: "Arbetsgivardeklaration (AGI)", description: "Automatisk AGI om du har anställda." }
    ],
    hb: [
        { title: "Delägaruttag", description: "Hantera uttag för delägare och bokför automatiskt." },
        { title: "Arbetsgivardeklaration (AGI)", description: "Automatisk arbetsgivardeklaration på individnivå." },
        { title: "Momsdeklaration", description: "AI-assisterad momsdeklaration med automatiska beräkningar." },
        { title: "Inkomstdeklaration (N3A)", description: "Färdiga underlag för handelsbolagets inkomstdeklaration." },
        { title: "Förenklat årsbokslut", description: "Årsbokslut anpassat för handelsbolag." },
        { title: "Lönehantering (om anställda)", description: "Skapa löner om ni har anställda i handelsbolaget." }
    ],
    kb: [
        { title: "Delägaruttag", description: "Hantera uttag för komplementärer och kommanditdelägare." },
        { title: "Arbetsgivardeklaration (AGI)", description: "Automatisk arbetsgivardeklaration på individnivå." },
        { title: "Momsdeklaration", description: "AI-assisterad momsdeklaration med automatiska beräkningar." },
        { title: "Inkomstdeklaration (N3B)", description: "Färdiga underlag för kommanditbolagets inkomstdeklaration." },
        { title: "Förenklat årsbokslut", description: "Årsbokslut anpassat för kommanditbolag." },
        { title: "Lönehantering (om anställda)", description: "Skapa löner om ni har anställda i bolaget." }
    ],
    forening: [
        { title: "Momsdeklaration", description: "AI-assisterad momsdeklaration för momspliktig verksamhet." },
        { title: "Inkomstdeklaration", description: "Förenklad inkomstdeklaration för ideella föreningar." },
        { title: "Förenklad årsredovisning", description: "Årsredovisning anpassad för ideella föreningar." },
        { title: "Lönehantering (om anställda)", description: "Skapa löner om föreningen har anställda." },
        { title: "Arbetsgivardeklaration (AGI)", description: "Automatisk AGI om föreningen har anställda." }
    ]
}

// ============================================
// Bolagsstyrning & Insikter - Per company type
// ============================================
const governanceFeaturesByType: Record<CompanyType, FeatureItem[]> = {
    ab: [
        { title: "Aktiebok", description: "Digital aktiebok med full historik över ägare och aktieöverlåtelser." },
        { title: "Ägarinfo & Struktur", description: "Översikt över ägarstruktur och förmånstagare." },
        { title: "Styrelseprotokoll", description: "Skapa och arkivera styrelseprotokoll digitalt." },
        { title: "Bolagsstämma", description: "Underlag och protokoll för årsstämma och extra bolagsstämma." },
        { title: "Resultat- & Balansräkning", description: "Realtidsrapporter över företagets ekonomiska ställning." }
    ],
    ef: [
        { title: "Resultat- & Balansräkning", description: "Realtidsrapporter över firmans ekonomiska ställning." },
        { title: "Företagsstatistik", description: "Nyckeltal och insikter om hur verksamheten presterar." },
        { title: "Myndighetsregister", description: "Kontaktuppgifter och deadlines för myndigheter." }
    ],
    hb: [
        { title: "Delägarregister", description: "Översikt över delägare och deras andelar i bolaget." },
        { title: "Vinstfördelning", description: "Beräkning och dokumentation av vinstfördelning." },
        { title: "Resultat- & Balansräkning", description: "Realtidsrapporter över bolagets ekonomiska ställning." },
        { title: "Företagsstatistik", description: "Nyckeltal och insikter om hur bolaget presterar." }
    ],
    kb: [
        { title: "Delägarregister", description: "Översikt över komplementärer och kommanditdelägare." },
        { title: "Vinstfördelning", description: "Beräkning och dokumentation av vinstfördelning." },
        { title: "Resultat- & Balansräkning", description: "Realtidsrapporter över bolagets ekonomiska ställning." },
        { title: "Företagsstatistik", description: "Nyckeltal och insikter om hur bolaget presterar." }
    ],
    forening: [
        { title: "Medlemsregister", description: "Digitalt register över föreningens medlemmar." },
        { title: "Styrelseprotokoll", description: "Skapa och arkivera styrelseprotokoll digitalt." },
        { title: "Årsmöte", description: "Underlag och protokoll för årsmöten." },
        { title: "Resultat- & Balansräkning", description: "Realtidsrapporter över föreningens ekonomi." },
        { title: "Föreningsstatistik", description: "Nyckeltal och insikter om hur föreningen presterar." }
    ]
}

function ExpandableItem({ item, delay }: { item: FeatureItem, delay: number }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.li
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ delay, duration: 0.3 }}
            className="group"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-start gap-3 p-2 -ml-2 rounded-lg transition-all duration-200",
                    "hover:bg-stone-50",
                    isOpen && "bg-stone-50"
                )}
            >
                <motion.div
                    className="flex-shrink-0 mt-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        delay: delay + 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 15
                    }}
                >
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                </motion.div>
                <div className="flex-1 text-left">
                    <span className="text-stone-700 text-sm leading-relaxed group-hover:text-stone-900 transition-colors">
                        {item.title}
                    </span>
                </div>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <p className="text-stone-500 text-sm leading-relaxed pl-10 pr-2 pb-2">
                            {item.description}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.li>
    )
}

interface FeaturesChecklistProps {
    selectedCompanyType: CompanyType
}

export function FeaturesChecklist({ selectedCompanyType }: FeaturesChecklistProps) {
    const featureColumns: FeatureColumn[] = useMemo(() => [
        {
            icon: Sparkles,
            title: "AI-Core & Automatisering",
            items: aiCoreFeatures
        },
        {
            icon: FileText,
            title: "Skatt, Lön & Deklarationer",
            items: taxPayrollFeaturesByType[selectedCompanyType]
        },
        {
            icon: Building2,
            title: "Bolagsstyrning & Insikter",
            items: governanceFeaturesByType[selectedCompanyType]
        }
    ], [selectedCompanyType])

    return (
        <section className="px-6 md:px-12 lg:px-24 py-12 max-w-[1400px] mx-auto">
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedCompanyType}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid md:grid-cols-3 gap-12"
                >
                    {featureColumns.map((column, colIndex) => (
                        <motion.div
                            key={column.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: colIndex * 0.1 }}
                        >
                            {/* Column header */}
                            <div className="flex items-center gap-2 mb-6">
                                <column.icon className="w-4 h-4 text-stone-400" />
                                <span className="text-sm text-stone-400">{column.title}</span>
                            </div>

                            {/* Feature items with staggered animation */}
                            <ul className="space-y-1">
                                <AnimatePresence mode="popLayout">
                                    {column.items.map((item, itemIndex) => (
                                        <ExpandableItem
                                            key={`${selectedCompanyType}-${column.title}-${itemIndex}`}
                                            item={item}
                                            delay={colIndex * 0.1 + itemIndex * 0.05}
                                        />
                                    ))}
                                </AnimatePresence>
                            </ul>
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </section>
    )
}
