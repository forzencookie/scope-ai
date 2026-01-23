import { Calendar, Wallet, Calculator, DollarSign, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppStatusBadge } from "@/components/ui/status-badge"

interface DividendTableProps {
    data: { year: number; amount: number; tax: number; netAmount: number; status: string }[]
    className?: string
}

export function DividendTable({ data, className }: DividendTableProps) {
    return (
        <table className={cn("w-full text-sm border-y-2 border-border/60", className)}>
            <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                    <th className="text-left px-3 py-2 font-medium">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            År
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <Wallet className="h-3.5 w-3.5" />
                            Belopp
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <Calculator className="h-3.5 w-3.5" />
                            Skatt
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            Netto
                        </span>
                    </th>
                    <th className="text-right px-3 py-2 font-medium">
                        <span className="flex items-center justify-end gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Status
                        </span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {data.map((row) => (
                    <tr key={row.year} className="border-b border-border/40">
                        <td className="px-3 py-2 font-medium">{row.year}</td>
                        <td className="text-right px-3 py-2">{row.amount.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2 text-red-600 dark:text-red-500/70">{row.tax.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2 font-medium">{row.netAmount.toLocaleString("sv-SE")} kr</td>
                        <td className="text-right px-3 py-2">
                            <AppStatusBadge
                                status={row.status === "planned" || row.status === "planerad" ? "Planerad" : "Utbetald"}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
