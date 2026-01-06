"use client"

import { motion } from "framer-motion"

// Wrapper that scales down actual components to create miniature preview
export function ScaledPreview({ children, scale = 0.65, className }: { children: React.ReactNode; scale?: number; className?: string }) {
    return (
        <div className={`bg-background border border-border rounded-xl overflow-hidden ${className}`}>
            {/* Window header with macOS dots */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60 bg-muted/30">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            {/* Scaled content - use a wrapper to properly contain the scaled height */}
            <div className="overflow-hidden" style={{ height: 'fit-content' }}>
                <div
                    className="origin-top-left"
                    style={{
                        transform: `scale(${scale})`,
                        width: `${100 / scale}%`,
                        marginBottom: `-${(1 - scale) * 100}%`
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

// ===== Status badge that matches AppStatusBadge styling =====
export function PreviewStatusBadge({
    status,
    variant = "neutral"
}: {
    status: string
    variant?: "success" | "warning" | "neutral"
}) {
    const variantStyles = {
        success: "text-green-700 dark:text-green-500/70 bg-green-100 dark:bg-green-900/20",
        warning: "text-amber-700 dark:text-amber-500/70 bg-amber-100 dark:bg-amber-900/20",
        neutral: "text-muted-foreground bg-muted/50"
    }

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-sm font-medium text-xs px-2 py-0.5 ${variantStyles[variant]}`}>
            {status}
        </span>
    )
}

// ===== CURSOR COMPONENT =====
export function Cursor({ x, y, click, opacity = 1 }: { x: number; y: number; click: boolean; opacity?: number }) {
    return (
        <motion.div
            className="absolute z-50 pointer-events-none drop-shadow-xl"
            animate={{ x, y, scale: click ? 0.8 : 1, opacity }}
            transition={{
                x: { type: "spring", stiffness: 150, damping: 25 },
                y: { type: "spring", stiffness: 150, damping: 25 },
                scale: { duration: 0.1 },
                opacity: { duration: 0.2 } // Fast fade
            }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 -ml-3 -mt-2">
                <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19117L11.7841 12.3673H5.65376Z" fill="black" stroke="white" strokeWidth="1" />
            </svg>
        </motion.div>
    )
}
