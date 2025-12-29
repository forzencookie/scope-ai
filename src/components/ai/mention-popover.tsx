"use client"

import * as React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { FileText, Receipt, CreditCard, ScrollText, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

// Types for mentionable entities
export type MentionCategory = "faktura" | "kvitto" | "transaktion" | "konto" | "leverantor"

export interface MentionItem {
    id: string
    type: MentionCategory
    label: string
    sublabel?: string
    data?: Record<string, unknown>
}

interface MentionPopoverProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (item: MentionItem) => void
    searchQuery: string
    items: MentionItem[]
    anchorRef: React.RefObject<HTMLElement | null>
    position?: { top: number; left: number }
}

const categoryIcons: Record<MentionCategory, typeof FileText> = {
    faktura: FileText,
    kvitto: Receipt,
    transaktion: CreditCard,
    konto: ScrollText,
    leverantor: Building2,
}

const categoryLabels: Record<MentionCategory, string> = {
    faktura: "Fakturor",
    kvitto: "Kvitton",
    transaktion: "Transaktioner",
    konto: "Konton",
    leverantor: "Leverantörer",
}

export function MentionPopover({
    open,
    onOpenChange,
    onSelect,
    searchQuery,
    items,
    anchorRef,
}: MentionPopoverProps) {
    // Group items by category
    const groupedItems = React.useMemo(() => {
        const groups: Record<MentionCategory, MentionItem[]> = {
            faktura: [],
            kvitto: [],
            transaktion: [],
            konto: [],
            leverantor: [],
        }

        items.forEach(item => {
            if (groups[item.type]) {
                groups[item.type].push(item)
            }
        })

        return groups
    }, [items])

    // Filter out empty categories
    const activeCategories = Object.entries(groupedItems)
        .filter(([, items]) => items.length > 0) as [MentionCategory, MentionItem[]][]

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverAnchor asChild>
                <span ref={anchorRef as React.RefObject<HTMLSpanElement>} />
            </PopoverAnchor>
            <PopoverContent
                className="w-72 p-0"
                side="top"
                align="start"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <Command className="rounded-lg">
                    <CommandInput
                        placeholder="Sök..."
                        value={searchQuery}
                        className="h-9"
                    />
                    <CommandList className="max-h-64">
                        <CommandEmpty>Inga resultat hittades</CommandEmpty>
                        {activeCategories.map(([category, categoryItems]) => {
                            const Icon = categoryIcons[category]
                            return (
                                <CommandGroup key={category} heading={categoryLabels[category]}>
                                    {categoryItems.slice(0, 5).map((item) => (
                                        <CommandItem
                                            key={`${item.type}-${item.id}`}
                                            value={`${item.type}:${item.id}:${item.label}`}
                                            onSelect={() => onSelect(item)}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <span className="truncate block text-sm">{item.label}</span>
                                                {item.sublabel && (
                                                    <span className="text-xs text-muted-foreground truncate block">
                                                        {item.sublabel}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )
                        })}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// Hook to provide mentionable items
export function useMentionItems() {
    const [items, setItems] = React.useState<MentionItem[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        // This will be replaced with actual data fetching
        // For now, we provide category placeholders
        const categories: MentionItem[] = [
            { id: "cat-faktura", type: "faktura", label: "Fakturor", sublabel: "Sök bland fakturor" },
            { id: "cat-kvitto", type: "kvitto", label: "Kvitton", sublabel: "Sök bland kvitton" },
            { id: "cat-transaktion", type: "transaktion", label: "Transaktioner", sublabel: "Sök bland transaktioner" },
        ]

        setItems(categories)
        setIsLoading(false)
    }, [])

    return { items, isLoading }
}

// Badge component for displaying mentioned items in input
export function MentionBadge({
    item,
    onRemove
}: {
    item: MentionItem
    onRemove?: () => void
}) {
    const Icon = categoryIcons[item.type]

    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium",
            "bg-primary/10 text-primary border border-primary/20"
        )}>
            <Icon className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{item.label}</span>
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-0.5 hover:text-destructive"
                >
                    ×
                </button>
            )}
        </span>
    )
}
