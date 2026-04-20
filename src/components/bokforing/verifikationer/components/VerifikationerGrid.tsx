import { useState, useRef, useEffect, useCallback } from "react"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Hash, Calendar, CreditCard, FileText, Banknote, ChevronRight } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { Verification } from "../types"
import { ActionEmptyState } from "@/components/shared"

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
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const handleRowClick = useCallback((v: Verification) => {
        const id = String(v.id)
        if (v.entries && v.entries.length > 0) {
            setExpandedId(prev => prev === id ? null : id)
        } else {
            onViewDetails(v)
        }
    }, [onViewDetails])

    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="md:min-w-[800px] px-2">
                <GridTableHeader
                    columns={[
                        { label: "", span: 1 },
                        { label: "Nr", icon: Hash, span: 1 },
                        { label: "Datum", icon: Calendar, span: 2 },
                        { label: "Konto", icon: CreditCard, span: 2 },
                        { label: "Beskrivning", icon: FileText, span: 3 },
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
                            isExpanded={expandedId === String(v.id)}
                            onRowClick={handleRowClick}
                            onAccountFilter={onAccountFilter}
                        />
                    ))}

                    {verifications.length === 0 && (
                        <ActionEmptyState
                            icon={FileText}
                            title="Huvudboken är tom"
                            description="Inga verifikationer har skapats än. Fråga Scooby att bokföra dina transaktioner."
                        />
                    )}
                </GridTableRows>
            </div>
        </div>
    )
}

// Individual row component with highlight + inline expansion support
interface VerificationRowProps {
    verification: Verification
    selection: {
        isSelected: (id: string) => boolean
        toggle: (id: string) => void
        toggleItem: (id: string) => void
    }
    isExpanded: boolean
    onRowClick: (v: Verification) => void
    onAccountFilter: (account: string) => void
}

function VerificationRow({
    verification: v,
    selection,
    isExpanded,
    onRowClick,
    onAccountFilter
}: VerificationRowProps) {
    const hasEntries = v.entries && v.entries.length > 0
    const contentRef = useRef<HTMLDivElement>(null)
    const [height, setHeight] = useState(0)

    useEffect(() => {
        if (isExpanded && contentRef.current) {
            setHeight(contentRef.current.scrollHeight)
        } else {
            setHeight(0)
        }
    }, [isExpanded])

    return (
        <div>
            <GridTableRow
                onClick={() => onRowClick(v)}
                selected={selection.isSelected(String(v.id))}
                className="cursor-pointer group"
            >
                <div className="col-span-1 flex items-center justify-center">
                    {hasEntries && (
                        <ChevronRight
                            className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                isExpanded && "rotate-90"
                            )}
                        />
                    )}
                </div>
                <div className="col-span-1 font-mono text-muted-foreground text-xs">
                    {v.verificationNumber}
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
                <div className="col-span-3 font-medium truncate">
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

            {/* Expandable entries section */}
            {hasEntries && (
                <div
                    className="overflow-hidden transition-[height] duration-200 ease-in-out"
                    style={{ height }}
                >
                    <div ref={contentRef}>
                        <div className="ml-8 mr-4 mb-2 mt-1 rounded-lg border bg-muted/20 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/30 text-xs text-muted-foreground uppercase tracking-wider">
                                        <th className="text-left px-3 py-2 font-medium">Konto</th>
                                        <th className="text-left px-3 py-2 font-medium">Beskrivning</th>
                                        <th className="text-right px-3 py-2 font-medium">Debet</th>
                                        <th className="text-right px-3 py-2 font-medium">Kredit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {v.entries!.map((entry, idx) => (
                                        <tr key={idx} className="border-b last:border-0">
                                            <td className="px-3 py-2 font-mono text-xs">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onAccountFilter(entry.account)
                                                    }}
                                                    className="text-primary hover:underline"
                                                >
                                                    {entry.account}
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 text-muted-foreground">
                                                {entry.description || "\u2014"}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {entry.debit > 0 ? (
                                                    <span className="text-green-600 dark:text-green-400">
                                                        {formatCurrency(entry.debit)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">\u2014</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums">
                                                {entry.credit > 0 ? (
                                                    <span className="text-red-600 dark:text-red-400">
                                                        {formatCurrency(entry.credit)}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">\u2014</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-muted/30 font-medium text-xs">
                                        <td className="px-3 py-2" colSpan={2}>Summa</td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {formatCurrency(v.entries!.reduce((sum, e) => sum + e.debit, 0))}
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {formatCurrency(v.entries!.reduce((sum, e) => sum + e.credit, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
