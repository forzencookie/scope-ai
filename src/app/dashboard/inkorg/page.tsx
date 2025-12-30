"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Inbox,
    Mail,
    FileText,
    Receipt,
    Building2,
    AlertCircle,
    CheckCircle2,
    Clock,
    Sparkles,
    ArrowRight,
    MoreHorizontal,
    Menu,
    Trash2,
    Archive,
    Star,
    StarOff,
    Download,
    ExternalLink,
    Link2,
    Upload,
    RefreshCw,
    CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useToast } from "@/components/ui/toast"
import { SearchBar } from "@/components/ui/search-bar"
import { FilterTabs } from "@/components/ui/filter-tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import data from the data layer
import { categoryColors, categoryLabels } from "@/data/inbox"
import type { InboxItem, InboxFilter } from "@/types"

// Category filter type
type CategoryFilter = "all" | "kvitto" | "faktura" | "leverantorsfaktura" | "annat"

export default function InboxPage() {
    const router = useRouter()
    const toast = useToast()
    const [items, setItems] = useState<InboxItem[]>([])
    const [filter, setFilter] = useState<InboxFilter>("all")
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")

    const fetchItems = async () => {
        try {
            const response = await fetch('/api/receive')
            const data = await response.json()
            if (data.items) {
                setItems(data.items)

                // Trigger AI processing for any pending items
                const hasPending = data.items.some((i: InboxItem) => !i.aiStatus || i.aiStatus === 'pending')
                if (hasPending) {
                    await fetch('/api/ai/process-inbox', { method: 'POST' })
                    // Refetch to get updated statuses
                    const updated = await fetch('/api/receive')
                    const updatedData = await updated.json()
                    if (updatedData.items) {
                        setItems(updatedData.items)
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch inbox items:", error)
        }
    }

    // Fetch inbox items on mount and focus
    useEffect(() => {
        fetchItems()

        const onFocus = () => fetchItems()
        window.addEventListener('focus', onFocus)

        return () => window.removeEventListener('focus', onFocus)
    }, [])

    const filteredItems = items.filter(item => {
        // Apply status filter (unread/starred)
        if (filter === "unread" && item.read) return false
        if (filter === "starred" && !item.starred) return false

        // Apply category filter
        if (categoryFilter !== "all") {
            // Check if item has been categorized (approved by user)
            if (categoryFilter === "kvitto" && item.category !== "kvitto") return false
            if (categoryFilter === "faktura" && item.category !== "faktura") return false
            if (categoryFilter === "leverantorsfaktura" && item.category !== "leverantorsfaktura") return false
            if (categoryFilter === "annat" && item.category !== "annat") return false
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                item.title.toLowerCase().includes(query) ||
                item.sender.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query)
            )
        }
        return true
    })

    const unreadCount = items.filter(i => !i.read).length

    const handleArchive = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id))
    }

    const handleToggleStar = (id: string) => {
        setItems(prev => prev.map(i =>
            i.id === id ? { ...i, starred: !i.starred } : i
        ))
    }

    const handleMarkRead = (id: string) => {
        setItems(prev => prev.map(i =>
            i.id === id ? { ...i, read: true } : i
        ))
    }

    const handleDownload = (e: React.MouseEvent, item: InboxItem) => {
        e.stopPropagation()
        toast.info("Nedladdning påbörjad", `${item.title} laddas ner som PDF`)
    }

    const handleOpenInKivra = (item: InboxItem) => {
        toast.info("Öppnar i Kivra", `${item.title} öppnas i Kivra-appen`)
    }

    return (
        <div className="flex flex-col min-h-svh">
            {/* Navigation Header */}
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Inkorg</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <BreadcrumbAIBadge />
            </header>

            <div className="flex flex-col gap-6 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <Inbox className="h-6 w-6" />
                            Inkorg
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Digital post från myndigheter och företag via Kivra
                        </p>
                    </div>

                    {/* Upload Invoice Button Removed */}

                </div>

                {/* Filter tabs with Search */}
                <div className="flex items-center justify-between border-b-2 border-border/60 pb-2">
                    <FilterTabs
                        variant="buttons"
                        size="sm"
                        value={filter}
                        onChange={(v) => setFilter(v as "all" | "unread" | "starred")}
                        options={[
                            { value: "all", label: "Alla", count: items.length },
                            { value: "unread", label: "Olästa", count: unreadCount, icon: <Mail className="h-3.5 w-3.5" /> },
                            { value: "starred", label: "Stjärnmärkta", count: items.filter(i => i.starred).length, icon: <Star className="h-3.5 w-3.5" /> },
                        ]}
                    />
                    <div className="flex items-center gap-2">
                        <SearchBar
                            placeholder="Sök i inkorg..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                        />
                        {/* Category filter dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={`h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted/50 transition-colors ${categoryFilter !== "all" ? "text-primary" : "text-muted-foreground"}`}
                                >
                                    <Menu className="h-3.5 w-3.5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    onClick={() => setCategoryFilter("all")}
                                    className="flex items-center justify-between"
                                >
                                    <span>Alla</span>
                                    {categoryFilter === "all" && <CheckCircle className="h-4 w-4 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setCategoryFilter("kvitto")}
                                    className="flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4" />
                                        Kvitton
                                    </span>
                                    {categoryFilter === "kvitto" && <CheckCircle className="h-4 w-4 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setCategoryFilter("faktura")}
                                    className="flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Fakturor (utgående)
                                    </span>
                                    {categoryFilter === "faktura" && <CheckCircle className="h-4 w-4 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setCategoryFilter("leverantorsfaktura")}
                                    className="flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4" />
                                        Leverantörsfakturor
                                    </span>
                                    {categoryFilter === "leverantorsfaktura" && <CheckCircle className="h-4 w-4 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setCategoryFilter("annat")}
                                    className="flex items-center justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Övrigt
                                    </span>
                                    {categoryFilter === "annat" && <CheckCircle className="h-4 w-4 text-primary" />}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Mail list */}
                <div className="flex flex-col gap-2">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                handleMarkRead(item.id)
                                router.push(`/dashboard/inkorg/${item.id}`)
                            }}
                            className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-colors group cursor-pointer ${item.aiStatus === 'error'
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30'
                                : `border-border/60 hover:bg-muted/30 ${!item.read ? "bg-muted/20" : ""}`
                                }`}
                        >
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    {!item.read && (
                                        <span className="w-2 h-2 rounded-full bg-foreground" />
                                    )}
                                    <span className="text-sm text-muted-foreground">{item.sender}</span>
                                    <span className={`text-xs ${categoryColors[item.category]}`}>
                                        {categoryLabels[item.category]}
                                    </span>
                                    {item.aiStatus === 'error' && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">
                                            AI Error
                                        </span>
                                    )}
                                </div>
                                <p className={`font-medium truncate ${!item.read ? "text-foreground" : ""}`}>
                                    {item.title}
                                </p>
                                <p className="text-sm text-muted-foreground truncate">{item.description}</p>

                                {item.aiStatus === 'error' && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <AlertCircle className="h-3 w-3 text-red-500" />
                                        <span className="text-xs text-red-600 dark:text-red-400">
                                            AI-bearbetning misslyckades - klicka för att försöka igen
                                        </span>
                                    </div>
                                )}

                                {item.aiSuggestion && item.aiStatus !== 'error' && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Sparkles className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">AI: {item.aiSuggestion}</span>
                                    </div>
                                )}
                                {item.linkedEntityId && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <Link2 className="h-3 w-3 text-primary" />
                                        <span className="text-xs text-primary">
                                            Länkad till {item.linkedEntityType === 'receipt' ? 'kvitto' : 'faktura'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                                <span>{item.date}</span>
                                {/* AI Match Indicator (Purple Dot) */}
                                {item.aiSuggestion && !item.linkedEntityId && (
                                    <div className="flex items-center gap-1 mt-1 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse" />
                                        <span className="text-[10px] font-medium text-purple-700 dark:text-purple-300">
                                            AI-förslag
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.aiStatus === 'error' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-xs gap-1 border-red-300 text-red-600 hover:bg-red-50"
                                        onClick={async (e) => {
                                            e.stopPropagation()
                                            try {
                                                // Reset to pending
                                                await fetch('/api/receive', {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ id: item.id, aiStatus: 'pending' })
                                                })
                                                // Trigger AI processing
                                                await fetch('/api/ai/process-inbox', { method: 'POST' })
                                                // Refresh inbox
                                                fetchItems()
                                            } catch (error) {
                                                console.error('Retry failed:', error)
                                            }
                                        }}
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        Försök igen
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleToggleStar(item.id)
                                    }}
                                >
                                    {item.starred ? (
                                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ) : (
                                        <StarOff className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => handleDownload(e, item)}
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenInKivra(item)}>
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Visa i Kivra
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={(e) => handleDownload(e as unknown as React.MouseEvent, item)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Ladda ner PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleArchive(item.id)}>
                                            <Archive className="h-4 w-4 mr-2" />
                                            Arkivera
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleArchive(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Ta bort
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}

                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Inbox className="h-12 w-12 mb-4 opacity-50" />
                            <p>Inga meddelanden</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
