"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

export interface AuditCheck {
    name: string
    status: "pass" | "warning" | "fail"
    description: string
    details?: string
}

export interface AuditResult {
    date?: string
    checks: AuditCheck[]
    summary: {
        total: number
        passed: number
        warnings: number
        failed: number
    }
}

export interface AuditCardProps {
    audit?: AuditResult
    data?: AuditResult
    className?: string
}

const statusConfig = {
    pass:    { icon: CheckCircle2, color: "text-green-600 dark:text-green-400",  bg: "bg-green-500/10" },
    warning: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    fail:    { icon: XCircle,       color: "text-red-600 dark:text-red-400",      bg: "bg-red-500/10" },
}

function CheckRow({ check }: { check: AuditCheck }) {
    const config = statusConfig[check.status]
    const Icon = config.icon
    return (
        <div className={cn("flex items-start gap-3 px-3 py-2.5 rounded-lg", config.bg)}>
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
            <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{check.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{check.description}</p>
                {check.details && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{check.details}</p>
                )}
            </div>
        </div>
    )
}

export function AuditCard({ audit, data, className }: AuditCardProps) {
    const result = audit ?? data
    if (!result) return null
    const { checks, summary } = result
    const overallStatus = summary.failed > 0 ? "fail" : summary.warnings > 0 ? "warning" : "pass"
    const { icon: OverallIcon, color } = statusConfig[overallStatus]
    return (
        <div className={cn("space-y-1.5", className)}>
            {checks.map((check, i) => <CheckRow key={i} check={check} />)}
            <div className="flex items-center gap-2 pt-2 px-1">
                <OverallIcon className={cn("h-3.5 w-3.5", color)} />
                <span className="text-xs text-muted-foreground">
                    {summary.passed}/{summary.total} godkända
                    {summary.warnings > 0 && ` · ${summary.warnings} varningar`}
                    {summary.failed > 0 && ` · ${summary.failed} fel`}
                    {result.date && ` · ${result.date}`}
                </span>
            </div>
        </div>
    )
}
