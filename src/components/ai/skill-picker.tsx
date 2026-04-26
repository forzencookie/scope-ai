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
    type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { skills, SKILL_CATEGORY_LABELS, SKILL_CATEGORY_ORDER, type Skill, type SkillCategory } from "@/data/skills"

// =============================================================================
// Icon map — maps icon name strings from skills data to Lucide components
// =============================================================================

const ICON_MAP: Record<string, LucideIcon> = {
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
}

function getIcon(name: string): LucideIcon {
    return ICON_MAP[name] ?? FileText
}

// =============================================================================
// Types
// =============================================================================

export interface SkillItem {
    id: string
    skillId: string
    category: SkillCategory
    label: string
    sublabel?: string
    /** The pre-prepared prompt to inject into the chat input */
    prompt: string
}

interface SkillPickerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelect: (item: SkillItem) => void
    anchorRef: React.RefObject<HTMLElement | null>
}

function skillToSkillItem(skill: Skill): SkillItem {
    return {
        id: `skill-${skill.id}`,
        skillId: skill.id,
        category: skill.category,
        label: skill.label,
        sublabel: skill.description,
        prompt: skill.prompt,
    }
}

// =============================================================================
// SkillPicker — command palette that opens on @ press
// =============================================================================

export function SkillPicker({
    open,
    onOpenChange,
    onSelect,
    anchorRef,
}: SkillPickerProps) {
    const [search, setSearch] = React.useState("")

    const grouped = React.useMemo(() => {
        const q = search.toLowerCase()
        const result = {} as Record<SkillCategory, Skill[]>
        for (const cat of SKILL_CATEGORY_ORDER) {
            result[cat] = []
        }

        for (const skill of skills) {
            if (
                !q ||
                skill.label.toLowerCase().includes(q) ||
                skill.description.toLowerCase().includes(q) ||
                skill.keywords.some(k => k.includes(q))
            ) {
                result[skill.category].push(skill)
            }
        }
        return result
    }, [search])

    const hasResults = SKILL_CATEGORY_ORDER.some(cat => grouped[cat].length > 0)

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
                        placeholder="Sök skill..."
                        value={search}
                        onValueChange={setSearch}
                        className="h-9"
                    />
                    <CommandList className="max-h-80">
                        {!hasResults && <CommandEmpty>Ingen skill hittades</CommandEmpty>}
                        {SKILL_CATEGORY_ORDER.map(category => {
                            const items = grouped[category]
                            if (items.length === 0) return null
                            return (
                                <CommandGroup key={category} heading={SKILL_CATEGORY_LABELS[category]}>
                                    {items.map(skill => {
                                        const Icon = getIcon(skill.icon)
                                        return (
                                            <CommandItem
                                                key={skill.id}
                                                value={`${skill.id}:${skill.label}:${skill.keywords.join(" ")}`}
                                                onSelect={() => onSelect(skillToSkillItem(skill))}
                                                className="flex items-start gap-2 cursor-pointer py-2"
                                            >
                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium block text-sm">{skill.label}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{skill.description}</span>
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
// SkillBadge — inline badge displayed in chat input and message history
// =============================================================================

export function SkillBadge({
    item,
    onRemove,
}: {
    item: SkillItem
    onRemove?: () => void
}) {
    const skill = skills.find(s => s.id === item.skillId)
    const Icon = getIcon(skill?.icon ?? "FileText")

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
