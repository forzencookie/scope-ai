"use client"

import { cn } from "@/lib/utils"
import { MascotProps } from "./types"
import { pixelPerfectStyle } from "./styles"

// ============================================================================
// Playing Scene Props
// ============================================================================

export function PixelBall({ className, size = 16 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 8 8"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Ball - red with white highlight */}
            <rect x="2" y="0" width="4" height="1" className="fill-red-500" />
            <rect x="1" y="1" width="6" height="1" className="fill-red-500" />
            <rect x="0" y="2" width="8" height="4" className="fill-red-500" />
            <rect x="1" y="6" width="6" height="1" className="fill-red-500" />
            <rect x="2" y="7" width="4" height="1" className="fill-red-500" />
            {/* Highlight */}
            <rect x="2" y="2" width="2" height="2" className="fill-red-300" />
        </svg>
    )
}

// ============================================================================
// Reading Scene Props
// ============================================================================

export function PixelDocument({ className, size = 24 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 10 12"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Paper */}
            <rect x="0" y="0" width="10" height="12" className="fill-white dark:fill-gray-100" />
            {/* Fold corner */}
            <rect x="7" y="0" width="3" height="3" className="fill-gray-200 dark:fill-gray-300" />
            {/* Text lines */}
            <rect x="1" y="2" width="5" height="1" className="fill-gray-400" />
            <rect x="1" y="4" width="7" height="1" className="fill-gray-400" />
            <rect x="1" y="6" width="6" height="1" className="fill-gray-400" />
            <rect x="1" y="8" width="7" height="1" className="fill-gray-400" />
            <rect x="1" y="10" width="4" height="1" className="fill-gray-400" />
        </svg>
    )
}

// ============================================================================
// Searching Scene Props
// ============================================================================

export function PixelMagnifyingGlass({ className, size = 24 }: MascotProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 12 12"
            shapeRendering="crispEdges"
            className={cn("", className)}
            style={pixelPerfectStyle}
        >
            {/* Glass frame */}
            <rect x="2" y="0" width="6" height="1" className="fill-gray-600 dark:fill-gray-500" />
            <rect x="1" y="1" width="2" height="1" className="fill-gray-600 dark:fill-gray-500" />
            <rect x="7" y="1" width="2" height="1" className="fill-gray-600 dark:fill-gray-500" />
            <rect x="0" y="2" width="1" height="4" className="fill-gray-600 dark:fill-gray-500" />
            <rect x="9" y="2" width="1" height="4" className="fill-gray-600 dark:fill-gray-500" />
            <rect x="1" y="6" width="2" height="1" className="fill-gray-600 dark:fill-gray-500" />
            <rect x="7" y="6" width="2" height="1" className="fill-gray-600 dark:fill-gray-500" />
            <rect x="2" y="7" width="6" height="1" className="fill-gray-600 dark:fill-gray-500" />
            {/* Glass interior - light blue tint */}
            <rect x="2" y="2" width="6" height="4" className="fill-sky-200/60 dark:fill-sky-300/40" />
            {/* Handle */}
            <rect x="8" y="7" width="1" height="1" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="9" y="8" width="1" height="1" className="fill-amber-700 dark:fill-amber-600" />
            <rect x="10" y="9" width="2" height="2" className="fill-amber-700 dark:fill-amber-600" />
            {/* Shine */}
            <rect x="3" y="3" width="2" height="1" className="fill-white/80" />
        </svg>
    )
}
