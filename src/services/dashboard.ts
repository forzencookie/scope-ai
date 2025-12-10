// ============================================
// Dashboard Service
// ============================================

import type { 
  QuickStat, 
  PendingTask, 
  RecentActivity, 
  QuickLink, 
  DashboardData,
  ApiResponse 
} from "@/types"
import { 
  quickStats, 
  pendingTasks, 
  recentActivity, 
  quickLinks,
  dashboardData 
} from "@/data/dashboard"
import { delay } from "@/lib/utils"

// Simulated network delay for development
const MOCK_DELAY = 0 // Set to 500 for simulating network latency

// ============================================
// Dashboard Data Service
// ============================================

export async function getDashboardData(): Promise<ApiResponse<DashboardData>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/dashboard')
  // return response.json()
  
  return {
    data: dashboardData,
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Quick Stats Service
// ============================================

export async function getQuickStats(): Promise<ApiResponse<QuickStat[]>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/dashboard/stats')
  // return response.json()
  
  return {
    data: quickStats,
    success: true,
    timestamp: new Date(),
  }
}

export async function refreshQuickStats(): Promise<ApiResponse<QuickStat[]>> {
  await delay(MOCK_DELAY)
  
  // Simulate refreshing data from backend
  // In real implementation, this would fetch fresh data
  return {
    data: quickStats,
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Pending Tasks Service
// ============================================

export async function getPendingTasks(): Promise<ApiResponse<PendingTask[]>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/dashboard/tasks')
  // return response.json()
  
  return {
    data: pendingTasks,
    success: true,
    timestamp: new Date(),
  }
}

export async function dismissTask(taskId: string): Promise<ApiResponse<boolean>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/dashboard/tasks/${taskId}`, { method: 'DELETE' })
  // return response.json()
  
  return {
    data: true,
    success: true,
    timestamp: new Date(),
  }
}

export async function completeTask(taskId: string): Promise<ApiResponse<PendingTask>> {
  await delay(MOCK_DELAY)
  
  const task = pendingTasks.find(t => t.id === taskId)
  if (!task) {
    return {
      data: {} as PendingTask,
      success: false,
      error: "Task not found",
      timestamp: new Date(),
    }
  }
  
  return {
    data: task,
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Recent Activity Service
// ============================================

export async function getRecentActivity(limit: number = 5): Promise<ApiResponse<RecentActivity[]>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/dashboard/activity?limit=${limit}`)
  // return response.json()
  
  return {
    data: recentActivity.slice(0, limit),
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Quick Links Service
// ============================================

export async function getQuickLinks(): Promise<ApiResponse<QuickLink[]>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/dashboard/quick-links')
  // return response.json()
  
  return {
    data: quickLinks,
    success: true,
    timestamp: new Date(),
  }
}

export async function addQuickLink(link: Omit<QuickLink, "id">): Promise<ApiResponse<QuickLink>> {
  await delay(MOCK_DELAY)
  
  const newLink: QuickLink = {
    ...link,
    id: `link-${Date.now()}`,
  }
  
  return {
    data: newLink,
    success: true,
    timestamp: new Date(),
  }
}

export async function removeQuickLink(linkId: string): Promise<ApiResponse<boolean>> {
  await delay(MOCK_DELAY)
  
  return {
    data: true,
    success: true,
    timestamp: new Date(),
  }
}
