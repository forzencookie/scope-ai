"use client"

import { useState } from "react"
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
    Eye,
    Trash2,
    Archive,
    Star,
    StarOff,
    Download,
    ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import data from the data layer
import { mockInboxItems, categoryColors, categoryLabels } from "@/data/inbox"
import type { InboxItem, InboxFilter } from "@/types"

export default function InboxPage() {
    const [items, setItems] = useState<InboxItem[]>(mockInboxItems)
    const [filter, setFilter] = useState<InboxFilter>("all")

    const filteredItems = items.filter(item => {
        if (filter === "unread") return !item.read
        if (filter === "starred") return item.starred
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

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Inbox className="h-6 w-6" />
                        Kivra Inkorg
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Digital post från myndigheter och företag via Kivra
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Kivra ansluten</span>
                    </div>
                    {unreadCount > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {unreadCount} olästa
                        </span>
                    )}
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 border-b border-border/50 pb-2">
                <Button 
                    variant={filter === "all" ? "secondary" : "ghost"} 
                    size="sm"
                    onClick={() => setFilter("all")}
                >
                    Alla ({items.length})
                </Button>
                <Button 
                    variant={filter === "unread" ? "secondary" : "ghost"} 
                    size="sm"
                    onClick={() => setFilter("unread")}
                >
                    <Mail className="h-3.5 w-3.5 mr-1" />
                    Olästa ({unreadCount})
                </Button>
                <Button 
                    variant={filter === "starred" ? "secondary" : "ghost"} 
                    size="sm"
                    onClick={() => setFilter("starred")}
                >
                    <Star className="h-3.5 w-3.5 mr-1" />
                    Stjärnmärkta ({items.filter(i => i.starred).length})
                </Button>
            </div>

            {/* Mail list */}
            <div className="flex flex-col gap-2">
                {filteredItems.map((item) => (
                    <div 
                        key={item.id}
                        onClick={() => handleMarkRead(item.id)}
                        className={`flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer ${
                            !item.read ? "bg-muted/20" : ""
                        }`}
                    >
                        {/* Sender icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>

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
                            </div>
                            <p className={`font-medium truncate ${!item.read ? "text-foreground" : ""}`}>
                                {item.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                            {item.aiSuggestion && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">AI: {item.aiSuggestion}</span>
                                </div>
                            )}
                        </div>

                        {/* Date */}
                        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                            <span>{item.date}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                onClick={(e) => e.stopPropagation()}
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
                                    <DropdownMenuItem>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visa i Kivra
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
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
    )
}
