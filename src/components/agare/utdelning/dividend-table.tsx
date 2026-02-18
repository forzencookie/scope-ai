import { Calendar, Wallet, Calculator, DollarSign, MoreHorizontal, Download } from "lucide-react"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { AppStatusBadge, type AppStatus } from "@/components/ui/status-badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DividendDecision } from "./use-dividend-logic"

interface UtdelningsTabellProps {
    data: DividendDecision[]
    onBook?: (dividend: DividendDecision) => void
    onPay?: (dividend: DividendDecision) => void
    onDownloadReceipt?: (dividend: DividendDecision) => void
}

const columns = [
    { label: "År", icon: Calendar, span: 2 },
    { label: "Belopp", icon: Wallet, span: 2, align: "right" as const },
    { label: "Skatt", icon: Calculator, span: 2, align: "right" as const, hiddenOnMobile: true },
    { label: "Netto", icon: DollarSign, span: 2, align: "right" as const },
    { label: "Status", span: 3 },
    { label: "", span: 1 },
]

function getStatusLabel(status: DividendDecision['status']): AppStatus {
    switch (status) {
        case 'planned': return 'Planerad'
        case 'decided': return 'Beslutad'
        case 'booked': return 'Bokförd'
        default: return 'Planerad'
    }
}

export function UtdelningsTable({ data, onBook, onPay, onDownloadReceipt }: UtdelningsTabellProps) {
    return (
        <>
            <GridTableHeader columns={columns} />
            {data.length === 0 ? (
                <div className="py-12 mt-6 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ingen utdelningshistorik</h3>
                    <p className="text-muted-foreground">Planera din första utdelning via knappen ovan.</p>
                </div>
            ) : (
                <GridTableRows>
                    {data.map((row) => (
                        <GridTableRow key={row.id}>
                            <div className="col-span-2 font-medium">{row.year}</div>
                            <div className="col-span-2 text-right tabular-nums">{row.amount.toLocaleString("sv-SE")} kr</div>
                            <div className="col-span-2 text-right text-red-600 dark:text-red-500/70 hidden md:block tabular-nums">
                                {row.tax.toLocaleString("sv-SE")} kr
                            </div>
                            <div className="col-span-2 text-right font-medium tabular-nums">{row.netAmount.toLocaleString("sv-SE")} kr</div>
                            <div className="col-span-3">
                                <AppStatusBadge status={getStatusLabel(row.status)} />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {row.status === 'decided' && onBook && (
                                            <DropdownMenuItem onClick={() => onBook(row)}>
                                                Bokför utdelning
                                            </DropdownMenuItem>
                                        )}
                                        {row.status === 'booked' && onPay && (
                                            <DropdownMenuItem onClick={() => onPay(row)}>
                                                Registrera utbetalning
                                            </DropdownMenuItem>
                                        )}
                                        {row.status === 'planned' && (
                                            <DropdownMenuItem disabled>
                                                Väntar på stämmobeslut
                                            </DropdownMenuItem>
                                        )}
                                        {(row.status === 'decided' || row.status === 'booked') && onDownloadReceipt && (
                                            <DropdownMenuItem onClick={() => onDownloadReceipt(row)}>
                                                <Download className="h-4 w-4 mr-2" />
                                                Ladda ner utdelningsavi
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem>Visa protokoll</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </GridTableRow>
                    ))}
                </GridTableRows>
            )}
        </>
    )
}
