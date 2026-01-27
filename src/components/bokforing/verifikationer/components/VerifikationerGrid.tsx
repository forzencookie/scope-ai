import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Hash, Calendar, CreditCard, FileText, Banknote } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Verification } from "../types"
import { useHighlight } from "@/hooks"

interface VerifikationerGridProps {
    verifications: Verification[]
    selection: {
        isSelected: (id: string) => boolean
        toggle: (id: string) => void
        toggleItem: (id: string) => void
        toggleAll: () => void
        allSelected: boolean
    }
    onViewDetails: (v: Verification) => void
    onAccountFilter: (account: string) => void
}

export function VerifikationerGrid({
    verifications,
    selection,
    onViewDetails,
    onAccountFilter
}: VerifikationerGridProps) {
    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="md:min-w-[800px] px-2">
                <GridTableHeader
                    columns={[
                        { label: "Nr", icon: Hash, span: 1 },
                        { label: "Datum", icon: Calendar, span: 2 },
                        { label: "Konto", icon: CreditCard, span: 2 },
                        { label: "Beskrivning", icon: FileText, span: 4 },
                        { label: "Belopp", icon: Banknote, span: 2, align: "right" },
                    ]}
                    trailing={
                        <Checkbox
                            checked={selection.allSelected && verifications.length > 0}
                            onCheckedChange={selection.toggleAll}
                            className="mr-2"
                        />
                    }
                />

                <GridTableRows>
                    {verifications.map((v) => (
                        <VerificationRow
                            key={v.id}
                            verification={v}
                            selection={selection}
                            onViewDetails={onViewDetails}
                            onAccountFilter={onAccountFilter}
                        />
                    ))}

                    {verifications.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Inga verifikationer matchar din sökning</p>
                        </div>
                    )}
                </GridTableRows>
            </div>
        </div>
    )
}

// Individual row component with highlight support
interface VerificationRowProps {
    verification: Verification
    selection: {
        isSelected: (id: string) => boolean
        toggle: (id: string) => void
        toggleItem: (id: string) => void
    }
    onViewDetails: (v: Verification) => void
    onAccountFilter: (account: string) => void
}

function VerificationRow({
    verification: v,
    selection,
    onViewDetails,
    onAccountFilter
}: VerificationRowProps) {
    const { highlightClass } = useHighlight(String(v.id))

    return (
        <GridTableRow
            onClick={() => onViewDetails(v)}
            selected={selection.isSelected(String(v.id))}
            className={cn("cursor-pointer group", highlightClass)}
        >
            <div className="col-span-1 font-mono text-muted-foreground text-xs">
                {v.id}
            </div>
            <div className="col-span-2 text-muted-foreground">
                {v.date}
            </div>
            <div className="col-span-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAccountFilter(v.konto);
                    }}
                    className="flex flex-col items-start hover:bg-muted/50 p-1 -m-1 rounded transition-colors text-left"
                >
                    <span className="tabular-nums font-medium text-primary hover:underline">{v.konto}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-full">{v.kontoName}</span>
                </button>
            </div>
            <div className="col-span-4 font-medium truncate">
                {v.description}
            </div>
            <div className="col-span-2 text-right">
                <span className={cn(
                    "tabular-nums font-medium",
                    v.amount > 0 && "text-green-600 dark:text-green-400",
                    v.amount < 0 && "text-red-600 dark:text-red-400",
                    v.amount === 0 && "text-muted-foreground"
                )}>
                    {formatCurrency(v.amount)}
                </span>
            </div>
            <div className="col-span-1 flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={selection.isSelected(String(v.id))}
                    onCheckedChange={() => selection.toggleItem(String(v.id))}
                    className="mr-2"
                />
            </div>
        </GridTableRow>
    )
}
