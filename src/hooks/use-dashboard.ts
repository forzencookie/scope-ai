// ============================================
// Dashboard Hooks
// ============================================

import { useCallback } from "react"
import type { 
  DashboardData, 
  QuickStat, 
  PendingTask, 
  RecentActivity, 
  QuickLink 
} from "@/types"
import * as dashboardService from "@/services/dashboard"
import { useAsync, useAsyncMutation } from "./use-async"

// ============================================
// useDashboard Hook - All dashboard data
// ============================================

export function useDashboard() {
  const { data, isLoading, error, refetch } = useAsync(
    async () => {
      const response = await dashboardService.getDashboardData()
      if (!response.success) throw new Error(response.error || "Failed to fetch dashboard data")
      return response.data
    },
    null as DashboardData | null
  )

  return { dashboard: data, isLoading, error, refetch }
}

// ============================================
// useQuickStats Hook
// ============================================

export function useQuickStats() {
  const { data: stats, isLoading, error, refetch, setData } = useAsync(
    async () => {
      const response = await dashboardService.getQuickStats()
      if (!response.success) throw new Error(response.error || "Failed to fetch quick stats")
      return response.data
    },
    [] as QuickStat[]
  )

  const updateStat = useCallback((id: string, updates: Partial<QuickStat>) => {
    setData(prev => prev.map(stat => stat.id === id ? { ...stat, ...updates } : stat))
  }, [setData])

  return { stats, isLoading, error, refetch, updateStat }
}

// ============================================
// usePendingTasks Hook
// ============================================

export function usePendingTasks() {
  const { data: tasks, isLoading, error, refetch, setData } = useAsync(
    async () => {
      const response = await dashboardService.getPendingTasks()
      if (!response.success) throw new Error(response.error || "Failed to fetch pending tasks")
      return response.data
    },
    [] as PendingTask[]
  )

  const completeMutation = useAsyncMutation(
    async (taskId: string) => {
      const response = await dashboardService.completeTask(taskId)
      if (!response.success) throw new Error(response.error || "Failed to complete task")
      return response.data
    }
  )

  const snoozeMutation = useAsyncMutation(
    async (taskId: string) => {
      const response = await dashboardService.dismissTask(taskId)
      if (!response.success) throw new Error(response.error || "Failed to dismiss task")
      return response.data
    }
  )

  const completeTask = useCallback(async (taskId: string) => {
    setData(prev => prev.filter(t => t.id !== taskId))
    await completeMutation.execute(taskId)
  }, [completeMutation, setData])

  const snoozeTask = useCallback(async (taskId: string) => {
    setData(prev => prev.filter(t => t.id !== taskId))
    await snoozeMutation.execute(taskId)
  }, [snoozeMutation, setData])

  return {
    tasks,
    isLoading,
    error: error || completeMutation.error || snoozeMutation.error,
    refetch,
    completeTask,
    snoozeTask,
    isProcessing: completeMutation.isLoading || snoozeMutation.isLoading,
  }
}

// ============================================
// useRecentActivity Hook
// ============================================

export function useRecentActivity(limit: number = 10) {
  const { data: activities, isLoading, error, refetch } = useAsync(
    async () => {
      const response = await dashboardService.getRecentActivity(limit)
      if (!response.success) throw new Error(response.error || "Failed to fetch recent activity")
      return response.data
    },
    [] as RecentActivity[],
    [limit]
  )

  return { activities, isLoading, error, refetch }
}

// ============================================
// useQuickLinks Hook
// ============================================

export function useQuickLinks() {
  const { data: links, isLoading, error, refetch, setData } = useAsync(
    async () => {
      const response = await dashboardService.getQuickLinks()
      if (!response.success) throw new Error(response.error || "Failed to fetch quick links")
      return response.data
    },
    [] as QuickLink[]
  )

  const addMutation = useAsyncMutation(
    async (link: Omit<QuickLink, "id">) => {
      const response = await dashboardService.addQuickLink(link)
      if (!response.success) throw new Error(response.error || "Failed to add quick link")
      return response.data
    }
  )

  const removeMutation = useAsyncMutation(
    async (linkId: string) => {
      const response = await dashboardService.removeQuickLink(linkId)
      if (!response.success) throw new Error(response.error || "Failed to remove quick link")
      return response.data
    }
  )

  const addQuickLink = useCallback(async (link: Omit<QuickLink, "id">) => {
    const result = await addMutation.execute(link)
    if (result) setData(prev => [...prev, result])
  }, [addMutation, setData])

  const removeQuickLink = useCallback(async (linkId: string) => {
    setData(prev => prev.filter(l => l.id !== linkId))
    await removeMutation.execute(linkId)
  }, [removeMutation, setData])

  return {
    links,
    isLoading,
    error: error || addMutation.error || removeMutation.error,
    refetch,
    addQuickLink,
    removeQuickLink,
    isProcessing: addMutation.isLoading || removeMutation.isLoading,
  }
}
