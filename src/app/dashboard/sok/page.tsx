"use client"

import { useState, useEffect, useMemo } from "react"
import {
    ArrowRight,
    BookOpen,
    PieChart,
    PiggyBank,
    Settings,
    Receipt,
    ClipboardCheck,
    Calculator,
    Send,
    FileBarChart,
    FileText,
    DollarSign,
    Gift,
    Car,
    Users,
    Landmark
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { SearchBar } from "@/components/ui/search-bar"
import { Button } from "@/components/ui/button"

import { useCompany } from "@/providers/company-provider"
import { type FeatureKey } from "@/lib/company-types"
import { globalSearch, groupSearchResults, type SearchResult, type SearchResultGroup } from "@/services/search-service"

interface SearchItem {
    id: string
    title: string
    titleEnkel: string
    description: string
    icon: React.ReactNode
    href: string
    category: string
    feature?: FeatureKey // Optional feature key for visibility
    colorClass: string // Tailwind classes for icon bg and text color
}

// Category color mapping (with dark mode support)
const categoryColors: Record<string, string> = {
    "Bokföring": "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    "Rapporter": "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
    "Löner": "bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400",
    "Ägare": "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
}

const searchItems: SearchItem[] = [
    // Bokföring (Emerald/Teal)
    { id: "1", title: "Transaktioner", titleEnkel: "Pengar in & ut", description: "Visa och hantera banktransaktioner", icon: <BookOpen className="h-4 w-4" />, href: "/dashboard/sok/bokforing?tab=transaktioner", category: "Bokföring", feature: "transaktioner", colorClass: categoryColors["Bokföring"] },
    { id: "2", title: "Fakturor & Kvitton", titleEnkel: "Kvitton", description: "Ladda upp och hantera kvitton", icon: <Receipt className="h-4 w-4" />, href: "/dashboard/sok/bokforing?tab=kvitton", category: "Bokföring", feature: "kvitton", colorClass: categoryColors["Bokföring"] },
    { id: "3", title: "Verifikationer", titleEnkel: "Alla bokningar", description: "Bokföringsverifikationer", icon: <ClipboardCheck className="h-4 w-4" />, href: "/dashboard/sok/bokforing?tab=verifikationer", category: "Bokföring", feature: "verifikationer", colorClass: categoryColors["Bokföring"] },

    // Rapporter (Orange)
    { id: "4", title: "Momsdeklaration", titleEnkel: "Momsrapport", description: "Hantera moms", icon: <Calculator className="h-4 w-4" />, href: "/dashboard/sok/rapporter?tab=momsdeklaration", category: "Rapporter", feature: "momsdeklaration", colorClass: categoryColors["Rapporter"] },
    { id: "5", title: "Inkomstdeklaration", titleEnkel: "Skatterapport", description: "Inkomstskatt", icon: <Send className="h-4 w-4" />, href: "/dashboard/sok/rapporter?tab=inkomstdeklaration", category: "Rapporter", feature: "inkomstdeklaration", colorClass: categoryColors["Rapporter"] },
    { id: "6", title: "Årsredovisning", titleEnkel: "Årssammanställning", description: "Årsredovisning", icon: <FileBarChart className="h-4 w-4" />, href: "/dashboard/sok/rapporter?tab=arsredovisning", category: "Rapporter", feature: "arsredovisning", colorClass: categoryColors["Rapporter"] },
    { id: "7", title: "Årsbokslut", titleEnkel: "Bokslut", description: "Årsbokslut", icon: <FileText className="h-4 w-4" />, href: "/dashboard/sok/rapporter?tab=arsbokslut", category: "Rapporter", feature: "arsbokslut", colorClass: categoryColors["Rapporter"] },

    // Löner (Pink)
    { id: "8", title: "Lönebesked", titleEnkel: "Lönebesked", description: "Hantera löner", icon: <FileText className="h-4 w-4" />, href: "/dashboard/sok/loner?tab=lonebesked", category: "Löner", feature: "lonebesked", colorClass: categoryColors["Löner"] },
    { id: "9", title: "AGI", titleEnkel: "Arbetsgivarinfo", description: "Arbetsgivardeklaration", icon: <Send className="h-4 w-4" />, href: "/dashboard/sok/loner?tab=agi", category: "Löner", feature: "agi", colorClass: categoryColors["Löner"] },
    { id: "10", title: "Utdelning", titleEnkel: "Utdelning", description: "Aktieutdelning", icon: <DollarSign className="h-4 w-4" />, href: "/dashboard/sok/loner?tab=utdelning", category: "Löner", feature: "utdelning", colorClass: categoryColors["Löner"] },
    { id: "11", title: "Förmåner", titleEnkel: "Övriga Förmåner", description: "Hantera personalförmåner", icon: <Gift className="h-4 w-4" />, href: "/dashboard/sok/loner?tab=benefits", category: "Löner", feature: "lonebesked", colorClass: categoryColors["Löner"] },

    // Ägare & Styrning (Blue)
    { id: "12", title: "Aktiebok", titleEnkel: "Aktiebok", description: "Hantera aktiebok", icon: <BookOpen className="h-4 w-4" />, href: "/dashboard/sok/agare?tab=aktiebok", category: "Ägare", feature: "aktiebok", colorClass: categoryColors["Ägare"] },
    { id: "13", title: "Delägare", titleEnkel: "Ägare", description: "Hantera delägare", icon: <Users className="h-4 w-4" />, href: "/dashboard/sok/agare?tab=delagare", category: "Ägare", feature: "delagare", colorClass: categoryColors["Ägare"] },
    { id: "14", title: "Styrelseprotokoll", titleEnkel: "Styrelseanteckningar", description: "Protokoll från styrelsemöten", icon: <FileText className="h-4 w-4" />, href: "/dashboard/sok/agare?tab=styrelseprotokoll", category: "Ägare", feature: "styrelseprotokoll", colorClass: categoryColors["Ägare"] },
    { id: "15", title: "Bolagsstämma", titleEnkel: "Årsmöte (AB)", description: "Protokoll från bolagsstämma", icon: <Landmark className="h-4 w-4" />, href: "/dashboard/sok/agare?tab=bolagsstamma", category: "Ägare", feature: "bolagsstamma", colorClass: categoryColors["Ägare"] },
]

import { useTextMode } from "@/providers/text-mode-provider"

// Filter categories
const filterCategories = ["Bokföring", "Rapporter", "Löner", "Ägare"] as const
type FilterCategory = typeof filterCategories[number] | null

export default function SokPage() {
    const [query, setQuery] = useState("")
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [activeFilter, setActiveFilter] = useState<FilterCategory>(null)
    const [contentResults, setContentResults] = useState<SearchResultGroup[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const { isEnkel } = useTextMode()
    const { hasFeature } = useCompany()

    // Deep search when query changes
    useEffect(() => {
        if (query.length >= 2) {
            setIsSearching(true)
            const filters = activeFilter === null ? [] : [activeFilter]
            globalSearch(query, { filters }).then(results => {
                setContentResults(groupSearchResults(results))
                setIsSearching(false)
            })
        } else {
            setContentResults([])
        }
    }, [query, activeFilter])

    const filteredItems = searchItems.filter(item => {
        // First check if the company supports this feature
        if (item.feature && !hasFeature(item.feature)) {
            return false
        }

        // Filter by active category
        if (activeFilter !== null && item.category !== activeFilter &&
            !(activeFilter === "Bokföring" && ["Bokföring"].includes(item.category)) &&
            !(activeFilter === "Rapporter" && ["Rapporter"].includes(item.category)) &&
            !(activeFilter === "Löner" && ["Löner"].includes(item.category)) &&
            !(activeFilter === "Ägare" && ["Ägare"].includes(item.category))
        ) {
            return false
        }

        // Then check if it matches the search query
        return (
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.titleEnkel.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.category.toLowerCase().includes(query.toLowerCase())
        )
    })

    // Group by category
    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = []
        acc[item.category].push(item)
        return acc
    }, {} as Record<string, SearchItem[]>)


    useEffect(() => {
        setSelectedIndex(-1)
    }, [query])

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-2xl mx-auto pt-20 px-4">
                {/* Search Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">Sök</h1>
                    <p className="text-muted-foreground">Hitta det du söker snabbt</p>
                </div>

                {/* Search Input */}
                <div className="mb-4">
                    <SearchBar
                        placeholder="Sök transaktioner, kvitton, dokument..."
                        value={query}
                        onChange={setQuery}
                        className="w-full"
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {filterCategories.map(filter => (
                        <Button
                            key={filter}
                            variant={activeFilter === filter ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                            className="rounded-full"
                        >
                            {filter}
                        </Button>
                    ))}
                </div>

                {/* Content Search Results (Deep Search) */}
                {contentResults.length > 0 && (
                    <div className="space-y-4 mb-8">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
                            Hittade i dina data
                        </h3>
                        {contentResults.map(group => (
                            <div key={group.category}>
                                <div className="text-xs font-medium text-muted-foreground mb-2 px-3">
                                    {group.category}
                                </div>
                                {group.results.map(result => (
                                    <a
                                        key={result.id}
                                        href={result.href}
                                        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50 rounded-lg group"
                                    >
                                        <div className={cn("flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors", result.colorClass)}>
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-foreground/90">{result.title}</div>
                                            <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                                        </div>
                                        {result.amount && (
                                            <div className="text-sm font-medium">{result.amount}</div>
                                        )}
                                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />
                                    </a>
                                ))}
                                <a
                                    href={group.viewAllHref}
                                    className="block text-xs text-primary hover:underline px-4 py-2"
                                >
                                    Visa alla i {group.category} →
                                </a>
                            </div>
                        ))}
                        <div className="h-[2px] bg-border/40 rounded-full" />
                    </div>
                )}

                {/* Category page navigation - only shows when filter is selected */}
                {activeFilter !== null && (
                    <div className="space-y-2 mb-8">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3">
                            {activeFilter}
                        </h3>
                        {filteredItems.map(item => (
                            <a
                                key={item.id}
                                href={item.href}
                                className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50 rounded-lg group"
                            >
                                <div className={cn("flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors", item.colorClass)}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium text-sm text-foreground/90">
                                        {isEnkel ? item.titleEnkel : item.title}
                                    </span>
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/70 transition-colors" />
                            </a>
                        ))}
                    </div>
                )}

                {/* Empty state when no search and no filter */}
                {activeFilter === null && query.length < 2 && contentResults.length === 0 && (
                    <div className="py-16 text-center">
                        <p className="text-muted-foreground mb-2">Sök efter transaktioner, kvitton eller dokument</p>
                        <p className="text-sm text-muted-foreground/70">eller välj en kategori ovan</p>
                    </div>
                )}
            </div>
        </div>
    )
}
