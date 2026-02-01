import { Calendar, Wallet, Calculator, CheckCircle2, DollarSign } from "lucide-react"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { AppStatusBadge } from "@/components/ui/status-badge"

interface UtdelningsTabellProps {
    data: { year: number; amount: number; tax: number; netAmount: number; status: string }[]
}

const columns = [
    { label: "År", icon: Calendar, span: 2 },
    { label: "Belopp", icon: Wallet, span: 3, align: "right" as const },
    { label: "Skatt", icon: Calculator, span: 2, align: "right" as const, hiddenOnMobile: true },
    { label: "Netto", icon: DollarSign, span: 3, align: "right" as const },
    { label: "Status", icon: CheckCircle2, span: 2, align: "right" as const },
]

export function UtdelningsTable({ data }: UtdelningsTabellProps) {
    return (
        <>
            <GridTableHeader columns={columns} />
            {data.length === 0 ? (
                <div className="py-12 mt-6 text-center">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ingen utdelningshistorik</h3>
                    <p className="text-muted-foreground">Registrera din första utdelning via knappen ovan.</p>
                </div>
            ) : (
            <GridTableRows>
                {data.map((row) => (
                    <GridTableRow key={row.year}>
                        <div className="col-span-2 font-medium">{row.year}</div>
                        <div className="col-span-3 text-right">{row.amount.toLocaleString("sv-SE")} kr</div>
                        <div className="col-span-2 text-right text-red-600 dark:text-red-500/70 hidden md:block">{row.tax.toLocaleString("sv-SE")} kr</div>
                        <div className="col-span-3 text-right font-medium">{row.netAmount.toLocaleString("sv-SE")} kr</div>
                        <div className="col-span-2 flex justify-end">
                            <AppStatusBadge
                                status={row.status === "planned" || row.status === "planerad" ? "Planerad" : "Utbetald"}
                            />
                        </div>
                    </GridTableRow>
                ))}
            </GridTableRows>
            )}
        </>
    )
}
