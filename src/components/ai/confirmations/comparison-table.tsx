'use client'

import { cn } from '@/lib/utils'

export interface ComparisonRow {
    label: string
    before: string
    after: string
}

export interface ComparisonTableProps {
    title?: string
    rows: ComparisonRow[]
    className?: string
}

export function ComparisonTable({
    title,
    rows,
    className,
}: ComparisonTableProps) {
    return (
        <div className={cn('rounded-xl border border-border/60 overflow-hidden', className)}>
            {title && (
                <div className="px-4 py-2 border-b border-border/40 bg-muted/30">
                    <h4 className="text-sm font-medium">{title}</h4>
                </div>
            )}
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground w-1/3"></th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Före</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Efter</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={index} className="border-b border-border/20 last:border-0">
                            <td className="px-4 py-2 text-muted-foreground">{row.label}</td>
                            <td className="px-4 py-2 text-muted-foreground/60 line-through">{row.before}</td>
                            <td className="px-4 py-2 font-medium text-foreground">{row.after}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
