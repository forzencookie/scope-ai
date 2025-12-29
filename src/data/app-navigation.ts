// ============================================
// Navigation Mock Data
// ============================================

import {
    BookOpen,
    Bot,
    Box,
    Apple,
    CheckSquare,
    Frame,
    Home,
    Mail,
    PieChart,
    Building2,
    Users,
    Puzzle,
    Settings,
    Landmark,
    Vote,
    FileText,
    PiggyBank,
    Captions,
    Search,
    LayoutGrid,
} from "lucide-react"
import type { FeatureKey } from "@/lib/company-types"
import type { User, Team, NavItem } from "@/types"

// ============================================
// User Data
// ============================================

export const mockUser: User = {
    id: "user-1",
    name: "Rice",
    email: "rice@scopeai.se",
    avatar: "",
    plan: "Pro",
}

// ============================================
// Teams Data
// ============================================

export const mockTeams: Team[] = [
    {
        id: "team-1",
        name: "Scope AI",
        logo: Box,
        plan: "Max",
    },
    {
        id: "team-2",
        name: "Mitt Företag AB",
        logo: Building2,
        plan: "Free",
    },
]

// ============================================
// Platform Navigation
// ============================================

export const navPlatform: NavItem[] = [
    {
        title: "AI-assistent",
        titleEnkel: "AI-bot",
        url: "/dashboard/ai-robot",
        icon: Bot,
    },
    {
        title: "Appar",
        titleEnkel: "Appar",
        url: "/dashboard/appar",
        icon: LayoutGrid,
    },
    {
        title: "Inkorg",
        titleEnkel: "Inkorg",
        url: "/dashboard/inkorg",
        icon: Mail,
        isActive: true,
        muted: true,
    },
    {
        title: "Uppgifter",
        titleEnkel: "Uppgifter",
        url: "/dashboard/dagbok",
        icon: CheckSquare,
        muted: true,
    },
]

// ============================================
// Economy Navigation (REMOVED - accessed via Sök page now)
// ============================================

// navEconomy has been removed - all economy pages are accessed via /dashboard/sok/

// ============================================
// Settings Navigation
// ============================================

export const navSettings: NavItem[] = [
    {
        title: "Inställningar",
        titleEnkel: "Inställningar",
        url: "/dashboard/installningar",
        icon: Settings,
    },
    {
        title: "Företagsstatistik",
        titleEnkel: "Statistik",
        url: "/dashboard/foretagsstatistik",
        icon: Captions,
    },
]
