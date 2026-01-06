'use client'

import { cn } from '@/lib/utils'
import {
    Check,
    Plus,
    Pencil,
    Trash2,
    FileText,
    Receipt,
    CreditCard,
    Users,
    Calculator,
    ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export interface ActivityChange {
    label: string
    value: string
    previousValue?: string
}

export interface ActivityCardProps {
    action: 'created' | 'updated' | 'deleted' | 'calculated' | 'prepared'
    entityType: 'receipt' | 'transaction' | 'invoice' | 'payslip' | 'report' | 'shareholder' | 'document'
    title: string
    subtitle?: string
    changes: ActivityChange[]
    link?: string
    linkLabel?: string
    className?: string
}

const actionConfig = {
    created: { icon: Plus, color: 'text-green-600 dark:text-green-500', bg: 'bg-green-500/10', label: '+1 ny' },
    updated: { icon: Pencil, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-500/10', label: 'uppdaterad' },
    deleted: { icon: Trash2, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-500/10', label: 'borttagen' },
    calculated: { icon: Calculator, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-500/10', label: 'beräknad' },
    prepared: { icon: FileText, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-500/10', label: 'förberedd' },
}

const entityIcons = {
    receipt: Receipt,
    transaction: CreditCard,
    invoice: FileText,
    payslip: FileText,
    report: FileText,
    shareholder: Users,
    document: FileText,
}

export function ActivityCard({
    action,
    entityType,
    title,
    subtitle,
    changes,
    link,
    linkLabel,
    className,
}: ActivityCardProps) {
    const config = actionConfig[action]
    const ActionIcon = config.icon
    const EntityIcon = entityIcons[entityType]

    return (
        <div
            className={cn(
                'rounded-xl border border-border/60 bg-card overflow-hidden',
                className
            )}
        >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-border/40">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', config.bg)}>
                        <EntityIcon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                </div>
                <span className={cn(
                    'text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1',
                    config.bg, config.color
                )}>
                    <ActionIcon className="h-3 w-3" />
                    {config.label}
                </span>
            </div>

            {/* Changes */}
            <div className="px-4 py-3 space-y-2">
                {changes.map((change, index) => (
                    <div key={index} className="flex items-center text-sm">
                        <span className="text-muted-foreground w-1/3">{change.label}</span>
                        <div className="flex-1 flex items-center gap-2">
                            {change.previousValue && (
                                <>
                                    <span className="line-through text-muted-foreground/60">{change.previousValue}</span>
                                    <span className="text-muted-foreground">→</span>
                                </>
                            )}
                            <span className="font-medium">{change.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Link */}
            {link && (
                <div className="px-4 py-3 border-t border-border/40">
                    <Link
                        href={link}
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                        {linkLabel || 'Öppna'}
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </div>
            )}
        </div>
    )
}
