"use client"

import * as React from "react"
import {
    Calendar,
    Search,
    SlidersHorizontal,
    Tag,
    ArrowUpRight,
    FileText,
    Paperclip,
    MoreHorizontal,
    UploadCloud,
    Building2,
    LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { TableShell, HeaderCell, CategoryBadge, AmountText } from "@/components/table/table-shell"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Dummy data for receipts
const receipts = [
    {
        id: "1",
        supplier: "Adobe Systems",
        date: "May 2, 2024",
        amount: "-239.00 kr",
        status: "Verified",
        category: "Software",
        attachment: "invoice_adobe_may.pdf"
    },
    {
        id: "2",
        supplier: "Uber Receipts",
        date: "May 5, 2024",
        amount: "-189.00 kr",
        status: "Pending",
        category: "Travel",
        attachment: "uber_ride_may5.pdf"
    },
    {
        id: "3",
        supplier: "Amazon Web Services",
        date: "May 10, 2024",
        amount: "-450.00 kr",
        status: "Verified",
        category: "Hosting",
        attachment: "aws_invoice_may.pdf"
    },
    {
        id: "4",
        supplier: "Kjell & Company",
        date: "May 12, 2024",
        amount: "-899.00 kr",
        status: "Processing",
        category: "Office Supplies",
        attachment: "receipt_kjell.jpg"
    },
    {
        id: "5",
        supplier: "Apple Store",
        date: "May 15, 2024",
        amount: "-24,995.00 kr",
        status: "Review Needed",
        category: "Equipment",
        attachment: "macbook_pro.pdf"
    }
]

export function ReceiptsTable() {
    const statusConfig = {
        "Verified": "bg-green-50 text-green-700",
        "Pending": "bg-yellow-50 text-yellow-800",
        "Processing": "bg-blue-50 text-blue-700",
        "Review Needed": "bg-red-50 text-red-700",
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
                        Inkomna Underlag
                    </h2>
                    <span className="text-sm text-muted-foreground ml-2">
                        {receipts.length} dokument
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <InputGroup className="w-64">
                        <InputGroupAddon>
                            <InputGroupText>
                                <Search />
                            </InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput placeholder="Sök underlag..." />
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
                        <UploadCloud className="h-3.5 w-3.5" />
                        Ladda upp
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-hidden">
                <div className="w-full overflow-auto">
                    <TableShell
                        header={
                            <tr className="border-b border-border/50 transition-colors hover:bg-muted/50 text-left text-muted-foreground">
                                <HeaderCell label="Leverantör" icon={<Building2 className="h-3.5 w-3.5" />} minWidth="min-w-[180px]" />
                                <HeaderCell label="Datum" icon={<Calendar className="h-3.5 w-3.5" />} minWidth="min-w-[120px]" />
                                <HeaderCell label="Kategori" icon={<Tag className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                                <HeaderCell label="Belopp" icon={<span className="text-xs font-serif italic">123</span>} minWidth="min-w-[120px]" />
                                <HeaderCell label="Status" icon={<div className="h-3.5 w-3.5 rounded-full border border-current flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-current" /></div>} minWidth="min-w-[130px]" />
                                <HeaderCell label="Bilaga" icon={<Paperclip className="h-3.5 w-3.5" />} minWidth="min-w-[140px]" />
                                <HeaderCell label="" minWidth="min-w-[50px]" align="right" />
                            </tr>
                        }
                    >
                        {receipts.map((receipt) => (
                            <tr key={receipt.id} className="h-[36px] border-b border-border/50 transition-colors hover:bg-muted/30">
                                <td className="px-2 py-0.5">
                                    <span className="font-medium">{receipt.supplier}</span>
                                </td>
                                <td className="px-2 py-0.5 text-muted-foreground">{receipt.date}</td>
                                <td className="px-2 py-0.5">
                                    <CategoryBadge>{receipt.category}</CategoryBadge>
                                </td>
                                <td className="px-2 py-0.5 text-right">
                                    <AmountText value={parseFloat(receipt.amount.replace(/[^\d.-]/g, ''))} />
                                </td>
                                <td className="px-2 py-0.5">
                                    <span className={cn(
                                        "inline-flex items-center rounded-md px-1.5 py-0 text-xs font-medium h-4",
                                        statusConfig[receipt.status as keyof typeof statusConfig]
                                    )}>
                                        {receipt.status}
                                    </span>
                                </td>
                                <td className="px-2 py-0.5 text-muted-foreground">
                                    <div className="flex items-center gap-2 hover:text-foreground cursor-pointer transition-colors">
                                        <Paperclip className="h-3.5 w-3.5" />
                                        <span className="text-xs truncate max-w-[100px]">{receipt.attachment}</span>
                                    </div>
                                </td>
                                <td className="px-2 py-0.5 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" >
                                                <span className="sr-only">Öppna meny</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Åtgärder</DropdownMenuLabel>
                                            <DropdownMenuItem>Visa detaljer</DropdownMenuItem>
                                            <DropdownMenuItem>Redigera</DropdownMenuItem>
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
                    Nytt underlag
                </div>
            </div>
        </div>
    )
}
