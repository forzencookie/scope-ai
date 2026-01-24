"use client"

import * as React from "react"
import { Search, SlidersHorizontal, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"

export interface StatusOption {
    value: string
    label: string
    icon?: React.ComponentType<{ className?: string }>
}

export interface SortOption {
    field: string
    label: string
}

interface TableToolbarProps {
    /** Search input value */
    searchValue: string
    /** Search change handler */
    onSearchChange: (value: string) => void
    /** Search placeholder */
    searchPlaceholder?: string
    /** Current status filter values */
    statusFilter?: string[]
    /** Status filter change handler */
    onStatusFilterChange?: (filter: string[]) => void
    /** Available status options */
    statusOptions?: StatusOption[]
    /** Current sort field */
    sortField?: string
    /** Sort direction */
    sortDir?: 'asc' | 'desc'
    /** Sort options */
    sortOptions?: SortOption[]
    /** Sort toggle handler */
    onSortToggle?: (field: string) => void
    /** Add new button handler */
    onAddNew?: () => void
    /** Add new button label */
    addNewLabel?: string
    /** Custom actions to render after default actions */
    children?: React.ReactNode
    /** Additional className */
    className?: string
}

export function TableToolbar({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Sök...",
    statusFilter = [],
    onStatusFilterChange,
    statusOptions = [],
    sortField,
    sortDir,
    sortOptions = [],
    onSortToggle,
    onAddNew,
    addNewLabel = "Ny",
    children,
    className,
}: TableToolbarProps) {
    const hasStatusFilter = statusOptions.length > 0 && onStatusFilterChange
    const hasSortOptions = sortOptions.length > 0 && onSortToggle
    const hasFilterMenu = hasStatusFilter || hasSortOptions

    const toggleStatusFilter = (value: string) => {
        if (!onStatusFilterChange) return
        const newFilter = statusFilter.includes(value)
            ? statusFilter.filter(v => v !== value)
            : [...statusFilter, value]
        onStatusFilterChange(newFilter)
    }

    const getSortIndicator = (field: string) => {
        if (sortField !== field) return ""
        return sortDir === "asc" ? "↑" : "↓"
    }

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {/* Search Input */}
            <InputGroup className="w-full sm:w-56">
                <InputGroupAddon>
                    <InputGroupText>
                        <Search className="h-4 w-4" />
                    </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
                {searchValue && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </InputGroup>

            {/* Filter/Sort Dropdown */}
            {hasFilterMenu && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "gap-1.5",
                                statusFilter.length > 0 && "border-primary text-primary"
                            )}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Filter
                            {statusFilter.length > 0 && (
                                <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs">
                                    {statusFilter.length}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        {hasStatusFilter && (
                            <>
                                <DropdownMenuLabel>Filtrera på status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {statusOptions.map((option) => {
                                    const Icon = option.icon
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={option.value}
                                            checked={statusFilter.includes(option.value)}
                                            onCheckedChange={() => toggleStatusFilter(option.value)}
                                        >
                                            {Icon && <Icon className="h-4 w-4 mr-2" />}
                                            {option.label}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                                {statusFilter.length > 0 && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onStatusFilterChange?.([])}>
                                            <X className="h-3.5 w-3.5 mr-2" />
                                            Rensa filter
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </>
                        )}
                        {hasStatusFilter && hasSortOptions && <DropdownMenuSeparator />}
                        {hasSortOptions && (
                            <>
                                <DropdownMenuLabel>Sortera på</DropdownMenuLabel>
                                {sortOptions.map((option) => (
                                    <DropdownMenuItem
                                        key={option.field}
                                        onClick={() => onSortToggle?.(option.field)}
                                    >
                                        {option.label} {getSortIndicator(option.field)}
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Custom children */}
            {children}

            {/* Add New Button */}
            {onAddNew && (
                <Button size="sm" onClick={onAddNew}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    {addNewLabel}
                </Button>
            )}
        </div>
    )
}
