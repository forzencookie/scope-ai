"use client"

/**
 * Pixel Mascots - Dog, Lion, and Giraffe
 * Animated pixel art characters for the AI dialog overlay
 */

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MascotProps {
    className?: string
    size?: number
}

// ============================================================================
// Pixel Dog - Based on existing sidebar design
// ============================================================================

// Pixel-perfect rendering styles for crisp animations
const pixelPerfectStyle = {
    imageRendering: 'pixelated' as const,
    WebkitFontSmoothing: 'none' as const,
    transform: 'translateZ(0)', // GPU acceleration
    willChange: 'transform',
}

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

// ============================================================================
// Pixel Bear - Friendly and sturdy
// ============================================================================

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

// ============================================================================
// Pixel Giraffe - Tall with spots
// ============================================================================

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

// ============================================================================
// Cooking Scene - Mascots cooking together
// ============================================================================

interface CookingSceneProps {
    className?: string
}

export function MascotCookingScene({ className }: CookingSceneProps) {
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

// ============================================================================
// Static Mascot Variants - For confirmation dialogs (no animation)
// ============================================================================

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

// ============================================================================
// Static Celebration Scene - For confirmation dialogs (no animation)
// ============================================================================

export function MascotCelebrationSceneStatic({ className }: CookingSceneProps) {
    return (
        <div className={cn("flex items-end justify-center gap-6", className)}>
            {/* Static mascots - no animation */}
            <PixelGiraffeStatic size={72} />
            <PixelDogStatic size={56} />
            <PixelBearStatic size={56} />
        </div>
    )
}

// ============================================================================
// Celebration Scene - Mascots celebrating completion
// ============================================================================

export function MascotCelebrationScene({ className }: CookingSceneProps) {
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

// ============================================================================
// Playing Scene - Giraffe tosses ball, Dog jumps to catch, Lion cheers
// ============================================================================

function PixelBall({ className, size = 16 }: MascotProps) {
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

export function MascotPlayingScene({ className }: CookingSceneProps) {
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

// ============================================================================
// Reading Scene - Mascots gathered around floating documents
// ============================================================================

function PixelDocument({ className, size = 24 }: MascotProps) {
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

export function MascotReadingScene({ className }: CookingSceneProps) {
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

// ============================================================================
// Searching Scene - Dog with magnifying glass, others pointing
// ============================================================================

function PixelMagnifyingGlass({ className, size = 24 }: MascotProps) {
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

export function MascotSearchingScene({ className }: CookingSceneProps) {
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

// ============================================================================
// Scene Type Export
// ============================================================================

export type SceneType = 'cooking' | 'playing' | 'reading' | 'searching' | 'error'

export const SCENE_COMPONENTS: Record<SceneType, React.ComponentType<CookingSceneProps>> = {
    cooking: MascotCookingScene,
    playing: MascotPlayingScene,
    reading: MascotReadingScene,
    searching: MascotSearchingScene,
    error: MascotErrorScene,
}

// ============================================================================
// Confused Mascots - For error states
// ============================================================================

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

// ============================================================================
// Error Scene - Confused mascots looking at each other
// ============================================================================

export function MascotErrorScene({ className }: CookingSceneProps) {
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


