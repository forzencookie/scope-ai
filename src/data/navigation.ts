// ============================================
// Navigation Mock Data
// ============================================

import {
  BookOpen,
  Bot,
  Box,
  Calendar,
  CheckSquare,
  Frame,
  Home,
  Inbox,
  PieChart,
  Building2,
  Users,
  Puzzle,
} from "lucide-react"
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
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Inkorg",
    url: "/inbox",
    icon: Inbox,
  },
  {
    title: "Uppgifter",
    url: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "AI Robot",
    url: "/ai-robot",
    icon: Bot,
  },
  {
    title: "Dagbok",
    url: "/dagbok",
    icon: Calendar,
  },
]

// ============================================
// Economy Navigation
// ============================================

export const navEconomy: NavItem[] = [
  {
    title: "Bokföring",
    url: "/accounting",
    icon: BookOpen,
    items: [
      {
        title: "Transaktioner",
        url: "/accounting?tab=transaktioner",
      },
      {
        title: "AI-matchning",
        url: "/accounting?tab=ai-matchning",
      },
      {
        title: "Fakturor & Kvitton",
        url: "/accounting?tab=underlag",
      },
      {
        title: "Verifikationer",
        url: "/accounting?tab=verifikationer",
      },
    ],
  },
  {
    title: "Rapporter",
    url: "/reports",
    icon: PieChart,
    items: [
      {
        title: "Momsdeklaration",
        url: "/reports?tab=momsdeklaration",
      },
      {
        title: "Inkomstdeklaration",
        url: "/reports?tab=inkomstdeklaration",
      },
      {
        title: "Årsredovisning",
        url: "/reports?tab=arsredovisning",
      },
    ],
  },
  {
    title: "Löner",
    url: "/payroll",
    icon: Frame,
    items: [
      {
        title: "Lönebesked",
        url: "/payroll?tab=lonebesked",
      },
      {
        title: "AGI",
        url: "/payroll?tab=agi",
      },
      {
        title: "Utdelning",
        url: "/payroll?tab=utdelning",
      },
    ],
  },
]

// ============================================
// Settings Navigation
// ============================================

export const navSettings: NavItem[] = [
  {
    title: "Företagsstatistik",
    url: "/company-statistics",
    icon: PieChart,
  },
  {
    title: "Företags information",
    url: "/settings/company-info",
    icon: Building2,
  },
  {
    title: "Team och anställda",
    url: "/settings/team",
    icon: Users,
  },
  {
    title: "Integrationer",
    url: "/settings/integrations",
    icon: Puzzle,
  },
]
