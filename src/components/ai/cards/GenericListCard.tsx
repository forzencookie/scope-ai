import { formatCurrency, cn } from "@/lib/utils"

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
                {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-1.5 border-b last:border-0">
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
export function SmartListCard(props: any) {
    const { title, className, ...rest } = props
    
    // If items are already provided in the correct format
    if (props.items && Array.isArray(props.items)) {
        return <GenericListCard title={title || "Lista"} items={props.items} />
    }

    // Otherwise try to find an array in the props
    const dataArray = Object.values(rest).find(v => Array.isArray(v)) as unknown[] | undefined

    if (dataArray && dataArray.length > 0) {
        const items = dataArray.slice(0, 5).map((item: any) => {
            return {
                primary: String(item.description || item.vendor || item.name || item.customer || item.title || ""),
                secondary: String(item.date || item.period || item.dueDate || ""),
                value: (item.amount || item.value || item.total) as number | undefined,
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
