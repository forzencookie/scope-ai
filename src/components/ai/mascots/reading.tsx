"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SceneProps } from "./types"
import { PixelGiraffe } from "./giraffe"
import { PixelDog } from "./dog"
import { PixelBear } from "./bear"
import { PixelDocument } from "./common"

export function MascotReadingScene({ className }: SceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-2 relative", className)}>
            {/* Floating documents */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute"
                    style={{ left: "15%", top: "10%" }}
                    animate={{ y: [0, -5, 0], rotate: [-5, 5, -5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelDocument size={28} />
                </motion.div>
                <motion.div
                    className="absolute"
                    style={{ left: "50%", top: "5%" }}
                    animate={{ y: [0, -8, 0], rotate: [3, -3, 3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                >
                    <PixelDocument size={32} />
                </motion.div>
                <motion.div
                    className="absolute"
                    style={{ right: "15%", top: "15%" }}
                    animate={{ y: [0, -6, 0], rotate: [-3, 5, -3] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                >
                    <PixelDocument size={26} />
                </motion.div>
            </div>

            {/* Giraffe - reading intently, slight head bob */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelGiraffe size={76} />
                </motion.div>
            </motion.div>

            {/* Dog in the middle - focused reading */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <motion.div
                    animate={{ y: [0, -1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <PixelDog size={60} />
                </motion.div>
            </motion.div>

            {/* Lion - studying document */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                >
                    <PixelBear size={60} />
                </motion.div>
            </motion.div>
        </div>
    )
}
