import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { Calendar, CheckCircle2, User, Hash, Banknote } from "lucide-react"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { TransactionDisplay, StockTransactionType } from "../types"

interface TransactionsGridProps {
    transactions: TransactionDisplay[]
    getTransactionTypeLabel: (type: string) => StockTransactionType
}

export function TransactionsGrid({ transactions, getTransactionTypeLabel }: TransactionsGridProps) {
    return (
        <div className="w-full overflow-x-auto pb-2">
            <div className="md:min-w-[700px]">
                <GridTableHeader
                    columns={[
                        { label: "Datum", icon: Calendar, span: 2 },
                        { label: "Typ", icon: CheckCircle2, span: 2 },
                        { label: "Från", icon: User, span: 2 },
                        { label: "Till", icon: User, span: 2 },
                        { label: "Aktier", icon: Hash, span: 2, align: 'right' },
                        { label: "Pris/aktie", icon: Banknote, span: 1, align: 'right' },
                        { label: "Totalt", icon: Banknote, span: 1, align: 'right' },
                    ]}
                />
            <GridTableRows>
                {transactions.map((tx) => (
                    <GridTableRow key={tx.id}>
                        {/* 1. Datum */}
                        <div className="col-span-2 text-sm">
                            {formatDate(tx.date)}
                        </div>

                        {/* 2. Typ */}
                        <div className="col-span-2">
                            <AppStatusBadge status={getTransactionTypeLabel(tx.type)} />
                        </div>

                        {/* 3. Från */}
                        <div className="col-span-2 text-sm text-muted-foreground">
                            {tx.fromShareholder || '—'}
                        </div>

                        {/* 4. Till */}
                        <div className="col-span-2 font-medium text-sm">
                            {tx.toShareholder}
                        </div>

                        {/* 5. Aktier */}
                        <div className="col-span-2 text-right">
                            <div className="tabular-nums font-medium">{tx.shares.toLocaleString('sv-SE')}</div>
                            <div className="text-xs text-muted-foreground">{tx.shareClass}-aktier</div>
                        </div>

                        {/* 6. Pris */}
                        <div className="col-span-1 tabular-nums text-sm text-muted-foreground text-right">
                            {formatCurrency(tx.pricePerShare)}
                        </div>

                        {/* 7. Totalt */}
                        <div className="col-span-1 font-medium tabular-nums text-sm text-right">
                            {formatCurrency(tx.totalPrice)}
                        </div>
                    </GridTableRow>
                ))}
            </GridTableRows>
            </div>
        </div>
    )
}
