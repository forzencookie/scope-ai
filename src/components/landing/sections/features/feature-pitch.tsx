"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function FeaturePitch() {
    return (
        <section className="px-6 md:px-12 lg:px-24 py-12 max-w-[1400px] mx-auto border-t border-stone-200">
            <div className="grid md:grid-cols-3 gap-12 items-center">
                {/* Left: Headline */}
                <div className="md:sticky md:top-32 md:col-span-2">
                    <p className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-4">
                        Hur det funkar
                    </p>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-900 leading-[1.15] mb-6">
                        Din digitala sidekick
                    </h2>
                    <p className="text-stone-500 leading-relaxed max-w-md">
                        Lämna pärmar och krångel bakom dig. Scope jobbar i bakgrunden så du kan fokusera på din verksamhet.
                    </p>
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
        </section>
    )
}
