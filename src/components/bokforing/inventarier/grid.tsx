"use client"

import { Tag, Calendar, Banknote, Clock, Package } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
    GridTableHeader,
    GridTableRows,
    GridTableRow,
} from "@/components/ui/grid-table"
import { formatCurrency } from "@/lib/utils"
import { type Inventarie } from '@/services/inventarie-service'
import { type useBulkSelection } from "@/components/shared/bulk-action-toolbar"

interface InventarierGridProps {
    inventarier: Inventarie[]
    isLoading: boolean
    selection: ReturnType<typeof useBulkSelection>
}

export function InventarierGrid({ inventarier, isLoading, selection }: InventarierGridProps) {
    return (
        <div>
            <div className="w-full overflow-x-auto pb-2">
                <div className="md:min-w-[800px] px-2">
                    <GridTableHeader
                        gridCols={14}
                        columns={[
                            { label: "Namn", icon: Tag, span: 4 },
                            { label: "Kategori", span: 2 },
                            { label: "Inköpsdatum", icon: Calendar, span: 2 },
                            { label: "Inköpspris", icon: Banknote, span: 3 },
                            { label: "Livslängd", icon: Clock, span: 2 },
                        ]}
                        trailing={
                            <Checkbox
                                checked={selection.allSelected && inventarier.length > 0}
                                onCheckedChange={selection.toggleAll}
                                className="mr-2"
                            />
                        }
                    />

                    <GridTableRows>
                        {inventarier.map((item) => (
                            <GridTableRow
                                key={item.id}
                                gridCols={14}
                                selected={selection.isSelected(item.id)}
                                onClick={() => selection.toggleItem(item.id)}
                                className="cursor-pointer group"
                            >
                                <div style={{ gridColumn: 'span 4' }} className="font-medium truncate">
                                    {item.namn}
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground truncate">
                                    {item.kategori}
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="text-muted-foreground tabular-nums truncate">
                                    {item.inkopsdatum}
                                </div>
                                <div style={{ gridColumn: 'span 3' }} className="font-mono font-medium truncate">
                                    {formatCurrency(item.inkopspris)}
                                </div>
                                <div style={{ gridColumn: 'span 2' }} className="flex items-center h-8 truncate">
                                    <span className="text-muted-foreground">{item.livslangdAr} år</span>
                                </div>
                                <div
                                    style={{ gridColumn: 'span 1' }}
                                    className="flex justify-end items-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Checkbox
                                        checked={selection.isSelected(item.id)}
                                        onCheckedChange={() => selection.toggleItem(item.id)}
                                        className="mr-2"
                                    />
                                </div>
                            </GridTableRow>
                        ))}

                        {inventarier.length === 0 && !isLoading && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Inga tillgångar registrerade än</p>
                            </div>
                        )}

                        {isLoading && (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>Laddar...</p>
                            </div>
                        )}
                    </GridTableRows>
                </div>
            </div>
        </div>
    )
}
