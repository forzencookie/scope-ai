"use client"

import { cn } from "@/lib/utils"
import { DataRow } from "./data-row"
import type { Block as BlockData } from "@/lib/ai/schema"

export interface BlockProps {
    block: BlockData
    className?: string
}

export function Block({ block, className }: BlockProps) {
    if (!block.rows.length) return null

    return (
        <div className={cn("w-full max-w-md py-1", className)}>
            {(block.title || block.description) && (
                <div className="mb-2">
                    {block.title && (
                        <p className="text-sm font-semibold">{block.title}</p>
                    )}
                    {block.description && (
                        <p className="text-xs text-muted-foreground">{block.description}</p>
                    )}
                </div>
            )}

            <div className="space-y-0.5">
                {block.rows.map((row, i) => (
                    <DataRow
                        key={i}
                        icon={row.icon}
                        title={row.title}
                        description={row.description}
                        timestamp={row.timestamp}
                        status={row.status}
                        amount={row.amount}
                        isNew={row.isNew}
                        highlight={row.highlight}
                        style={{ animationDelay: `${i * 60}ms` }}
                        className="animate-in fade-in slide-in-from-bottom-1 duration-200 fill-mode-both"
                    />
                ))}
            </div>
        </div>
    )
}
