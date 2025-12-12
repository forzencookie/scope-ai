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
  plan: "Free",
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
    title: "Inkorg",
    url: "/dashboard/inbox",
    icon: Mail,
    isActive: true,
  },
  {
    title: "AI Robot",
    url: "/dashboard/ai-robot",
    icon: Bot,
  },
  {
    title: "Dagbok",
    url: "/dashboard/dagbok",
    icon: Apple,
  },
]

// ============================================
// Economy Navigation
// ============================================

export const navEconomy: NavItem[] = [
  {
    title: "Bokföring",
    url: "/dashboard/accounting",
    icon: BookOpen,
    items: [
      {
        title: "Transaktioner",
        url: "/dashboard/accounting?tab=transaktioner",
      },
      {
        title: "Fakturor & Kvitton",
        url: "/dashboard/accounting?tab=underlag",
      },
      {
        title: "Verifikationer",
        url: "/dashboard/accounting?tab=verifikationer",
      },
    ],
  },
  {
    title: "Rapporter",
    url: "/dashboard/reports",
    icon: PieChart,
    items: [
      {
        title: "Momsdeklaration",
        url: "/dashboard/reports?tab=momsdeklaration",
        featureKey: "momsdeklaration",
      },
      {
        title: "Inkomstdeklaration",
        url: "/dashboard/reports?tab=inkomstdeklaration",
        featureKey: "inkomstdeklaration",
      },
      {
        title: "Årsredovisning",
        url: "/dashboard/reports?tab=arsredovisning",
        featureKey: "arsredovisning",
      },
      {
        title: "Årsbokslut",
        url: "/dashboard/reports?tab=arsbokslut",
        featureKey: "arsbokslut",
      },
    ],
  },
  {
    title: "Löner",
    url: "/dashboard/payroll",
    icon: PiggyBank,
    items: [
      {
        title: "Lönebesked",
        url: "/dashboard/payroll?tab=lonebesked",
        featureKey: "lonebesked",
      },
      {
        title: "AGI",
        url: "/dashboard/payroll?tab=agi",
        featureKey: "agi",
      },
      {
        title: "Utdelning",
        url: "/dashboard/payroll?tab=utdelning",
        featureKey: "utdelning",
      },
      {
        title: "Egenavgifter",
        url: "/dashboard/payroll?tab=egenavgifter",
        featureKey: "egenavgifter",
      },
      {
        title: "Delägaruttag",
        url: "/dashboard/payroll?tab=delagaruttag",
        featureKey: "delagaruttag",
      },
    ],
  },
  {
    title: "Ägare & Styrning",
    url: "/dashboard/agare",
    icon: Landmark,
    items: [
      {
        title: "Aktiebok",
        url: "/dashboard/agare?tab=aktiebok",
        featureKey: "aktiebok",
      },
      {
        title: "Delägare",
        url: "/dashboard/agare?tab=delagare",
        featureKey: "delagare",
      },
      {
        title: "Medlemsregister",
        url: "/dashboard/agare?tab=medlemsregister",
        featureKey: "medlemsregister",
      },
      {
        title: "Styrelseprotokoll",
        url: "/dashboard/agare?tab=styrelseprotokoll",
        featureKey: "styrelseprotokoll",
      },
      {
        title: "Bolagsstämma",
        url: "/dashboard/agare?tab=bolagsstamma",
        featureKey: "bolagsstamma",
      },
      {
        title: "Årsmöte",
        url: "/dashboard/agare?tab=arsmote",
        featureKey: "arsmote",
      },
    ],
  },
]

// ============================================
// Settings Navigation
// ============================================

export const navSettings: NavItem[] = [
  {
    title: "Inställningar",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Företagsstatistik",
    url: "/dashboard/company-statistics",
    icon: Captions,
  },
]
