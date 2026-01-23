"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchItem {
    label: string
    href: string
    keywords?: string[]
}

const SEARCH_ITEMS: SearchItem[] = [
    { label: "Dashboard", href: "/dashboard", keywords: ["hem", "start", "översikt"] },
    { label: "Bokföring", href: "/dashboard/bokforing", keywords: ["accounting", "konton", "verifikationer"] },
    { label: "Transaktioner", href: "/dashboard/bokforing?tab=transaktioner", keywords: ["betalningar", "transactions"] },
    { label: "Fakturor", href: "/dashboard/bokforing?tab=fakturor", keywords: ["invoices", "kundfakturor"] },
    { label: "Kvitton", href: "/dashboard/bokforing?tab=kvitton", keywords: ["receipts", "utgifter"] },
    { label: "Leverantörsfakturor", href: "/dashboard/bokforing?tab=leverantorsfakturor", keywords: ["supplier", "inköp"] },
    { label: "Rapporter", href: "/dashboard/rapporter", keywords: ["reports", "resultat", "balans"] },
    { label: "Moms", href: "/dashboard/rapporter?tab=moms", keywords: ["vat", "skatt"] },
    { label: "Löner", href: "/dashboard/loner", keywords: ["payroll", "anställda", "lön"] },

    { label: "Ägare & Styrning", href: "/dashboard/agare", keywords: ["aktieägare", "styrelse", "bolagsstämma"] },
    { label: "Inställningar", href: "/dashboard/installningar", keywords: ["settings", "konto", "profil"] },
]

export function GlobalSearch() {
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const filteredItems = query.trim()
        ? SEARCH_ITEMS.filter(item => {
            const q = query.toLowerCase()
            return (
                item.label.toLowerCase().includes(q) ||
                item.keywords?.some(k => k.toLowerCase().includes(q))
            )
        })
        : []

    const handleSelect = (item: SearchItem) => {
        router.push(item.href)
        setQuery("")
        setIsOpen(false)
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen || filteredItems.length === 0) return

        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIndex(i => (i + 1) % filteredItems.length)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIndex(i => (i - 1 + filteredItems.length) % filteredItems.length)
        } else if (e.key === "Enter") {
            e.preventDefault()
            handleSelect(filteredItems[selectedIndex])
        } else if (e.key === "Escape") {
            setIsOpen(false)
            inputRef.current?.blur()
        }
    }

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Reset selection when filtered items change
    useEffect(() => {
        setSelectedIndex(0)
    }, [query])

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Sök..."
                    className="w-full h-9 pl-9 pr-4 text-sm bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background placeholder:text-muted-foreground"
                />
            </div>

            {isOpen && filteredItems.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                    {filteredItems.map((item, index) => (
                        <button
                            key={item.href}
                            onClick={() => handleSelect(item)}
                            className={cn(
                                "w-full px-3 py-2 text-left text-sm transition-colors",
                                index === selectedIndex
                                    ? "bg-accent text-accent-foreground"
                                    : "hover:bg-accent/50"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
