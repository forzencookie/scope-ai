'use client'

import { cn } from '@/lib/utils'
import {
    Plus,
    Pencil,
    Trash2,
    FileText,
    Receipt,
    CreditCard,
    Users,
    Calculator,
    Check
} from 'lucide-react'

export interface ActivityChange {
    label: string
    value: string
    previousValue?: string
}

export interface ActivityCardProps {
    action: 'created' | 'updated' | 'deleted' | 'calculated' | 'prepared' | 'booked'
    entityType: 'receipt' | 'transaction' | 'invoice' | 'payslip' | 'report' | 'shareholder' | 'document' | 'employee'
    title: string
    subtitle?: string
    changes: ActivityChange[]
    link?: string
    linkLabel?: string
    className?: string
}

const actionConfig = {
    created: { icon: Plus, color: 'text-green-600 dark:text-green-500', bg: 'bg-green-500/10', label: 'skapad' },
    updated: { icon: Pencil, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-500/10', label: 'uppdaterad' },
    deleted: { icon: Trash2, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-500/10', label: 'borttagen' },
    calculated: { icon: Calculator, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-500/10', label: 'beräknad' },
    prepared: { icon: FileText, color: 'text-amber-600 dark:text-amber-500', bg: 'bg-amber-500/10', label: 'förberedd' },
    booked: { icon: Check, color: 'text-emerald-600 dark:text-emerald-500', bg: 'bg-emerald-500/10', label: 'bokförd' },
}

const entityIcons = {
    receipt: Receipt,
    transaction: CreditCard,
    invoice: FileText,
    payslip: FileText,
    report: FileText,
    shareholder: Users,
    document: FileText,
    employee: Users,
}

export function ActivityCard({
    action,
    entityType,
    title,
    subtitle,
    changes,
    className,
}: ActivityCardProps) {
    const config = actionConfig[action]
    const ActionIcon = config.icon
    const EntityIcon = entityIcons[entityType]

    return (
        <div className={cn('w-full max-w-md py-1', className)}>
            {/* Header — inline, no box */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                    <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', config.bg)}>
                        <EntityIcon className={cn('h-3.5 w-3.5', config.color)} />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{title}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">{subtitle}</p>
                        )}
                    </div>
                </div>
                <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1',
                    config.bg, config.color
                )}>
                    <ActionIcon className="h-3 w-3" />
                    {config.label}
                </span>
            </div>

            {/* Changes — clean rows */}
            <div className="space-y-1 text-sm">
                {changes.map((change, index) => (
                    <div key={index} className="flex items-center py-1">
                        <span className="text-muted-foreground w-1/3 text-xs">{change.label}</span>
                        <div className="flex-1 flex items-center gap-2">
                            {change.previousValue && (
                                <>
                                    <span className="line-through text-muted-foreground/60 text-xs">{change.previousValue}</span>
                                    <span className="text-muted-foreground text-xs">→</span>
                                </>
                            )}
                            <span className="font-medium text-sm">{change.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
