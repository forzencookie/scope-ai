"use client"

import { User, Calendar, Banknote, Wallet, CheckCircle2, Search } from "lucide-react"
import { GridTableHeader, GridTableRow, GridTableRows } from "@/components/ui/grid-table"
import { PreviewStatusBadge } from "./shared"

export function PayrollPreview() {
    // Mock data matching real component
    const mockPayslips = [
        { id: 1, employee: "Amira Hassan", period: "Jan 2026", grossSalary: 42000, tax: 12600, netSalary: 29400, status: "Skickad" },
        { id: 2, employee: "Erik Eriksson", period: "Jan 2026", grossSalary: 38000, tax: 11400, netSalary: 26600, status: "Skickad" },
        { id: 3, employee: "Alejandro Garcia", period: "Jan 2026", grossSalary: 46000, tax: 13800, netSalary: 32200, status: "Väntar" },
        { id: 4, employee: "Wei Chen", period: "Jan 2026", grossSalary: 35000, tax: 10500, netSalary: 24500, status: "Väntar" },
        { id: 5, employee: "Sarah Nilsson", period: "Jan 2026", grossSalary: 41000, tax: 12300, netSalary: 28700, status: "Väntar" },
        { id: 6, employee: "Omar Khalid", period: "Jan 2026", grossSalary: 39500, tax: 11850, netSalary: 27650, status: "Väntar" },
        { id: 7, employee: "Klara Lindberg", period: "Jan 2026", grossSalary: 33000, tax: 9900, netSalary: 23100, status: "Väntar" },
        { id: 8, employee: "Yasmin Al-Fayed", period: "Jan 2026", grossSalary: 44000, tax: 13200, netSalary: 30800, status: "Väntar" }
    ]
    return (
        <div className="w-full bg-background h-full flex flex-col">
            {/* Window controls */}
            <div className="flex gap-1.5 px-4 pt-4 pb-2 border-b border-border/40">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
            </div>

            <div className="px-6 pt-6 pb-2">
                {/* Sub-header & Search */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Lönespecifikationer</h3>

                    {/* Search Bar */}
                    <div className="relative w-40 opacity-60 pointer-events-none select-none">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <div className="w-full h-7 pl-7 pr-2 rounded-md border border-input bg-muted/20 text-xs flex items-center text-muted-foreground">
                            Sök anställd...
                        </div>
                    </div>
                </div>

                {/* GridTable Header - 6 columns (Status restored & balanced) */}
                <GridTableHeader
                    columns={[
                        { label: "Anställd", icon: User, span: 2 },
                        { label: "Period", icon: Calendar, span: 2 },
                        { label: "Brutto", icon: Banknote, span: 2, align: 'right' },
                        { label: "Skatt", icon: Banknote, span: 2, align: 'right' },
                        { label: "Netto", icon: Wallet, span: 2, align: 'right' },
                        { label: "Status", icon: CheckCircle2, span: 2, align: 'center' },
                    ]}
                />

                {/* GridTable Rows */}
                <GridTableRows>
                    {mockPayslips.map((slip) => (
                        <GridTableRow key={slip.id}>
                            <div className="col-span-2 font-medium text-sm text-foreground whitespace-nowrap overflow-hidden text-ellipsis">{slip.employee}</div>
                            <div className="col-span-2 text-sm text-muted-foreground whitespace-nowrap">{slip.period}</div>
                            <div className="col-span-2 text-right tabular-nums text-foreground/90 whitespace-nowrap">
                                {slip.grossSalary.toLocaleString("sv-SE")} kr
                            </div>
                            <div className="col-span-2 text-right tabular-nums text-red-600 whitespace-nowrap">
                                -{slip.tax.toLocaleString("sv-SE")} kr
                            </div>
                            <div className="col-span-2 text-right tabular-nums font-medium text-foreground whitespace-nowrap">
                                {slip.netSalary.toLocaleString("sv-SE")} kr
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <PreviewStatusBadge
                                    status={slip.status}
                                    variant={slip.status === "Skickad" ? "success" : "warning"}
                                />
                            </div>
                        </GridTableRow>
                    ))}
                </GridTableRows>
            </div>
        </div>
    )
}


