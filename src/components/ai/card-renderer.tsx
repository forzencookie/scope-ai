"use client"

/**
 * @deprecated Use BlockRenderer from ./blocks instead.
 * This renderer is kept for backwards compatibility.
 * New AI outputs use W: protocol and block primitives.
 */

import { cn } from "@/lib/utils"
import { CARD_REGISTRY } from "./card-registry"

export interface CardRendererProps {
    display: {
        type: string
        data?: unknown
        title?: string
        component?: string
        props?: Record<string, unknown>
    }
    className?: string
}

export function CardRenderer({ display, className }: CardRendererProps) {
    const { type, data, component, props, title } = display

    // Normalize card type
    const cardType = (type || component || "").toLowerCase()

    // Get component from registry
    const Component = CARD_REGISTRY[cardType]

    // Prepare combined props
    // Some components expect 'data' prop, others expect spread properties
    // We merge everything to be safe.
    const cardProps = {
        // Spread data (e.g. { receipt: {...} } -> props.receipt)
        ...(typeof data === 'object' ? data : {}),

        // Spread props
        ...(props || {}),

        // Explicitly pass data as 'data' prop for components that expect it (like previews)
        data: data,

        title: title,
        className
    }

    if (Component) {
        return <Component {...cardProps} />
    }

    // Fallback: render as JSON preview
    if (data) {
        return (
            <div className={cn("rounded-lg border bg-card p-4 space-y-2", className)}>
                {title && <h4 className="font-semibold">{title}</h4>}
                <pre className="text-xs overflow-auto max-h-32 text-muted-foreground">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        )
    }

    return null
}
