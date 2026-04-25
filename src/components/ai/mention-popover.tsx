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
    aiContext: string
}

// =============================================================================
// Overlay registry — mirrors WalkthroughType
// =============================================================================

const OVERLAY_CONTEXTS: OverlayContext[] = [
    // Bokföring
    { id: "fakturor",         title: "Fakturor",           description: "Kundfakturor, PDF-export och påminnelser",     icon: FileText,     category: "bokforing", keywords: ["faktura", "kund", "invoice"],                       aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing"]). Lista öppna kundfakturor — fråga om kund om det saknas.' },
    { id: "transaktioner",    title: "Transaktioner",      description: "Bokförda in- och utbetalningar",               icon: CreditCard,   category: "bokforing", keywords: ["transaktion", "betalning", "bank"],                  aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing"]). Visa de senaste transaktionerna.' },
    { id: "verifikationer",   title: "Verifikationer",     description: "Bokföringsordrar och verifikat",               icon: ScrollText,   category: "bokforing", keywords: ["verifikat", "journal", "kontering"],                 aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing"]). Visa senaste verifikationer.' },
    { id: "tillgangar",       title: "Inventarier",        description: "Anläggningstillgångar och avskrivningar",      icon: BookOpen,     category: "bokforing", keywords: ["inventarie", "avskrivning", "tillgång"],             aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing"]). Lista anläggningstillgångar och avskrivningsstatus.' },
    // Rapporter & Deklarationer
    { id: "resultatrakning",  title: "Resultaträkning",    description: "Intäkter, kostnader och rörelseresultat",      icon: TrendingUp,   category: "rapporter", keywords: ["resultat", "vinst", "förlust", "p&l"],               aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing"]). Generera resultaträkning för innevarande år.' },
    { id: "balansrakning",    title: "Balansräkning",      description: "Tillgångar, skulder och eget kapital",         icon: PieChart,     category: "rapporter", keywords: ["balans", "tillgångar", "skulder"],                   aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing"]). Generera balansräkning per dagens datum.' },
    { id: "momsdeklaration",  title: "Momsdeklaration",    description: "Moms att betala, ingående och utgående",       icon: Receipt,      category: "rapporter", keywords: ["moms", "vat", "skatteverket"],                       aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing", "skatt"]). Kör get_vat_report — fråga om period om det saknas.' },
    { id: "k10",              title: "K10",                description: "3:12-regler, gränsbelopp och utdelning",       icon: Banknote,     category: "rapporter", keywords: ["k10", "utdelning", "gränsbelopp", "3:12"],           aiContext: 'Kör read_skill("shared") och read_skill("ab"). Begär request_tools(["skatt", "parter"]). Kör calculate_k10 och visa gränsbelopp.' },
    { id: "egenavgifter",     title: "Egenavgifter",       description: "Sociala avgifter för enskild firma",           icon: Landmark,     category: "rapporter", keywords: ["egenavgift", "ef", "enskild firma"],                 aiContext: 'Kör read_skill("shared"). Begär request_tools(["loner", "skatt"]). Beräkna egenavgifter för innevarande år.' },
    { id: "agi",              title: "AGI",                description: "Arbetsgivardeklaration på individnivå",        icon: CalendarCheck,category: "rapporter", keywords: ["agi", "arbetsgivardeklaration", "skatteverket"],      aiContext: 'Kör read_skill("shared") och read_skill("ab"). Begär request_tools(["loner"]). Förbered AGI-underlag — fråga om kvartal om det saknas.' },
    // Löner & Personal
    { id: "lonekorning",      title: "Lönekörning",        description: "Kör löner, skattetabeller och nettolön",       icon: Banknote,     category: "loner",     keywords: ["lön", "lönekörning", "nettolön", "skatt"],           aiContext: 'Kör read_skill("shared") och read_skill("ab"). Begär request_tools(["loner"]). Fråga vilket lönperiod om det saknas — kör sedan löner.' },
    { id: "team",             title: "Team",               description: "Anställda, anställningsform och tjänstegrad",  icon: Users,        category: "loner",     keywords: ["anställd", "team", "personal"],                      aiContext: 'Kör read_skill("shared"). Begär request_tools(["loner"]). Lista anställda med anställningsform och tjänstegrad.' },
    { id: "formaner",         title: "Förmåner",           description: "Bilförmån, friskvård och andra förmåner",     icon: Gift,         category: "loner",     keywords: ["förmån", "friskvård", "bilförmån"],                  aiContext: 'Kör read_skill("shared") och read_skill("ab"). Begär request_tools(["loner"]). Visa registrerade förmåner per anställd.' },
    { id: "delagaruttag",     title: "Delägaruttag",       description: "Uttag och lön för delägare i HB/KB",          icon: UserCog,      category: "loner",     keywords: ["delägaruttag", "handelsbolag", "uttag"],             aiContext: 'Kör read_skill("shared") och read_skill("hb"). Begär request_tools(["loner", "parter"]). Visa delägaruttag och saldo.' },
    { id: "egenavgifter",     title: "Egenavgifter",       description: "Sociala avgifter för enskild firma",           icon: Landmark,     category: "loner",     keywords: ["egenavgift"],                                        aiContext: 'Kör read_skill("shared"). Begär request_tools(["loner", "skatt"]). Beräkna egenavgifter för innevarande år.' },
    // Ägare & Styrning
    { id: "aktiebok",         title: "Aktiebok",           description: "Aktier, ägare och ägarförändringar",          icon: BookOpen,     category: "agare",     keywords: ["aktie", "ägare", "aktiebok"],                        aiContext: 'Kör read_skill("shared") och read_skill("ab"). Begär request_tools(["parter"]). Visa aktieboken med ägarandelar.' },
    { id: "utdelning",        title: "Utdelning",          description: "Utdelningsbeslut och skatteberäkning",        icon: Banknote,     category: "agare",     keywords: ["utdelning", "dividend", "bolagsstämma"],             aiContext: 'Kör read_skill("shared") och read_skill("ab"). Begär request_tools(["parter", "skatt"]). Beräkna utdelningsutrymme och visa K10-gränsbelopp.' },
    { id: "delagare",         title: "Delägare",           description: "Delägarprofiler och ägarandel",               icon: UserCheck,    category: "agare",     keywords: ["delägare", "ägare", "partner"],                      aiContext: 'Kör read_skill("shared") och read_skill("hb"). Begär request_tools(["parter"]). Visa delägarprofiler och ägarandelar.' },
    { id: "moten",            title: "Möten & Beslut",     description: "Styrelseprotokoll och bolagsstämma",          icon: CalendarDays, category: "agare",     keywords: ["möte", "protokoll", "stämma", "beslut"],             aiContext: 'Kör read_skill("shared") och read_skill("ab"). Begär request_tools(["parter"]). Lista senaste styrelseprotokoll och bolagsstämmobeslut.' },
    { id: "medlemsregister",  title: "Medlemsregister",    description: "Medlemmar i ekonomisk förening",              icon: Users,        category: "agare",     keywords: ["medlem", "förening"],                                aiContext: 'Kör read_skill("shared") och read_skill("forening"). Begär request_tools(["parter"]). Visa medlemsregister.' },
    // Planering
    { id: "handelser",        title: "Händelser & Deadlines", description: "Skattedeadlines och bokslut",             icon: CalendarDays, category: "planering", keywords: ["deadline", "händelse", "månadsavslut"],              aiContext: 'Kör read_skill("shared"). Begär request_tools(["common"]). Visa kommande deadlines och händelser för företaget.' },
    { id: "plan",             title: "Planering",          description: "Affärsplan och ekonomiska mål",               icon: Map,          category: "planering", keywords: ["plan", "mål", "budget"],                             aiContext: 'Kör read_skill("shared"). Begär request_tools(["common"]). Visa affärsplan och ekonomiska mål.' },
    { id: "kund",             title: "Kund",               description: "Kundprofil, historik och fakturor",           icon: Building2,    category: "planering", keywords: ["kund", "klient", "customer"],                        aiContext: 'Kör read_skill("shared"). Begär request_tools(["bokforing"]). Visa kundprofil, historik och fakturor — fråga vilket kund om det saknas.' },
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
        aiContext: ctx.aiContext,
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
