"use client"

import * as React from "react"
import {
    Calendar,
    Search,
    SlidersHorizontal,
    ArrowUpRight,
    FileText,
    MoreHorizontal,
    Plus,
    User,
    Clock,
    DollarSign,
    LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { TableShell, HeaderCell, AmountText } from "@/components/table/table-shell"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Dummy data for invoices
const invoices = [
    {
        id: "INV-2024-001",
        customer: "Acme Corp",
        issueDate: "May 2, 2024",
        dueDate: "Jun 2, 2024",
        amount: "12,500.00 kr",
        status: "Paid",
    },
    {
        id: "INV-2024-002",
        customer: "Globex Inc.",
        issueDate: "May 5, 2024",
        dueDate: "Jun 5, 2024",
        amount: "45,000.00 kr",
        status: "Sent",
    },
    {
        id: "INV-2024-003",
        customer: "Soylent Corp",
        issueDate: "May 10, 2024",
        dueDate: "Jun 10, 2024",
        amount: "8,900.00 kr",
        status: "Draft",
    },
    {
        id: "INV-2024-004",
        customer: "Umbrella Corp",
        issueDate: "Apr 15, 2024",
        dueDate: "May 15, 2024",
        amount: "150,000.00 kr",
        status: "Overdue",
    },
    {
        id: "INV-2024-005",
        customer: "Stark Industries",
        issueDate: "May 20, 2024",
        dueDate: "Jun 20, 2024",
        amount: "500,000.00 kr",
        status: "Sent",
    }
]

export function InvoicesTable() {
    const statusConfig = {
        "Paid": "bg-green-50 text-green-700",
        "Sent": "bg-blue-50 text-blue-700",
        "Draft": "bg-gray-50 text-gray-600",
        "Overdue": "bg-red-50 text-red-700",
    } as const

    return (
        <div className="w-full space-y-4">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                        </div>
                        Utgående Fakturor
                    </h2>
                    <span className="text-sm text-muted-foreground ml-2">
                        {invoices.length} fakturor
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <InputGroup className="w-64">
                        <InputGroupAddon>
                            <InputGroupText>
                                <Search />
                            </InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput placeholder="Sök fakturor..." />
                    </InputGroup>
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="h-9 gap-1">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Sortera
                    </Button>
                    <Button size="sm" className="h-9 gap-1 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-3.5 w-3.5" />
                        Ny Faktura
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-hidden">
                <div className="w-full overflow-auto">
                    <TableShell
                        header={
                            <tr className="border-b border-border/50 transition-colors hover:bg-muted/50 text-left text-muted-foreground">
                                <HeaderCell label="Faktura Nr" icon={<span className="text-xs font-serif italic">#</span>} minWidth="min-w-[120px]" />
                                <HeaderCell label="Kund" icon={<User className="h-3.5 w-3.5" />} minWidth="min-w-[180px]" />
                                <HeaderCell label="Fakturadatum" icon={<Calendar className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                                <HeaderCell label="Förfallodatum" icon={<Clock className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                                <HeaderCell label="Belopp" icon={<DollarSign className="h-3.5 w-3.5" />} minWidth="min-w-[120px]" />
                                <HeaderCell label="Status" icon={<div className="h-3.5 w-3.5 rounded-full border border-current flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-current" /></div>} minWidth="min-w-[110px]" />
                                <HeaderCell label="" minWidth="min-w-[50px]" align="right" />
                            </tr>
                        }
                    >
                        {invoices.map((invoice) => (
                            <tr key={invoice.id} className="h-[36px] border-b border-border/50 transition-colors hover:bg-muted/30">
                                <td className="px-2 py-0.5">
                                    <span className="font-medium">{invoice.id}</span>
                                </td>
                                <td className="px-2 py-0.5">
                                    <span className="font-medium">{invoice.customer}</span>
                                </td>
                                <td className="px-2 py-0.5 text-muted-foreground">{invoice.issueDate}</td>
                                <td className="px-2 py-0.5 text-muted-foreground">{invoice.dueDate}</td>
                                <td className="px-2 py-0.5 text-right">
                                    <AmountText value={parseFloat(invoice.amount.replace(/[^\d.-]/g, ''))} />
                                </td>
                                <td className="px-2 py-0.5">
                                    <span className={cn(
                                        "inline-flex items-center rounded-md px-1.5 py-0 text-xs font-medium h-4",
                                        statusConfig[invoice.status as keyof typeof statusConfig]
                                    )}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-2 py-0.5 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="sr-only">Öppna meny</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                            <DropdownMenuItem>Visa detaljer</DropdownMenuItem>
                                            <DropdownMenuItem>Redigera</DropdownMenuItem>
                                            <DropdownMenuItem>Skicka påminnelse</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">Radera</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {Array.from({ length: 3 }).map((_, i) => (
                            <tr key={`empty-${i}`} className="h-[36px] border-b border-border/50 transition-colors hover:bg-muted/30">
                                <td className="px-2 py-0.5">&nbsp;</td>
                                <td className="px-2 py-0.5">&nbsp;</td>
                                <td className="px-2 py-0.5">&nbsp;</td>
                                <td className="px-2 py-0.5">&nbsp;</td>
                                <td className="px-2 py-0.5">&nbsp;</td>
                                <td className="px-2 py-0.5">&nbsp;</td>
                                <td className="px-2 py-0.5">&nbsp;</td>
                            </tr>
                        ))}
                    </TableShell>
                </div>
                {/* Footer */}
                <div className="border-t border-border/40 p-2 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-2">
                    <div className="h-4 w-4 flex items-center justify-center ml-4">
                        <span className="text-lg leading-none">+</span>
                    </div>
                    Ny Faktura
                </div>
            </div>
        </div>
    )
}
