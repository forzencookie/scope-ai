"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { MascotProps } from "./types"
import { pixelPerfectStyle } from "./styles"

export function PixelBear({ className, size = 64 }: MascotProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        >
            {/* Ears */}
            <rect x="2" y="1" width="3" height="3" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="11" y="1" width="3" height="3" className="fill-amber-700 dark:fill-amber-600" />
            {/* Inner ears */}
            <rect x="3" y="2" width="1" height="1" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="12" y="2" width="1" height="1" className="fill-amber-500 dark:fill-amber-400" />
            {/* Head */}
            <rect x="3" y="3" width="10" height="7" className="fill-amber-700 dark:fill-amber-600" />
            {/* Face/snout area */}
            <rect x="5" y="5" width="6" height="4" className="fill-amber-500 dark:fill-amber-400" />
            {/* Eyes - happy */}
            <rect x="5" y="5" width="1" height="1" className="fill-gray-800" />
            <rect x="6" y="4" width="1" height="1" className="fill-gray-800" />
            <rect x="9" y="4" width="1" height="1" className="fill-gray-800" />
            <rect x="10" y="5" width="1" height="1" className="fill-gray-800" />
            {/* Nose */}
            <rect x="7" y="6" width="2" height="2" className="fill-gray-900" />
            {/* Mouth */}
            <rect x="7" y="8" width="2" height="1" className="fill-amber-400 dark:fill-amber-300" />
            {/* Body */}
            <rect x="4" y="10" width="8" height="4" className="fill-amber-700 dark:fill-amber-600" />
            {/* Belly */}
            <rect x="5" y="10" width="6" height="3" className="fill-amber-500 dark:fill-amber-400" />
            {/* Arms - static, attached to body */}
            <rect x="2" y="10" width="2" height="3" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="12" y="10" width="2" height="3" className="fill-amber-700 dark:fill-amber-600" />
            {/* Paws */}
            <rect x="2" y="13" width="2" height="1" className="fill-amber-800 dark:fill-amber-700" />
            <rect x="12" y="13" width="2" height="1" className="fill-amber-800 dark:fill-amber-700" />
            {/* Feet */}
            <rect x="4" y="14" width="3" height="2" className="fill-amber-800 dark:fill-amber-700" />
            <rect x="9" y="14" width="3" height="2" className="fill-amber-800 dark:fill-amber-700" />
        </motion.svg>
    )
}

export function PixelBearStatic({ className, size = 64 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Ears */}
            <rect x="2" y="1" width="3" height="3" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="11" y="1" width="3" height="3" className="fill-amber-700 dark:fill-amber-600" />
            {/* Inner ears */}
            <rect x="3" y="2" width="1" height="1" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="12" y="2" width="1" height="1" className="fill-amber-500 dark:fill-amber-400" />
            {/* Head */}
            <rect x="3" y="3" width="10" height="7" className="fill-amber-700 dark:fill-amber-600" />
            {/* Face/snout area */}
            <rect x="5" y="5" width="6" height="4" className="fill-amber-500 dark:fill-amber-400" />
            {/* Eyes - happy */}
            <rect x="5" y="5" width="1" height="1" className="fill-gray-800" />
            <rect x="6" y="4" width="1" height="1" className="fill-gray-800" />
            <rect x="9" y="4" width="1" height="1" className="fill-gray-800" />
            <rect x="10" y="5" width="1" height="1" className="fill-gray-800" />
            {/* Nose */}
            <rect x="7" y="6" width="2" height="2" className="fill-gray-900" />
            {/* Mouth */}
            <rect x="7" y="8" width="2" height="1" className="fill-amber-400 dark:fill-amber-300" />
            {/* Body */}
            <rect x="4" y="10" width="8" height="4" className="fill-amber-700 dark:fill-amber-600" />
            {/* Belly */}
            <rect x="5" y="10" width="6" height="3" className="fill-amber-500 dark:fill-amber-400" />
            {/* Arms - static, attached to body */}
            <rect x="2" y="10" width="2" height="3" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="12" y="10" width="2" height="3" className="fill-amber-700 dark:fill-amber-600" />
            {/* Paws */}
            <rect x="2" y="13" width="2" height="1" className="fill-amber-800 dark:fill-amber-700" />
            <rect x="12" y="13" width="2" height="1" className="fill-amber-800 dark:fill-amber-700" />
            {/* Feet */}
            <rect x="4" y="14" width="3" height="2" className="fill-amber-800 dark:fill-amber-700" />
            <rect x="9" y="14" width="3" height="2" className="fill-amber-800 dark:fill-amber-700" />
        </svg>
    )
}

export function PixelBearConfused({ className, size = 64 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Ears */}
            <rect x="2" y="1" width="3" height="3" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="11" y="1" width="3" height="3" className="fill-amber-700 dark:fill-amber-600" />
            {/* Inner ears */}
            <rect x="3" y="2" width="1" height="1" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="12" y="2" width="1" height="1" className="fill-amber-500 dark:fill-amber-400" />
            {/* Head */}
            <rect x="3" y="3" width="10" height="7" className="fill-amber-700 dark:fill-amber-600" />
            {/* Face/snout area */}
            <rect x="5" y="5" width="6" height="4" className="fill-amber-500 dark:fill-amber-400" />
            {/* Eyes - confused wide open */}
            <rect x="5" y="5" width="2" height="2" className="fill-gray-800" />
            <rect x="9" y="5" width="2" height="2" className="fill-gray-800" />
            <rect x="5" y="5" width="1" height="1" className="fill-white" />
            <rect x="9" y="5" width="1" height="1" className="fill-white" />
            {/* Nose */}
            <rect x="7" y="7" width="2" height="2" className="fill-gray-900" />
            {/* Worried mouth */}
            <rect x="6" y="9" width="1" height="1" className="fill-gray-800" />
            <rect x="9" y="9" width="1" height="1" className="fill-gray-800" />
            {/* Body */}
            <rect x="4" y="10" width="8" height="4" className="fill-amber-700 dark:fill-amber-600" />
            {/* Belly */}
            <rect x="5" y="10" width="6" height="3" className="fill-amber-500 dark:fill-amber-400" />
            {/* Arms - down/droopy */}
            <rect x="2" y="10" width="2" height="4" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="12" y="10" width="2" height="4" className="fill-amber-700 dark:fill-amber-600" />
            {/* Feet */}
            <rect x="4" y="14" width="3" height="2" className="fill-amber-800 dark:fill-amber-700" />
            <rect x="9" y="14" width="3" height="2" className="fill-amber-800 dark:fill-amber-700" />
        </svg>
    )
}
