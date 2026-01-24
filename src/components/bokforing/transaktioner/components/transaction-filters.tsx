"use client"

import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/ui/search-bar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { TRANSACTION_STATUSES } from "@/types"
import { useTextMode } from "@/providers/text-mode-provider"

interface TransactionFiltersProps {
    title: string
    searchQuery: string
    onSearchChange: (query: string) => void
    statusFilter: string[]
    onStatusFilterChange: (status: string) => void
    onStatusFilterClear: () => void
}

export function TransactionFilters({
    title,
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onStatusFilterClear
}: TransactionFiltersProps) {
    const { text } = useTextMode()

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
            <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                {title}
            </h3>
            <div className="flex items-center gap-2">
                <SearchBar
                    placeholder={text.transactions?.search || "Sök transaktioner..."}
                    value={searchQuery}
                    onChange={onSearchChange}
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn("h-9 gap-1", statusFilter.length > 0 && "border-primary text-primary")}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            {text.actions?.filter || "Filtrera"}
                            {statusFilter.length > 0 && (
                                <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">
                                    {statusFilter.length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{text.labels?.filterByStatus || "Filtrera på status"}</DropdownMenuLabel>
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
                                <DropdownMenuItem onClick={onStatusFilterClear}>
                                    <X className="h-3.5 w-3.5 mr-2" />
                                    {text.actions?.clearFilter || "Rensa filter"}
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
