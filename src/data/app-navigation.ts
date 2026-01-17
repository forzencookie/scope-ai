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
    LayoutGrid,
    Scale,
    Gift,
    Send,
    Coins,
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
        companyType: "ab",
    },
    {
        id: "team-2",
        name: "Mitt Företag AB",
        logo: Building2,
        plan: "Free",
        companyType: "ab",
    },
]

// ============================================
// Platform Navigation (Core)
// ============================================

/*
export const navPlatform: NavItem[] = [
    {
        title: "Inkorg",
        titleEnkel: "Inkorg",
        url: "/dashboard/inkorg",
        icon: Mail,
        isActive: true,
    },
]
*/

// ============================================
// Feature-based Navigation Modules
// ============================================

export const navBokforing: NavItem[] = [
    {
        title: "Transaktioner",
        titleEnkel: "Transaktioner",
        url: "/dashboard/bokforing?tab=transaktioner",
        icon: BookOpen,
        featureKey: "verifikationer",
    },
    {
        title: "Fakturor",
        titleEnkel: "Fakturor",
        url: "/dashboard/bokforing?tab=fakturor",
        icon: FileText,
        featureKey: "kundfakturor",
    },
    {
        title: "Utlägg & Kvitton",
        titleEnkel: "Kvitton",
        url: "/dashboard/bokforing?tab=kvitton",
        icon: PiggyBank,
        featureKey: "kvitton",
    },
    {
        title: "Verifikationer",
        titleEnkel: "Alla bokningar",
        url: "/dashboard/bokforing?tab=bokforing",
        icon: CheckSquare,
        featureKey: "verifikationer",
    },
]

export const navRapporter: NavItem[] = [
    {
        title: "Resultaträkning",
        titleEnkel: "Resultaträkning",
        url: "/dashboard/rapporter?tab=resultatrakning",
        icon: PieChart,
        featureKey: "resultatrakning",
    },
    {
        title: "Balansräkning",
        titleEnkel: "Balansräkning",
        url: "/dashboard/rapporter?tab=balansrakning",
        icon: Scale,
        featureKey: "balansrakning",
    },
    {
        title: "Momsdeklaration",
        titleEnkel: "Momsdeklaration",
        url: "/dashboard/rapporter?tab=momsdeklaration",
        icon: FileText,
        featureKey: "momsdeklaration",
    },
    {
        title: "Årsredovisning",
        titleEnkel: "Årsredovisning",
        url: "/dashboard/rapporter?tab=arsredovisning",
        icon: FileText,
        featureKey: "arsredovisning",
    },
    {
        title: "Arbetsgivardeklaration",
        titleEnkel: "Arbetsgivardeklaration",
        url: "/dashboard/rapporter?tab=agi",
        icon: Send,
        featureKey: "agi",
    },
    {
        title: "K10",
        titleEnkel: "K10",
        url: "/dashboard/rapporter?tab=k10",
        icon: FileText,
        featureKey: "k10",
    },
]

export const navLoner: NavItem[] = [
    {
        title: "Lönebesked",
        titleEnkel: "Lönebesked",
        url: "/dashboard/loner?tab=lonebesked",
        icon: PiggyBank,
        featureKey: "lonebesked",
    },
    {
        title: "Anställda",
        titleEnkel: "Team",
        url: "/dashboard/loner?tab=team",
        icon: Users,
        featureKey: "lonebesked",
    },
    {
        title: "Förmåner",
        titleEnkel: "Förmåner",
        url: "/dashboard/loner?tab=benefits",
        icon: Gift,
        featureKey: "lonebesked",
    },
]

export const navAgare: NavItem[] = [
    {
        title: "Aktiebok",
        titleEnkel: "Aktiebok",
        url: "/dashboard/agare?tab=aktiebok",
        icon: BookOpen,
        featureKey: "aktiebok",
    },
    {
        title: "Delägare",
        titleEnkel: "Delägare",
        url: "/dashboard/agare?tab=delagare",
        icon: Users,
        featureKey: "delagare",
    },
    {
        title: "Styrelseprotokoll",
        titleEnkel: "Styrelse",
        url: "/dashboard/agare?tab=styrelseprotokoll",
        icon: FileText,
        featureKey: "styrelseprotokoll",
    },
    {
        title: "Bolagsstämma",
        titleEnkel: "Bolagsstämma",
        url: "/dashboard/agare?tab=bolagsstamma",
        icon: Landmark,
        featureKey: "bolagsstamma",
    },
    {
        title: "Ägarinfo",
        titleEnkel: "Ägarinfo",
        url: "/dashboard/agare?tab=agarinfo",
        icon: Building2,
        featureKey: "agarinfo",
    },
    {
        title: "Utdelning",
        titleEnkel: "Utdelning",
        url: "/dashboard/agare?tab=utdelning",
        icon: Coins,
        featureKey: "utdelning",
    },
]

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

