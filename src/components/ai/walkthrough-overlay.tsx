"use client"

/**
 * WalkthroughOverlay - Renders two styles based on data shape:
 *
 * 1. Audit-style (balanskontroll): sections have `status` field → 2-col grid with pass/warning/fail icons
 * 2. Document-style (momsdeklaration): sections have `amount`/`sourceRows` → financial report with breakdowns
 */

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Check, Pencil, AlertTriangle, XCircle } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

// =============================================================================
// Types
// =============================================================================

export interface WalkthroughSourceRow {
    label: string
    value: string
}

export interface WalkthroughSection {
    heading: string
    description: string
    // Audit-style fields
    status?: "pass" | "warning" | "fail"
    details?: string
    // Document-style fields
    amount?: string
    amountColor?: "default" | "red" | "green"
    sourceRows?: WalkthroughSourceRow[]
    moreLabel?: string
}

export interface WalkthroughResult {
    heading: string
    amount: string
    amountColor?: "default" | "red" | "green"
    breakdown: string[]
}

export interface WalkthroughContent {
    title: string
    summary: string
    date?: string
    aiComment?: string
    sections: WalkthroughSection[]
    result?: WalkthroughResult
    actions?: Array<{
        label: string
        onClick?: () => void
        variant?: "default" | "outline"
    }>
}

// =============================================================================
// Audit-style status config
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
    // Detect style: if any section has a `status` field, use audit-style
    const isAuditStyle = content.sections.some(s => s.status != null) && !content.result

    if (isAuditStyle) {
        return <AuditWalkthrough content={content} onClose={onClose} />
    }

    return <DocumentWalkthrough content={content} onClose={onClose} />
}

// =============================================================================
// Audit-style walkthrough (balanskontroll)
// =============================================================================

function AuditWalkthrough({ content, onClose }: WalkthroughOverlayProps) {
    const passCount = content.sections.filter(s => s.status === "pass").length
    const total = content.sections.length

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 overflow-y-auto bg-background"
        >
            <button
                onClick={onClose}
                className="fixed top-4 right-4 z-10 rounded-md p-2 hover:bg-muted transition-colors"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mx-auto max-w-3xl px-6 py-12 font-sans"
            >
                <header className="mb-6">
                    <h1 className="text-2xl font-semibold tracking-tight">{content.title}</h1>
                    {content.date && (
                        <p className="mt-1 text-sm text-muted-foreground">{content.date}</p>
                    )}
                </header>

                <hr className="border-border mb-6" />

                {content.aiComment && (
                    <div className="rounded-lg bg-muted/30 px-4 py-3 mb-6">
                        <p className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider mb-1.5">AI-kommentar</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {content.aiComment}
                        </p>
                    </div>
                )}

                <ol className="grid grid-cols-2 gap-3 list-none pl-0">
                    {content.sections.map((section, i) => {
                        const config = STATUS_CONFIG[section.status || "pass"]
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

                <p className="mt-6 text-sm text-muted-foreground">
                    {passCount} av {total} kontroller godkända.
                </p>

                <hr className="border-border mt-4 mb-6" />

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

// =============================================================================
// Document-style walkthrough (momsdeklaration, financial reports)
// =============================================================================

function DocumentWalkthrough({ content, onClose }: WalkthroughOverlayProps) {
    const [isApproved, setIsApproved] = useState(false)

    const handleApprove = () => {
        setIsApproved(true)
        setTimeout(() => onClose(), 800)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background"
        >
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 rounded-md p-2 hover:bg-muted transition-colors"
            >
                <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="w-full max-w-3xl max-h-[85vh] overflow-y-auto px-6"
            >
                <header className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">{content.title}</h1>
                    {content.summary && (
                        <p className="mt-1 text-sm text-muted-foreground">{content.summary}</p>
                    )}
                </header>

                <div className="border-b border-border mb-6" />

                {content.sections.map((section, i) => (
                    <motion.section
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.08 + i * 0.04 }}
                        className="mb-6"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <h2 className="text-base font-semibold">{section.heading}</h2>
                            {section.amount && (
                                <span className={cn(
                                    "text-base font-bold",
                                    section.amountColor === "red" && "text-red-500",
                                    section.amountColor === "green" && "text-emerald-500",
                                )}>
                                    {section.amount}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{section.description}</p>

                        {section.sourceRows && section.sourceRows.length > 0 && (
                            <div className="space-y-0.5">
                                {section.sourceRows.map((row, j) => (
                                    <div
                                        key={j}
                                        className="flex items-center justify-between text-sm px-3 py-2 rounded-md bg-muted/30"
                                    >
                                        <span className="text-muted-foreground">{row.label}</span>
                                        <span className="text-foreground/80 font-medium">{row.value}</span>
                                    </div>
                                ))}
                                {section.moreLabel && (
                                    <div className="flex items-center text-sm px-3 py-1.5 text-muted-foreground/60">
                                        <span>{section.moreLabel}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {i < content.sections.length - 1 && (
                            <div className="border-b border-border mt-6" />
                        )}
                    </motion.section>
                ))}

                {content.result && (
                    <>
                        <div className="border-b border-border mb-6" />
                        <motion.section
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.08 + content.sections.length * 0.04 }}
                            className="mb-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-base font-semibold">{content.result.heading}</h2>
                                <span className={cn(
                                    "text-lg font-bold",
                                    content.result.amountColor === "red" && "text-red-500",
                                    content.result.amountColor === "green" && "text-emerald-500",
                                )}>
                                    {content.result.amount}
                                </span>
                            </div>
                            {content.result.breakdown.length > 0 && (
                                <div className="text-sm text-muted-foreground space-y-0.5 pl-3 border-l-2 border-border">
                                    {content.result.breakdown.map((line, j) => (
                                        <p key={j} className={cn(
                                            j === content.result!.breakdown.length - 1 && "text-foreground/70 font-medium"
                                        )}>
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </motion.section>
                    </>
                )}

                <div className="border-b border-border mb-6" />

                <footer className="flex items-center gap-3 pb-6">
                    {content.actions?.map((action, i) => (
                        <button
                            key={i}
                            onClick={action.onClick || onClose}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm transition-colors",
                                action.variant === "default"
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "border border-border bg-background text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {action.label}
                        </button>
                    ))}
                    {!content.actions?.length && (
                        <>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm border border-border bg-background text-muted-foreground hover:bg-muted transition-colors"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Redigera
                            </button>
                            <button
                                onClick={handleApprove}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm text-white font-medium transition-all duration-300",
                                    isApproved
                                        ? "bg-emerald-500 scale-95 ring-2 ring-emerald-400/50"
                                        : "bg-emerald-600 hover:bg-emerald-700"
                                )}
                            >
                                <Check className="h-3.5 w-3.5" />
                                {isApproved ? "Godkänd!" : "Godkänn"}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm border border-border bg-background text-muted-foreground hover:bg-muted transition-colors ml-auto"
                            >
                                Stäng
                            </button>
                        </>
                    )}
                </footer>
            </motion.article>
        </motion.div>
    )
}
