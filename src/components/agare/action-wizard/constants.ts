import {
    Users,
    Coins,
    TrendingUp,
    Building2,
    FileText,
    Map,
} from "lucide-react"
import type { CorporateActionType } from "@/types/events"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const actionIcons: Record<CorporateActionType, any> = {
    board_change: Users,
    dividend: Coins,
    capital_change: TrendingUp,
    authority_filing: Building2,
    statute_change: FileText,
    roadmap: Map,
}

export const actionTypes: CorporateActionType[] = [
    'board_change',
    'dividend',
    'capital_change',
    'authority_filing',
    'statute_change',
    'roadmap',
]
