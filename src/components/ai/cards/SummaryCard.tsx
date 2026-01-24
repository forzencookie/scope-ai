import { Calculator } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export interface SummaryCardProps {
    title: string
    items: Array<{
        label: string
        value: string | number
        highlight?: boolean
    }>
}

export function SummaryCard({ title, items }: SummaryCardProps) {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                {title}
            </h4>
            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className={cn("font-medium", item.highlight && "text-primary font-bold")}>
                            {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
