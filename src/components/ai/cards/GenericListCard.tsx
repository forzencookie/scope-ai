import { formatCurrency, cn } from "@/lib/utils"
import { z } from "zod"

export const GenericListItemSchema = z.object({
    primary: z.string(),
    secondary: z.string().optional(),
    value: z.union([z.string(), z.number()]).optional()
})

export const GenericListSchema = z.object({
    title: z.string().optional(),
    icon: z.string().optional(),
    items: z.array(GenericListItemSchema).optional(),
    className: z.string().optional()
}).catchall(z.unknown())

export type GenericListProps = z.infer<typeof GenericListSchema>

export interface GenericListCardProps {
    title: string
    icon?: string
    items: Array<{
        primary: string
        secondary?: string
        value?: string | number
    }>
}

export function GenericListCard({ title, items }: GenericListCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <h4 className="font-semibold">{title}</h4>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.primary} className="flex items-center justify-between py-1.5 border-b last:border-0">
                        <div>
                            <p className="text-sm font-medium">{item.primary}</p>
                            {item.secondary && (
                                <p className="text-xs text-muted-foreground">{item.secondary}</p>
                            )}
                        </div>
                        {item.value !== undefined && (
                            <span className="text-sm font-medium">
                                {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

// Smart wrapper that finds array data in props
export function SmartListCard(props: GenericListProps) {
    const { title, className, items: propsItems, icon, ...rest } = props
    
    // If items are already provided in the correct format
    if (propsItems && Array.isArray(propsItems)) {
        return <GenericListCard title={title || "Lista"} items={propsItems} />
    }

    // Otherwise try to find an array in the props
    const dataArray = Object.values(rest).find(v => Array.isArray(v)) as unknown[] | undefined

    if (dataArray && dataArray.length > 0) {
        const items = dataArray.slice(0, 5).map((item: unknown) => {
            const record = item as Record<string, unknown>
            return {
                primary: String(record.description || record.vendor || record.name || record.customer || record.title || ""),
                secondary: String(record.date || record.period || record.dueDate || ""),
                value: (record.amount || record.value || record.total) as number | undefined,
            }
        })
        return <GenericListCard title={title || "Lista"} items={items} />
    }

    // Fallback if no array found
    return (
        <div className={cn("rounded-lg border bg-card p-4", className)}>
            <p className="text-muted-foreground text-sm">Data visas i {title || "listan"}</p>
        </div>
    )
}
