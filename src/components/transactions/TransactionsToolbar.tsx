"use client"

import {
    ArrowRightLeft,
    ArrowUpDown,
    Settings,
    X,
    Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterButtonIcon } from "@/components/ui/filter-button"
import { TRANSACTION_STATUSES, type TransactionStatus } from "@/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

interface TransactionsToolbarProps {
    title: string
    subtitle?: string
    transactionCount: number
    searchQuery: string
    onSearchChange: (value: string) => void
    statusFilter: TransactionStatus[]
    onStatusFilterChange: (status: TransactionStatus) => void
    onClearStatusFilter: () => void
    sortBy: "date" | "amount" | "name"
    sortOrder: "asc" | "desc"
    onSortChange: (sortBy: "date" | "amount" | "name") => void
    onNewTransaction: () => void
}

export function TransactionsToolbar({
    title,
    subtitle,
    transactionCount,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onClearStatusFilter,
    sortBy,
    sortOrder,
    onSortChange,
    onNewTransaction,
}: TransactionsToolbarProps) {
    return (
        <div className="flex items-center justify-between pb-2">
            <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                    </div>
                    {title}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <SearchBar
                    placeholder="Sök transaktioner..."
                    value={searchQuery}
                    onChange={onSearchChange}
                    className="w-64"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <FilterButtonIcon isActive={statusFilter.length > 0} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrera på status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.values(TRANSACTION_STATUSES).map((status) => (
                            <DropdownMenuCheckboxItem
                                key={status}
                                checked={statusFilter.includes(status)}
                                onCheckedChange={() => onStatusFilterChange(status)}
                            >
                                {status}
                            </DropdownMenuCheckboxItem>
                        ))}
                        {statusFilter.length > 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onClearStatusFilter}>
                                    <X className="h-3.5 w-3.5 mr-2" />
                                    Rensa filter
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowUpDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Sortera efter</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onSortChange("date")}>
                            Datum {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("amount")}>
                            Belopp {sortBy === "amount" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("name")}>
                            Namn {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Settings className="h-4 w-4" />
                </Button>
                <Button size="sm" className="h-8 gap-1" onClick={onNewTransaction}>
                    <Plus className="h-3.5 w-3.5" />
                    Ny
                </Button>
            </div>
        </div>
    )
}
