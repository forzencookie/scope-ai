"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { MascotProps } from "./types"
import { pixelPerfectStyle } from "./styles"

export function PixelDog({ className, size = 64 }: MascotProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
            {/* Ears - floppy dog ears */}
            <rect x="2" y="3" width="3" height="2" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="11" y="3" width="3" height="2" className="fill-amber-600 dark:fill-amber-500" />
            {/* Head */}
            <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
            {/* Face markings */}
            <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
            {/* Happy closed eyes (^ ^) */}
            <rect x="5" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="6" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="7" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="9" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="10" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="11" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            {/* Nose */}
            <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
            {/* Tongue */}
            <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
            {/* Body */}
            <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Chest */}
            <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
            {/* Tail - animated */}
            <motion.rect
                x="12" y="11" width="2" height="2"
                className="fill-amber-600 dark:fill-amber-500"
                animate={{ rotate: [-10, 10, -10] }}
                transition={{ duration: 0.3, repeat: Infinity }}
                style={{ originX: "0px", originY: "1px" }}
            />
            {/* Feet */}
            <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
        </motion.svg>
    )
}

export function PixelDogStatic({ className, size = 64 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Ears - floppy dog ears */}
            <rect x="2" y="3" width="3" height="2" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="11" y="3" width="3" height="2" className="fill-amber-600 dark:fill-amber-500" />
            {/* Head */}
            <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
            {/* Face markings */}
            <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
            {/* Happy closed eyes (^ ^) */}
            <rect x="5" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="6" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="7" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="9" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="10" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="11" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            {/* Nose */}
            <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
            {/* Tongue */}
            <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
            {/* Body */}
            <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Chest */}
            <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
            {/* Tail - static */}
            <rect x="12" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
            {/* Feet */}
            <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
        </svg>
    )
}

export function PixelDogConfused({ className, size = 64 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Ears - drooped floppy */}
            <rect x="2" y="4" width="3" height="2" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="11" y="4" width="3" height="2" className="fill-amber-600 dark:fill-amber-500" />
            {/* Head */}
            <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
            {/* Face markings */}
            <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
            {/* Confused eyes (o o) - wide open */}
            <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="5" y="6" width="1" height="1" className="fill-white" />
            <rect x="9" y="6" width="1" height="1" className="fill-white" />
            {/* Nose */}
            <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
            {/* Worried mouth */}
            <rect x="6" y="9" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            <rect x="9" y="9" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
            {/* Body */}
            <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Chest */}
            <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
            {/* Tail - down */}
            <rect x="12" y="12" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
            {/* Feet */}
            <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
        </svg>
    )
}
