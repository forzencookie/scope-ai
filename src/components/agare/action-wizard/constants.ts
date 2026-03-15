import {
    Users,
    Coins,
    TrendingUp,
    Building2,
    FileText,
    Map,
    type LucideIcon,
} from "lucide-react"
import type { CorporateActionType } from "@/types/events"

export const actionIcons: Record<CorporateActionType, LucideIcon> = {
    board_change: Users,
    dividend: Coins,
    capital_change: TrendingUp,
    authority_filing: Building2,
    statute_change: FileText,
    roadmap: Map,
}

/** Data shapes emitted by each wizard form. */
export interface BoardChangeData {
    changeDate: string
    boardMembers: string[]
}

export interface DividendData {
    dividendTotal: string
}

export interface RoadmapData {
    roadmapTitle: string
    description: string
}

export interface GenericActionData {
    description: string
    effectiveDate: string
}

export type WizardFormData = BoardChangeData | DividendData | RoadmapData | GenericActionData

export const actionTypes: CorporateActionType[] = [
    'board_change',
    'dividend',
    'capital_change',
    'authority_filing',
    'statute_change',
    'roadmap',
]
