"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import type { CompanyType } from "@/lib/company-types"
import { CompanyTypeToggle } from "../../shared/company-type-toggle"
import { FeaturesChecklist } from "./features-checklist"

export function FeaturePitch() {
    const [selectedType, setSelectedType] = useState<CompanyType>("ab")

    return (
        <>
            <section className="px-6 md:px-12 lg:px-24 py-12 max-w-[1400px] mx-auto border-t border-stone-200">
                <div className="grid md:grid-cols-3 gap-12 items-center">
                    {/* Left: Headline */}
                    <div className="md:sticky md:top-32 md:col-span-2">
                        <p className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4">
                            Funktioner
                        </p>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 leading-[1.15] mb-6">
                            Din digitala sidekick
                        </h2>
                        <p className="text-stone-500 leading-relaxed max-w-md mb-6">
                            Lämna pärmar och krångel bakom dig. Scope jobbar i bakgrunden så du kan fokusera på din verksamhet.
                        </p>

                        {/* Desktop: Toggle under subtext */}
                        <div className="hidden md:block">
                            <p className="text-xs text-stone-400 mb-2">Välj din bolagsform:</p>
                            <CompanyTypeToggle
                                selected={selectedType}
                                onChange={setSelectedType}
                            />
                        </div>
                    </div>

                    {/* Right: Featured Image */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="relative w-full aspect-square max-w-[400px] mx-auto md:max-w-none md:aspect-[4/3] md:col-span-1"
                    >
                        <Image
                            src="/scopeaiimage.svg"
                            alt="Scope AI Dashboard Preview"
                            fill
                            className="object-contain scale-125"
                            priority
                        />
                    </motion.div>
                </div>

                {/* Mobile: Toggle under the dog image */}
                <div className="md:hidden mt-8 text-center">
                    <p className="text-xs text-stone-400 mb-2">Välj din bolagsform:</p>
                    <CompanyTypeToggle
                        selected={selectedType}
                        onChange={setSelectedType}
                    />
                </div>
            </section>

            {/* Features Checklist - receives selected company type */}
            <FeaturesChecklist selectedCompanyType={selectedType} />
        </>
    )
}
