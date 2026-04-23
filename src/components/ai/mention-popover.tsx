"use client"

import * as React from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui"
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui"
import {
    FileText,
    Receipt,
    CreditCard,
    ScrollText,
    Building2,
    TrendingUp,
    Users,
    Gift,
    BookOpen,
    PieChart,
    CalendarDays,
    Landmark,
    Banknote,
    UserCheck,
    UserCog,
    CalendarCheck,
    Map,
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WalkthroughType } from "@/components/ai/overlays/walkthroughs/walkthrough-overlay"

// =============================================================================
// Types
// =============================================================================

export type MentionCategory = "bokforing" | "rapporter" | "loner" | "agare" | "planering"

export interface MentionItem {
    id: string
    type: MentionCategory
    label: string
    sublabel?: string
    walkthroughType: WalkthroughType
    /** AI prompt hint to inject when this overlay is mentioned */
    aiContext: string
}

interface OverlayContext {
    id: WalkthroughType
    title: string
    description: string
    icon: LucideIcon
    category: MentionCategory
    keywords: string[]
}

// =============================================================================
// Overlay registry — mirrors WalkthroughType
// =============================================================================

const OVERLAY_CONTEXTS: OverlayContext[] = [
    // Bokföring
    { id: "fakturor",         title: "Fakturor",           description: "Kundfakturor, PDF-export och påminnelser",     icon: FileText,     category: "bokforing", keywords: ["faktura", "kund", "invoice"] },
    { id: "transaktioner",    title: "Transaktioner",      description: "Bokförda in- och utbetalningar",               icon: CreditCard,   category: "bokforing", keywords: ["transaktion", "betalning", "bank"] },
    { id: "verifikationer",   title: "Verifikationer",     description: "Bokföringsordrar och verifikat",               icon: ScrollText,   category: "bokforing", keywords: ["verifikat", "journal", "kontering"] },
    { id: "tillgangar",       title: "Inventarier",        description: "Anläggningstillgångar och avskrivningar",      icon: BookOpen,     category: "bokforing", keywords: ["inventarie", "avskrivning", "tillgång"] },
    // Rapporter & Deklarationer
    { id: "resultatrakning",  title: "Resultaträkning",    description: "Intäkter, kostnader och rörelseresultat",      icon: TrendingUp,   category: "rapporter", keywords: ["resultat", "vinst", "förlust", "p&l"] },
    { id: "balansrakning",    title: "Balansräkning",      description: "Tillgångar, skulder och eget kapital",         icon: PieChart,     category: "rapporter", keywords: ["balans", "tillgångar", "skulder"] },
    { id: "momsdeklaration",  title: "Momsdeklaration",    description: "Moms att betala, ingående och utgående",       icon: Receipt,      category: "rapporter", keywords: ["moms", "vat", "skatteverket"] },
    { id: "k10",              title: "K10",                description: "3:12-regler, gränsbelopp och utdelning",       icon: Banknote,     category: "rapporter", keywords: ["k10", "utdelning", "gränsbelopp", "3:12"] },
    { id: "egenavgifter",     title: "Egenavgifter",       description: "Sociala avgifter för enskild firma",           icon: Landmark,     category: "rapporter", keywords: ["egenavgift", "ef", "enskild firma"] },
    { id: "agi",              title: "AGI",                description: "Arbetsgivardeklaration på individnivå",        icon: CalendarCheck,category: "rapporter", keywords: ["agi", "arbetsgivardeklaration", "skatteverket"] },
    // Löner & Personal
    { id: "lonekorning",      title: "Lönekörning",        description: "Kör löner, skattetabeller och nettolön",       icon: Banknote,     category: "loner",     keywords: ["lön", "lönekörning", "nettolön", "skatt"] },
    { id: "team",             title: "Team",               description: "Anställda, anställningsform och tjänstegrad",  icon: Users,        category: "loner",     keywords: ["anställd", "team", "personal"] },
    { id: "formaner",         title: "Förmåner",           description: "Bilförmån, friskvård och andra förmåner",     icon: Gift,         category: "loner",     keywords: ["förmån", "friskvård", "bilförmån"] },
    { id: "delagaruttag",     title: "Delägaruttag",       description: "Uttag och lön för delägare i HB/KB",          icon: UserCog,      category: "loner",     keywords: ["delägaruttag", "handelsbolag", "uttag"] },
    { id: "egenavgifter",     title: "Egenavgifter",       description: "Sociala avgifter för enskild firma",           icon: Landmark,     category: "loner",     keywords: ["egenavgift"] },
    // Ägare & Styrning
    { id: "aktiebok",         title: "Aktiebok",           description: "Aktier, ägare och ägarförändringar",          icon: BookOpen,     category: "agare",     keywords: ["aktie", "ägare", "aktiebok"] },
    { id: "utdelning",        title: "Utdelning",          description: "Utdelningsbeslut och skatteberäkning",        icon: Banknote,     category: "agare",     keywords: ["utdelning", "dividend", "bolagsstämma"] },
    { id: "delagare",         title: "Delägare",           description: "Delägarprofiler och ägarandel",               icon: UserCheck,    category: "agare",     keywords: ["delägare", "ägare", "partner"] },
    { id: "moten",            title: "Möten & Beslut",     description: "Styrelseprotokoll och bolagsstämma",          icon: CalendarDays, category: "agare",     keywords: ["möte", "protokoll", "stämma", "beslut"] },
    { id: "medlemsregister",  title: "Medlemsregister",    description: "Medlemmar i ekonomisk förening",              icon: Users,        category: "agare",     keywords: ["medlem", "förening"] },
    // Planering
    { id: "handelser",        title: "Händelser & Deadlines", description: "Skattedeadlines och bokslut",             icon: CalendarDays, category: "planering", keywords: ["deadline", "händelse", "månadsavslut"] },
    { id: "plan",             title: "Planering",          description: "Affärsplan och ekonomiska mål",               icon: Map,          category: "planering", keywords: ["plan", "mål", "budget"] },
    { id: "kund",             title: "Kund",               description: "Kundprofil, historik och fakturor",           icon: Building2,    category: "planering", keywords: ["kund", "klient", "customer"] },
]

const CATEGORY_LABELS: Record<MentionCategory, string> = {
    bokforing: "📒 Bokföring",
    rapporter:  "📊 Rapporter & Deklarationer",
    loner:      "💰 Löner & Personal",
    agare:      "🏢 Ägare & Styrning",
    planering:  "📅 Planering",
}

const CATEGORY_ORDER: MentionCategory[] = ["bokforing", "rapporter", "loner", "agare", "planering"]

// =============================================================================
// Component
// =============================================================================

interface MentionPopoverProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (item: MentionItem) => void
    searchQuery: string
    items?: MentionItem[]
    anchorRef: React.RefObject<HTMLElement | null>
}

function overlayToMentionItem(ctx: OverlayContext): MentionItem {
    return {
        id: `overlay-${ctx.id}`,
        type: ctx.category,
        label: ctx.title,
        sublabel: ctx.description,
        walkthroughType: ctx.id,
        aiContext: `Användaren har nämnt ${ctx.title} och vill troligtvis prata om det. Ställ klargörande frågor för att förstå vad de specifikt vill se innan du öppnar en overlay.`,
    }
}

export function MentionPopover({
    open,
    onOpenChange,
    onSelect,
    anchorRef,
}: MentionPopoverProps) {
    const [search, setSearch] = React.useState("")

    const grouped = React.useMemo(() => {
        const q = search.toLowerCase()
        const result: Record<MentionCategory, OverlayContext[]> = {
            bokforing: [], rapporter: [], loner: [], agare: [], planering: [],
        }
        // deduplicate by id+category
        const seen = new Set<string>()
        OVERLAY_CONTEXTS.forEach(ctx => {
            const key = `${ctx.id}-${ctx.category}`
            if (seen.has(key)) return
            seen.add(key)
            if (!q || ctx.title.toLowerCase().includes(q) || ctx.keywords.some(k => k.includes(q))) {
                result[ctx.category].push(ctx)
            }
        })
        return result
    }, [search])

    const hasResults = CATEGORY_ORDER.some(cat => grouped[cat].length > 0)

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
                        placeholder="Sök overlay..."
                        value={search}
                        onValueChange={setSearch}
                        className="h-9"
                    />
                    <CommandList className="max-h-80">
                        {!hasResults && <CommandEmpty>Ingen overlay hittades</CommandEmpty>}
                        {CATEGORY_ORDER.map(category => {
                            const items = grouped[category]
                            if (items.length === 0) return null
                            return (
                                <CommandGroup key={category} heading={CATEGORY_LABELS[category]}>
                                    {items.map(ctx => {
                                        const Icon = ctx.icon
                                        return (
                                            <CommandItem
                                                key={`${ctx.id}-${ctx.category}`}
                                                value={`${ctx.id}:${ctx.title}:${ctx.keywords.join(" ")}`}
                                                onSelect={() => onSelect(overlayToMentionItem(ctx))}
                                                className="flex items-start gap-2 cursor-pointer py-2"
                                            >
                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium block text-sm">{ctx.title}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{ctx.description}</span>
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
// Badge component for displaying mentioned items
// =============================================================================

export function MentionBadge({
    item,
    onRemove,
}: {
    item: MentionItem
    onRemove?: () => void
}) {
    const ctx = OVERLAY_CONTEXTS.find(c => c.id === item.walkthroughType)
    const Icon = ctx?.icon ?? FileText

    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium",
            "bg-primary/10 text-primary border border-primary/20"
        )}>
            <Icon className="h-3 w-3" />
            <span className="truncate max-w-[120px]">{item.label}</span>
            {onRemove && (
                <button onClick={onRemove} className="ml-0.5 hover:text-destructive">
                    ×
                </button>
            )}
        </span>
    )
}
