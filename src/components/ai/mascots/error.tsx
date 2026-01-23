"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SceneProps } from "./types"
import { PixelGiraffeConfused } from "./giraffe"
import { PixelDogConfused } from "./dog"
import { PixelBearConfused } from "./bear"

export function MascotErrorScene({ className }: SceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-4 relative", className)}>
            {/* Giraffe - looking at others confused */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
            >
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelGiraffeConfused size={72} />
                </motion.div>
                {/* Question mark - positioned above giraffe's head */}
                <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl font-bold text-amber-500"
                    animate={{ y: [0, -3, 0], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    ?
                </motion.div>
            </motion.div>

            {/* Dog in the middle - scratching head */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelDogConfused size={56} />
                </motion.div>
                {/* Exclamation/question mark - centered above dog */}
                <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl font-bold text-red-500"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                    !?
                </motion.div>
            </motion.div>

            {/* Bear on the right - shrugging */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative"
            >
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                    <PixelBearConfused size={56} />
                </motion.div>
                {/* Question mark - positioned above bear's head */}
                <motion.div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl font-bold text-amber-500"
                    animate={{ y: [0, -3, 0], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                >
                    ?
                </motion.div>
            </motion.div>
        </div>
    )
}
