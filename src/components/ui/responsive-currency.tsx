import { formatCurrency } from "@/lib/utils"
import { formatCurrencyCompact } from "@/lib/formatters"

/**
 * Shows full currency on sm+ screens, compact on narrow screens.
 * Use as a value prop for StatCard or inline in any component.
 */
export function ResponsiveCurrency({ amount }: { amount: number }) {
    const full = formatCurrency(amount)
    const compact = formatCurrencyCompact(amount)

    // If they're the same string, no need for responsive toggle
    if (full === compact) {
        return <>{full}</>
    }

    return (
        <>
            <span className="hidden sm:inline">{full}</span>
            <span className="sm:hidden">{compact}</span>
        </>
    )
}
