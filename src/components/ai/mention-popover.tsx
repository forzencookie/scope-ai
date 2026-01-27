"use client"

import * as React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover"
import { FileText, Receipt, CreditCard, ScrollText, Building2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
    PAGE_CONTEXTS, 
    PAGE_CATEGORIES, 
    getPagesByCategory, 
    searchPages,
    formatPageContextForAI,
    type PageContext, 
    type PageCategory 
} from "@/data/page-contexts"

// =============================================================================
// Types
// =============================================================================

export type MentionCategory = "faktura" | "kvitto" | "transaktion" | "konto" | "leverantor" | "page"

export interface MentionItem {
    id: string
    type: MentionCategory
    label: string
    sublabel?: string
    data?: Record<string, unknown>
    /** For page mentions, the page context */
    pageContext?: PageContext
    /** Formatted context for AI */
    aiContext?: string
}

interface MentionPopoverProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (item: MentionItem) => void
    searchQuery: string
    items?: MentionItem[] // Optional custom items
    anchorRef: React.RefObject<HTMLElement | null>
    position?: { top: number; left: number }
}

// Category icons for non-page items
const categoryIcons: Record<MentionCategory, LucideIcon> = {
    faktura: FileText,
    kvitto: Receipt,
    transaktion: CreditCard,
    konto: ScrollText,
    leverantor: Building2,
    page: FileText, // Default, pages use their own icons
}

// Category labels
const categoryLabels: Record<MentionCategory, string> = {
    faktura: "Fakturor",
    kvitto: "Kvitton",
    transaktion: "Transaktioner",
    konto: "Konton",
    leverantor: "Leverantörer",
    page: "Sidor",
}

// Map PageCategory to display labels
const pageCategoryLabels: Record<PageCategory, string> = {
    bokforing: "📒 Bokföring",
    rapporter: "📊 Rapporter & Deklarationer",
    loner: "💰 Löner & Personal",
    agare: "🏢 Ägare & Styrning",
    ovrigt: "⚙️ Övrigt",
}

// =============================================================================
// Component
// =============================================================================

export function MentionPopover({
    open,
    onOpenChange,
    onSelect,
    searchQuery,
    items: customItems,
    anchorRef,
}: MentionPopoverProps) {
    const [internalSearch, setInternalSearch] = React.useState("")
    
    // Get pages organized by category
    const pagesByCategory = React.useMemo(() => getPagesByCategory(), [])
    
    // Filter pages based on search
    const filteredPages = React.useMemo(() => {
        if (!internalSearch) return pagesByCategory
        
        const matching = searchPages(internalSearch)
        const grouped: Record<PageCategory, PageContext[]> = {
            bokforing: [],
            rapporter: [],
            loner: [],
            agare: [],
            ovrigt: [],
        }
        
        matching.forEach(page => {
            grouped[page.category].push(page)
        })
        
        return grouped
    }, [pagesByCategory, internalSearch])

    // Convert PageContext to MentionItem
    const pageToMentionItem = React.useCallback((page: PageContext): MentionItem => ({
        id: `page-${page.id}`,
        type: "page",
        label: page.title,
        sublabel: page.description.slice(0, 60) + (page.description.length > 60 ? '...' : ''),
        pageContext: page,
        aiContext: formatPageContextForAI(page),
        data: {
            url: page.url,
            capabilities: page.aiCapabilities,
            tools: page.relatedTools,
        },
    }), [])

    // Get category order
    const categoryOrder: PageCategory[] = ['bokforing', 'rapporter', 'loner', 'agare', 'ovrigt']

    // Check if we have any results
    const hasResults = categoryOrder.some(cat => filteredPages[cat].length > 0)

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverAnchor asChild>
                <span ref={anchorRef as React.RefObject<HTMLSpanElement>} />
            </PopoverAnchor>
            <PopoverContent
                className="w-80 p-0"
                side="top"
                align="start"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <Command className="rounded-lg">
                    <CommandInput
                        placeholder="Sök sidor..."
                        value={internalSearch}
                        onValueChange={setInternalSearch}
                        className="h-9"
                    />
                    <CommandList className="max-h-80">
                        {!hasResults && (
                            <CommandEmpty>Inga sidor hittades</CommandEmpty>
                        )}
                        
                        {categoryOrder.map(category => {
                            const pages = filteredPages[category]
                            if (pages.length === 0) return null
                            
                            return (
                                <CommandGroup 
                                    key={category} 
                                    heading={pageCategoryLabels[category]}
                                >
                                    {pages.map((page) => {
                                        const Icon = page.icon
                                        return (
                                            <CommandItem
                                                key={page.id}
                                                value={`${page.id}:${page.title}:${page.keywords.join(' ')}`}
                                                onSelect={() => onSelect(pageToMentionItem(page))}
                                                className="flex items-start gap-2 cursor-pointer py-2"
                                            >
                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium block text-sm">{page.title}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                                        {page.description.slice(0, 50)}...
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            )
                        })}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// =============================================================================
// Hook to provide mentionable items
// =============================================================================

export function useMentionItems() {
    const [items, setItems] = React.useState<MentionItem[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        // Convert all pages to mention items
        const pageItems: MentionItem[] = PAGE_CONTEXTS.map(page => ({
            id: `page-${page.id}`,
            type: "page" as const,
            label: page.title,
            sublabel: page.description.slice(0, 60),
            pageContext: page,
            aiContext: formatPageContextForAI(page),
            data: {
                url: page.url,
                capabilities: page.aiCapabilities,
                tools: page.relatedTools,
            },
        }))

        setItems(pageItems)
        setIsLoading(false)
    }, [])

    return { items, isLoading }
}

// =============================================================================
// Badge component for displaying mentioned items
// =============================================================================

export function MentionBadge({
    item,
    onRemove
}: {
    item: MentionItem
    onRemove?: () => void
}) {
    // For page mentions, use the page's icon
    const Icon = item.pageContext?.icon || categoryIcons[item.type]

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

// =============================================================================
// Export helpers for external use
// =============================================================================

export { PAGE_CONTEXTS, PAGE_CATEGORIES, getPagesByCategory, searchPages, formatPageContextForAI }
export type { PageContext, PageCategory }
