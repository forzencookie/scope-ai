// ============================================
// Dashboard Mock Data
// 
// Note: Variable names use English (e.g., quickStats, pendingTasks)
// Display strings use Swedish from @/lib/localization or inline for UI text
// ============================================

import type { QuickStat, PendingTask, RecentActivity, QuickLink, DashboardData } from "@/types"

// ============================================
// Quick Stats
// ============================================

export const quickStats: QuickStat[] = [
  { 
    id: "stat-1",
    label: "Omsättning", 
    value: "1,85 mkr", 
    change: "+12%", 
    positive: true, 
    href: "/company-statistics"
  },
  { 
    id: "stat-2",
    label: "Resultat", 
    value: "379 tkr", 
    change: "+8%", 
    positive: true, 
    href: "/company-statistics"
  },
  { 
    id: "stat-3",
    label: "Att hantera", 
    value: "12", 
    change: "transaktioner", 
    positive: null, 
    href: "/accounting"
  },
  { 
    id: "stat-4",
    label: "Banksaldo", 
    value: "245 tkr", 
    change: "-3%", 
    positive: false, 
    href: "/accounting"
  },
]

// ============================================
// Pending Tasks
// ============================================

export const pendingTasks: PendingTask[] = [
  { 
    id: "task-1",
    title: "5 transaktioner väntar på bokföring", 
    href: "/accounting?tab=transaktioner",
    priority: "high",
  },
  { 
    id: "task-2",
    title: "Momsdeklaration förfaller 12 jan", 
    href: "/reports",
    priority: "high",
    dueDate: "2025-01-12",
  },
  { 
    id: "task-3",
    title: "3 fakturor att skicka", 
    href: "/accounting?tab=fakturor",
    priority: "medium",
  },
  { 
    id: "task-4",
    title: "2 kvitton saknar kategori", 
    href: "/accounting?tab=underlag",
    priority: "low",
  },
]

// ============================================
// Recent Activity
// ============================================

export const recentActivity: RecentActivity[] = [
  { 
    id: "activity-1",
    action: "AI kategoriserade", 
    item: "Faktura från Adobe", 
    time: "2 min sedan",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  { 
    id: "activity-2",
    action: "Godkänd", 
    item: "Kontorsmaterial 2 450 kr", 
    time: "15 min sedan",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  { 
    id: "activity-3",
    action: "Ny transaktion", 
    item: "Spotify Premium -169 kr", 
    time: "1 timme sedan",
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
  },
  { 
    id: "activity-4",
    action: "Matchad", 
    item: "Faktura #1234 → Betalning", 
    time: "2 timmar sedan",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  { 
    id: "activity-5",
    action: "Uppladdad", 
    item: "Kvitto Clas Ohlson", 
    time: "3 timmar sedan",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
]

// ============================================
// Quick Links
// ============================================

export const quickLinks: QuickLink[] = [
  { 
    id: "link-1",
    label: "Ladda upp kvitto", 
    href: "/accounting?tab=underlag" 
  },
  { 
    id: "link-2",
    label: "Ny faktura", 
    href: "/accounting?tab=fakturor" 
  },
  { 
    id: "link-3",
    label: "Momsrapport", 
    href: "/reports" 
  },
  { 
    id: "link-4",
    label: "Fråga AI", 
    href: "/ai-robot" 
  },
]

// ============================================
// Combined Dashboard Data
// ============================================

export const dashboardData: DashboardData = {
  quickStats,
  pendingTasks,
  recentActivity,
  quickLinks,
}

// Legacy exports for backward compatibility
/** @deprecated Use `quickStats` instead */
export const mockQuickStats = quickStats
/** @deprecated Use `pendingTasks` instead */
export const mockPendingTasks = pendingTasks
/** @deprecated Use `recentActivity` instead */
export const mockRecentActivity = recentActivity
/** @deprecated Use `quickLinks` instead */
export const mockQuickLinks = quickLinks
/** @deprecated Use `dashboardData` instead */
export const mockDashboardData = dashboardData
