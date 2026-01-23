import { Search, ArrowRightLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionsEmptyStateProps } from "../types"

export function TransactionsEmptyState({ hasFilters, onAddTransaction }: TransactionsEmptyStateProps) {
    return (
        <tr className="h-[200px]">
            <td colSpan={6} className="text-center">
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        {hasFilters ? (
                            <Search className="h-8 w-8 text-muted-foreground/50" />
                        ) : (
                            <ArrowRightLeft className="h-8 w-8 text-muted-foreground/50" />
                        )}
                    </div>
                    <p className="font-medium text-foreground mb-1">
                        {hasFilters ? "Inga transaktioner matchar din sökning" : "Här är det tomt — ännu!"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {hasFilters
                            ? "Försök med andra söktermer eller avaktivera något filter"
                            : "Koppla din bank så börjar vi jobba — du kommer älska hur enkelt det blir"}
                    </p>
                    {!hasFilters && (
                        <Button size="sm" onClick={onAddTransaction}>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Lägg till transaktion
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    )
}
