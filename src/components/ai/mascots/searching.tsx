"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SceneProps } from "./types"
import { PixelGiraffe } from "./giraffe"
import { PixelDog } from "./dog"
import { PixelBear } from "./bear"
import { PixelMagnifyingGlass } from "./common"

export function MascotSearchingScene({ className }: SceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-4 relative", className)}>
            {/* Giraffe - pointing with head direction */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.div
                    animate={{ rotate: [0, 3, 0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelGiraffe size={76} />
                </motion.div>
            </motion.div>

            {/* Dog in the middle - with magnifying glass, scanning */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    animate={{ x: [-5, 5, -5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelDog size={64} />
                </motion.div>
                {/* Magnifying glass - moves with scanning */}
                <motion.div
                    className="absolute -top-2 -right-4"
                    animate={{ x: [-5, 5, -5], rotate: [-10, 10, -10] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelMagnifyingGlass size={32} />
                </motion.div>
            </motion.div>

            {/* Lion - looking and pointing */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelBear size={60} />
                </motion.div>
            </motion.div>

            {/* Search sparkles/indicators */}
            <div className="absolute inset-0 pointer-events-none">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-primary rounded-full"
                        style={{
                            left: `${30 + i * 20}%`,
                            top: `${30 + (i % 2) * 10}%`,
                        }}
                        animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.4,
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
