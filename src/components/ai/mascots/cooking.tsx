"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SceneProps } from "./types"
import { PixelGiraffe } from "./giraffe"
import { PixelDog } from "./dog"
import { PixelBear } from "./bear"

export function MascotCookingScene({ className }: SceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-4", className)}>
            {/* Giraffe on the left - taller */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                <PixelGiraffe size={80} />
            </motion.div>

            {/* Center: Cooking pot with steam */}
            <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                {/* Steam particles */}
                <div className="absolute -top-8 flex gap-1">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-gray-400/60"
                        animate={{ y: [-4, -12], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                        className="w-3 h-3 rounded-full bg-gray-400/60"
                        animate={{ y: [-4, -16], opacity: [0.6, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div
                        className="w-2 h-2 rounded-full bg-gray-400/60"
                        animate={{ y: [-4, -14], opacity: [0.6, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }}
                    />
                </div>

                {/* Cooking pot */}
                <svg width="48" height="40" viewBox="0 0 12 10" shapeRendering="crispEdges">
                    {/* Pot rim */}
                    <rect x="1" y="2" width="10" height="1" className="fill-gray-600 dark:fill-gray-500" />
                    {/* Pot body */}
                    <rect x="2" y="3" width="8" height="5" className="fill-gray-700 dark:fill-gray-600" />
                    {/* Pot highlight */}
                    <rect x="3" y="4" width="1" height="3" className="fill-gray-500 dark:fill-gray-400" />
                    {/* Handles */}
                    <rect x="0" y="3" width="2" height="2" className="fill-gray-600 dark:fill-gray-500" />
                    <rect x="10" y="3" width="2" height="2" className="fill-gray-600 dark:fill-gray-500" />
                    {/* Bubbles inside */}
                    <motion.rect
                        x="5" y="4" width="1" height="1"
                        className="fill-emerald-400"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    />
                    <motion.rect
                        x="7" y="5" width="1" height="1"
                        className="fill-emerald-400"
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                    />
                </svg>
            </motion.div>

            {/* Dog in the middle - stirring */}
            <motion.div
                className="relative -ml-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <PixelDog size={64} />
                {/* Stirring spoon */}
                <motion.svg
                    width="20" height="32"
                    viewBox="0 0 5 8"
                    shapeRendering="crispEdges"
                    className="absolute -left-2 top-4"
                    animate={{ rotate: [-10, 10, -10] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{ originX: "2px", originY: "8px" }}
                >
                    <rect x="2" y="0" width="1" height="6" className="fill-amber-700 dark:fill-amber-600" />
                    <rect x="1" y="6" width="3" height="2" className="fill-gray-500 dark:fill-gray-400" />
                </motion.svg>
            </motion.div>

            {/* Lion on the right */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
            >
                <PixelBear size={64} />
            </motion.div>
        </div>
    )
}
