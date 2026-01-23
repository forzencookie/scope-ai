"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SceneProps } from "./types"
import { PixelGiraffe } from "./giraffe"
import { PixelDog } from "./dog"
import { PixelBear } from "./bear"
import { PixelBall } from "./common"

export function MascotPlayingScene({ className }: SceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-4 relative", className)}>
            {/* Giraffe on the left - tossing pose */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
            >
                <motion.div
                    animate={{ rotate: [-5, 5, -5] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelGiraffe size={80} />
                </motion.div>
            </motion.div>

            {/* Bouncing ball - arc motion, no rotation for pixel clarity */}
            <motion.div
                className="absolute"
                initial={{ x: 0, y: 0 }}
                animate={{
                    x: [0, 40, 80, 40, 0],
                    y: [0, -60, -80, -60, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                style={{ left: "30%", top: "20%" }}
            >
                <PixelBall size={20} />
            </motion.div>

            {/* Dog in the middle - jumping to catch */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    animate={{ y: [0, -30, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                    <PixelDog size={64} />
                </motion.div>
            </motion.div>

            {/* Lion on the right - cheering */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <motion.div
                    animate={{ scale: [1, 1.05, 1], y: [0, -3, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelBear size={64} />
                </motion.div>
            </motion.div>
        </div>
    )
}
