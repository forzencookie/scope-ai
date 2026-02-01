"use client"

/**
 * WalkthroughOverlay - Document/report-style overlay for structured audit results.
 * Renders like a printed report: title, prose summary, line items with inline status marks.
 */

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Check, AlertTriangle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

export interface WalkthroughSection {
    heading: string
    status: "pass" | "warning" | "fail"
    description: string
    details?: string
}

export interface WalkthroughContent {
    title: string
    summary: string
    date?: string
    aiComment?: string
    sections: WalkthroughSection[]
    actions?: Array<{
        label: string
        onClick?: () => void
        variant?: "default" | "outline"
    }>
}

// =============================================================================
// Status marks — simple text symbols, no card chrome
// =============================================================================

const STATUS_CONFIG = {
    pass: {
        icon: Check,
        iconClass: "text-emerald-600",
        bg: "bg-emerald-500/10",
        iconBg: "bg-emerald-500/20",
    },
    warning: {
        icon: AlertTriangle,
        iconClass: "text-amber-500",
        bg: "bg-amber-500/10",
        iconBg: "bg-amber-500/20",
    },
    fail: {
        icon: XCircle,
        iconClass: "text-red-500",
        bg: "bg-red-500/10",
        iconBg: "bg-red-500/20",
    },
} as const

// =============================================================================
// Component
// =============================================================================

interface WalkthroughOverlayProps {
    content: WalkthroughContent
    onClose: () => void
}

export function WalkthroughOverlay({ content, onClose }: WalkthroughOverlayProps) {
    const passCount = content.sections.filter(s => s.status === "pass").length
    const total = content.sections.length

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 overflow-y-auto bg-background/95 backdrop-blur-sm"
        >
            {/* Close button — fixed top-right */}
            <button
                onClick={onClose}
                className="fixed top-4 right-4 z-10 rounded-md p-2 hover:bg-muted transition-colors"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Document body */}
            <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mx-auto max-w-3xl px-6 py-12 font-sans"
            >
                {/* Title block */}
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
                    {content.date && (
                        <p className="mt-1 text-sm text-muted-foreground">{content.date}</p>
                    )}
                </header>

                <hr className="border-border mb-6" />

                <div className="rounded-lg bg-muted/30 px-4 py-3 mb-6">
                    <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">AI-kommentar</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {content.aiComment || 'Ingen kommentar.'}
                    </p>
                </div>

                {/* Audit items — flat list, no cards */}
                <ol className="grid grid-cols-2 gap-3 list-none pl-0">
                    {content.sections.map((section, i) => {
                        const config = STATUS_CONFIG[section.status]
                        const Icon = config.icon

                        return (
                            <motion.li
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.08 + i * 0.04 }}
                                className={cn("rounded-lg px-4 py-3 flex items-start justify-between gap-3", config.bg)}
                            >
                                <div className="min-w-0 flex-1">
                                    <span className="font-medium text-sm">{section.heading}</span>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {section.description}
                                    </p>
                                    {section.details && (
                                        <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono leading-relaxed">
                                            {section.details}
                                        </p>
                                    )}
                                </div>
                                <div className={cn("shrink-0 mt-0.5 p-1 rounded", config.iconBg)}>
                                    <Icon className={cn("h-4 w-4", config.iconClass)} />
                                </div>
                            </motion.li>
                        )
                    })}
                </ol>

                {/* Summary */}
                <p className="mt-6 text-sm text-muted-foreground">
                    {passCount} av {total} kontroller godkända.
                </p>

                <hr className="border-border mt-4 mb-6" />

                {/* Footer actions */}
                <footer className="flex items-center gap-3">
                    {content.actions?.map((action, i) => (
                        <Button
                            key={i}
                            variant={action.variant || "outline"}
                            size="sm"
                            onClick={action.onClick || onClose}
                        >
                            {action.label}
                        </Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={onClose}>
                        Stäng
                    </Button>
                </footer>
            </motion.article>
        </motion.div>
    )
}
