"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SceneProps } from "./types"
import { PixelGiraffe, PixelGiraffeStatic } from "./giraffe"
import { PixelDog, PixelDogStatic } from "./dog"
import { PixelBear, PixelBearStatic } from "./bear"

export function MascotCelebrationSceneStatic({ className }: SceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-6", className)}>
            {/* Static mascots - no animation */}
            <PixelGiraffeStatic size={72} />
            <PixelDogStatic size={56} />
            <PixelBearStatic size={56} />
        </div>
    )
}

export function MascotCelebrationScene({ className }: SceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-6", className)}>
            {/* Mascots - they have internal bounce animations */}
            <PixelGiraffe size={72} />
            <PixelDog size={56} />
            <PixelBear size={56} />

            {/* Sparkles */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        style={{
                            left: `${20 + i * 12}%`,
                            top: `${20 + (i % 3) * 15}%`,
                        }}
                        animate={{
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </motion.div>
        </div>
    )
}
