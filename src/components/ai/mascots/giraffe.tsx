"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { MascotProps } from "./types"
import { pixelPerfectStyle } from "./styles"

export function PixelGiraffe({ className, size = 64 }: MascotProps) {
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 16 18"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        >
            {/* Horns/ossicones */}
            <rect x="4" y="0" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="4" y="0" width="2" height="1" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="8" y="0" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="7" y="0" width="2" height="1" className="fill-amber-500 dark:fill-amber-400" />
            {/* Head */}
            <rect x="3" y="2" width="7" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Face */}
            <rect x="4" y="4" width="5" height="2" className="fill-amber-200 dark:fill-amber-100" />
            {/* Eyes - happy */}
            <rect x="4" y="3" width="1" height="1" className="fill-gray-800" />
            <rect x="5" y="2" width="1" height="1" className="fill-gray-800" />
            <rect x="7" y="2" width="1" height="1" className="fill-gray-800" />
            <rect x="8" y="3" width="1" height="1" className="fill-gray-800" />
            {/* Snout spot */}
            <rect x="5" y="4" width="3" height="1" className="fill-amber-100 dark:fill-amber-50" />
            {/* Nose */}
            <rect x="6" y="5" width="1" height="1" className="fill-gray-800" />
            {/* Long neck */}
            <rect x="5" y="6" width="4" height="5" className="fill-amber-400 dark:fill-amber-300" />
            {/* Neck spots */}
            <rect x="6" y="7" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="5" y="9" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            {/* Body */}
            <rect x="3" y="11" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Body spots */}
            <rect x="4" y="12" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="7" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="5" y="14" width="1" height="1" className="fill-amber-600 dark:fill-amber-500" />
            {/* Tail - static to avoid detachment during parent animation */}
            <g>
                <rect x="11" y="12" width="1" height="2" className="fill-amber-400 dark:fill-amber-300" />
                <rect x="12" y="13" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            </g>
            {/* Legs */}
            <rect x="4" y="15" width="2" height="3" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="8" y="15" width="2" height="3" className="fill-amber-500 dark:fill-amber-400" />
            {/* Hooves */}
            <rect x="4" y="17" width="2" height="1" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="8" y="17" width="2" height="1" className="fill-amber-700 dark:fill-amber-600" />
        </motion.svg>
    )
}

export function PixelGiraffeStatic({ className, size = 64 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 18"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Horns/ossicones */}
            <rect x="4" y="0" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="4" y="0" width="2" height="1" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="8" y="0" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="7" y="0" width="2" height="1" className="fill-amber-500 dark:fill-amber-400" />
            {/* Head */}
            <rect x="3" y="2" width="7" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Face */}
            <rect x="4" y="4" width="5" height="2" className="fill-amber-200 dark:fill-amber-100" />
            {/* Eyes - happy */}
            <rect x="4" y="3" width="1" height="1" className="fill-gray-800" />
            <rect x="5" y="2" width="1" height="1" className="fill-gray-800" />
            <rect x="7" y="2" width="1" height="1" className="fill-gray-800" />
            <rect x="8" y="3" width="1" height="1" className="fill-gray-800" />
            {/* Snout spot */}
            <rect x="5" y="4" width="3" height="1" className="fill-amber-100 dark:fill-amber-50" />
            {/* Nose */}
            <rect x="6" y="5" width="1" height="1" className="fill-gray-800" />
            {/* Long neck */}
            <rect x="5" y="6" width="4" height="5" className="fill-amber-400 dark:fill-amber-300" />
            {/* Neck spots */}
            <rect x="6" y="7" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="5" y="9" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            {/* Body */}
            <rect x="3" y="11" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Body spots */}
            <rect x="4" y="12" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="7" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="5" y="14" width="1" height="1" className="fill-amber-600 dark:fill-amber-500" />
            {/* Tail - static */}
            <g>
                <rect x="11" y="12" width="1" height="2" className="fill-amber-400 dark:fill-amber-300" />
                <rect x="12" y="13" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            </g>
            {/* Legs */}
            <rect x="4" y="15" width="2" height="3" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="8" y="15" width="2" height="3" className="fill-amber-500 dark:fill-amber-400" />
            {/* Hooves */}
            <rect x="4" y="17" width="2" height="1" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="8" y="17" width="2" height="1" className="fill-amber-700 dark:fill-amber-600" />
        </svg>
    )
}

export function PixelGiraffeConfused({ className, size = 64 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 18"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Horns/ossicones */}
            <rect x="4" y="0" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="4" y="0" width="2" height="1" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="8" y="0" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="7" y="0" width="2" height="1" className="fill-amber-500 dark:fill-amber-400" />
            {/* Head */}
            <rect x="3" y="2" width="7" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Face */}
            <rect x="4" y="4" width="5" height="2" className="fill-amber-200 dark:fill-amber-100" />
            {/* Eyes - confused */}
            <rect x="4" y="3" width="2" height="2" className="fill-gray-800" />
            <rect x="7" y="3" width="2" height="2" className="fill-gray-800" />
            <rect x="4" y="3" width="1" height="1" className="fill-white" />
            <rect x="7" y="3" width="1" height="1" className="fill-white" />
            {/* Snout spot */}
            <rect x="5" y="4" width="3" height="1" className="fill-amber-100 dark:fill-amber-50" />
            {/* Nose */}
            <rect x="6" y="5" width="1" height="1" className="fill-gray-800" />
            {/* Long neck - slightly curved */}
            <rect x="5" y="6" width="4" height="5" className="fill-amber-400 dark:fill-amber-300" />
            {/* Neck spots */}
            <rect x="6" y="7" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="5" y="9" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            {/* Body */}
            <rect x="3" y="11" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
            {/* Body spots */}
            <rect x="4" y="12" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="7" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
            <rect x="5" y="14" width="1" height="1" className="fill-amber-600 dark:fill-amber-500" />
            {/* Tail - droopy */}
            <rect x="11" y="12" width="1" height="3" className="fill-amber-400 dark:fill-amber-300" />
            <rect x="12" y="14" width="1" height="2" className="fill-amber-700 dark:fill-amber-600" />
            {/* Legs */}
            <rect x="4" y="15" width="2" height="3" className="fill-amber-500 dark:fill-amber-400" />
            <rect x="8" y="15" width="2" height="3" className="fill-amber-500 dark:fill-amber-400" />
            {/* Hooves */}
            <rect x="4" y="17" width="2" height="1" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="8" y="17" width="2" height="1" className="fill-amber-700 dark:fill-amber-600" />
        </svg>
    )
}
