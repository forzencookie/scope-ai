"use client"

import { motion } from "framer-motion"

// Wrapper that scales down actual components to create miniature preview
export function ScaledPreview({
    children,
    scale = 0.65,
    className,
    extendToBottom = false,
    variant = "default"
}: {
    children: React.ReactNode;
    scale?: number;
    className?: string;
    extendToBottom?: boolean;
    variant?: "default" | "flush" | "responsive-flush" // flush = extendToBottom
}) {
    // Logic for variants
    // default: rounded-xl, border, border-border
    // flush: rounded-t-xl, border-t border-x, border-border (old extendToBottom)
    // responsive-flush: rounded-xl border (mobile) -> rounded-t-xl border-x border-t border-b-0 (desktop)

    // Backward compatibility
    const effectiveVariant = extendToBottom ? "flush" : variant

    const getClasses = () => {
        const base = `bg-background overflow-hidden ${className || ''}`

        if (effectiveVariant === "flush") {
            return `${base} rounded-t-xl border-t border-x border-border`
        }

        if (effectiveVariant === "responsive-flush") {
            // Mobile: Standard box (rounded-xl, border)
            // Desktop: Flush bottom (rounded-t-xl, border-t/x, no bottom border/rounding)
            return `${base} rounded-xl border border-border md:rounded-b-none md:border-b-0`
        }

        // Default
        return `${base} rounded-xl border border-border`
    }

    return (
        <div className={getClasses()}>
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

// ===== Status badge with explicit light mode colors =====
export function PreviewStatusBadge({
    status,
    variant = "neutral"
}: {
    status: string
    variant?: "success" | "warning" | "neutral"
}) {
    // Harmonized colors - darker + lower opacity for subtle effect
    const variantStyles = {
        success: "text-emerald-700 bg-emerald-600/15", // darker green, lower opacity
        warning: "text-[#d97706] bg-[#fef3c7]", // amber-600, amber-100
        neutral: "text-[#57534e] bg-[#f5f5f4]"  // stone-600, stone-100
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
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                <path d="M11.3,20.4c-0.3-0.4-0.6-1.1-1.2-2c-0.3-0.5-1.2-1.5-1.5-1.9c-0.2-0.4-0.2-0.6-0.1-1c0.1-0.6,0.7-1.1,1.4-1.1c0.5,0,1,0.4,1.4,0.7c0.2,0.2,0.5,0.6,0.7,0.8c0.2,0.2,0.2,0.3,0.4,0.5c0.2,0.3,0.3,0.5,0.2,0.1c-0.1-0.5-0.2-1.3-0.4-2.1c-0.1-0.6-0.2-0.7-0.3-1.1c-0.1-0.5-0.2-0.8-0.3-1.3c-0.1-0.3-0.2-1.1-0.3-1.5c-0.1-0.5-0.1-1.4,0.3-1.8c0.3-0.3,0.9-0.4,1.3-0.2c0.5,0.3,0.8,1,0.9,1.3c0.2,0.5,0.4,1.2,0.5,2c0.2,1,0.5,2.5,0.5,2.8c0-0.4-0.1-1.1,0-1.5c0.1-0.3,0.3-0.7,0.7-0.8c0.3-0.1,0.6-0.1,0.9-0.1c0.3,0.1,0.6,0.3,0.8,0.5c0.4,0.6,0.4,1.9,0.4,1.8c0.1-0.4,0.1-1.2,0.3-1.6c0.1-0.2,0.5-0.4,0.7-0.5c0.3-0.1,0.7-0.1,1,0c0.2,0,0.6,0.3,0.7,0.5c0.2,0.3,0.3,1.3,0.4,1.7c0,0.1,0.1-0.4,0.3-0.7c0.4-0.6,1.8-0.8,1.9,0.6c0,0.7,0,0.6,0,1.1c0,0.5,0,0.8,0,1.2c0,0.4-0.1,1.3-0.2,1.7c-0.1,0.3-0.4,1-0.7,1.4c0,0-1.1,1.2-1.2,1.8c-0.1,0.6-0.1,0.6-0.1,1c0,0.4,0.1,0.9,0.1,0.9s-0.8,0.1-1.2,0c-0.4-0.1-0.9-0.8-1-1.1c-0.2-0.3-0.5-0.3-0.7,0c-0.2,0.4-0.7,1.1-1.1,1.1c-0.7,0.1-2.1,0-3.1,0c0,0,0.2-1-0.2-1.4c-0.3-0.3-0.8-0.8-1.1-1.1L11.3,20.4z" fill="white" stroke="#000" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="19.6" y1="20.7" x2="19.6" y2="17.3" stroke="#000" strokeWidth="0.75" strokeLinecap="round" />
                <line x1="17.6" y1="20.7" x2="17.5" y2="17.3" stroke="#000" strokeWidth="0.75" strokeLinecap="round" />
                <line x1="15.6" y1="17.3" x2="15.6" y2="20.7" stroke="#000" strokeWidth="0.75" strokeLinecap="round" />
            </svg>
        </motion.div>
    )
}
