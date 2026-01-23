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
    Calendar,
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
    },
    {
        title: "Fakturor",
        titleEnkel: "Fakturor",
        url: "/dashboard/bokforing?tab=fakturor",
        icon: FileText,
    },
    {
        title: "Kvitton",
        titleEnkel: "Kvitton",
        url: "/dashboard/bokforing?tab=kvitton",
        icon: PiggyBank,
    },
    {
        title: "Inventarier",
        titleEnkel: "Inventarier",
        url: "/dashboard/bokforing?tab=inventarier",
        icon: CheckSquare,
    },
    {
        title: "Verifikationer",
        titleEnkel: "Verifikationer",
        url: "/dashboard/bokforing?tab=verifikationer",
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
        titleEnkel: "Moms",
        url: "/dashboard/rapporter?tab=momsdeklaration",
        icon: FileText,
        featureKey: "momsdeklaration",
    },
    {
        title: "Inkomstdeklaration",
        titleEnkel: "Inkomst",
        url: "/dashboard/rapporter?tab=inkomstdeklaration",
        icon: FileText,
        featureKey: "inkomstdeklaration",
    },
    {
        title: "AGI",
        titleEnkel: "AGI",
        url: "/dashboard/rapporter?tab=agi",
        icon: Send,
        featureKey: "agi",
    },
    {
        title: "Årsredovisning",
        titleEnkel: "Årsredovisning",
        url: "/dashboard/rapporter?tab=arsredovisning",
        icon: FileText,
        featureKey: "arsredovisning",
    },
    {
        title: "Årsbokslut",
        titleEnkel: "Årsbokslut",
        url: "/dashboard/rapporter?tab=arsbokslut",
        icon: FileText,
        featureKey: "arsbokslut",
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
        title: "Lönekörning",
        titleEnkel: "Lönekörning",
        url: "/dashboard/loner?tab=lonebesked",
        icon: PiggyBank,
        featureKey: "lonebesked",
    },
    {
        title: "Förmåner",
        titleEnkel: "Förmåner",
        url: "/dashboard/loner?tab=benefits",
        icon: Gift,
        featureKey: "lonebesked",
    },
    {
        title: "Team & Rapportering",
        titleEnkel: "Team",
        url: "/dashboard/loner?tab=team",
        icon: Users,
    },
    {
        title: "Egenavgifter",
        titleEnkel: "Egenavgifter",
        url: "/dashboard/loner?tab=egenavgifter",
        icon: PiggyBank,
        featureKey: "egenavgifter",
    },
    {
        title: "Delägaruttag",
        titleEnkel: "Delägaruttag",
        url: "/dashboard/loner?tab=delagaruttag",
        icon: Coins,
        featureKey: "delagaruttag",
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
        title: "Utdelning",
        titleEnkel: "Utdelning",
        url: "/dashboard/agare?tab=utdelning",
        icon: Coins,
        featureKey: "utdelning",
    },
    {
        title: "Ägarinfo",
        titleEnkel: "Ägarinfo",
        url: "/dashboard/agare?tab=agarinfo",
        icon: Building2,
        featureKey: "agarinfo",
    },
    {
        title: "Medlemsregister",
        titleEnkel: "Medlemmar",
        url: "/dashboard/agare?tab=medlemsregister",
        icon: Users,
        featureKey: "medlemsregister",
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
        title: "Årsmöte",
        titleEnkel: "Årsmöte",
        url: "/dashboard/agare?tab=arsmote",
        icon: Vote,
        featureKey: "arsmote",
    },
    {
        title: "Firmatecknare",
        titleEnkel: "Firmatecknare",
        url: "/dashboard/agare?tab=firmatecknare",
        icon: FileText,
    },
    {
        title: "Myndigheter",
        titleEnkel: "Myndigheter",
        url: "/dashboard/agare?tab=myndigheter",
        icon: Building2,
    },
]

// ============================================
// Settings Navigation
// ============================================

export const navSettings: NavItem[] = [
    {
        title: "Händelser",
        titleEnkel: "Händelser",
        url: "/dashboard/handelser",
        icon: Calendar,
    },
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

