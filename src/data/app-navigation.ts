// ============================================
// Navigation Data
// ============================================

import {
    BookOpen,
    CheckSquare,
    PieChart,
    Users,
    Settings,
    Landmark,
    FileText,
    PiggyBank,
    Gift,
    Coins,
    Calendar,
    PenTool,
} from "lucide-react"
import type { NavItem } from "@/types"

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
    // Kvitton tab: not yet built. Add back when receipts component exists.
    // See docs/fix/information-pages.md for tracking.
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
        badgeKey: "pending-bookings",
    },
]

// Rapporter uses a card grid (not tabs). Single nav entry — the page shows
// all available reports filtered by company type features.
export const navRapporter: NavItem[] = [
    {
        title: "Rapporter",
        titleEnkel: "Rapporter",
        url: "/dashboard/rapporter",
        icon: PieChart,
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
        url: "/dashboard/loner?tab=formaner",
        icon: Gift,
        featureKey: "lonebesked",
    },
    {
        title: "Team",
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

// Agare tabs are company-type-dependent. The page component (ownership-page.tsx)
// filters tabs by company type. Nav items here must match what the page actually renders.
// Feature keys gate visibility in the sidebar via hasFeature().
//
// AB: aktiebok, utdelning, firmatecknare, bolagsstamma
// EF: agarinfo (rendered inline, single-tab)
// HB/KB: delagare, firmatecknare
// Forening: medlemsregister, firmatecknare, bolagsstamma (shown as årsmöte)
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
        title: "Medlemsregister",
        titleEnkel: "Medlemmar",
        url: "/dashboard/agare?tab=medlemsregister",
        icon: Users,
        featureKey: "medlemsregister",
    },
    {
        title: "Firmatecknare",
        titleEnkel: "Firmatecknare",
        url: "/dashboard/agare?tab=firmatecknare",
        icon: PenTool,
        featureKey: "firmatecknare",
    },
    {
        title: "Möten & Protokoll",
        titleEnkel: "Möten",
        url: "/dashboard/agare?tab=bolagsstamma",
        icon: Landmark,
        featureKey: "bolagsstamma",
    },
    // arsmote nav item removed — bolagsstamma handles both AB (Bolagsstämma)
    // and Förening (Årsmöte) via company-type switching in ownership-page.tsx
]

// ============================================
// Platform Navigation (combined)
// ============================================

export const navPlatform: NavItem[] = [
    ...navBokforing,
    ...navRapporter,
    ...navLoner,
    ...navAgare,
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

]

