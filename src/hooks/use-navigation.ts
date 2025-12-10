// ============================================
// Navigation Hooks
// ============================================

import { useCallback, useState } from "react"
import type { User, Team, NavigationData } from "@/types"
import * as navigationService from "@/services/navigation"
import { useAsync, useAsyncMutation } from "./use-async"

// ============================================
// useCurrentUser Hook
// ============================================

export function useCurrentUser() {
  const { data: user, isLoading, error, refetch, setData: setUser } = useAsync(
    async () => {
      const response = await navigationService.getCurrentUser()
      if (!response.success) throw new Error(response.error || "Failed to fetch user")
      return response.data
    },
    null as User | null
  )

  const updateMutation = useAsyncMutation(
    async (updates: Partial<User>) => {
      const response = await navigationService.updateUser(updates)
      if (!response.success) throw new Error(response.error || "Failed to update user")
      return response.data
    }
  )

  const updateUser = useCallback(async (updates: Partial<User>) => {
    const result = await updateMutation.execute(updates)
    if (result) setUser(result)
  }, [updateMutation, setUser])

  return {
    user,
    isLoading,
    error: error || updateMutation.error,
    refetch,
    updateUser,
  }
}

// ============================================
// useTeams Hook
// ============================================

export function useTeams() {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)

  const { data: teams, isLoading, error, refetch } = useAsync(
    async () => {
      const [teamsResponse, currentResponse] = await Promise.all([
        navigationService.getTeams(),
        navigationService.getCurrentTeam(),
      ])
      
      if (currentResponse.success) {
        setCurrentTeam(currentResponse.data)
      }
      
      if (!teamsResponse.success) throw new Error("Failed to fetch teams")
      return teamsResponse.data
    },
    [] as Team[]
  )

  const switchMutation = useAsyncMutation(
    async (teamId: string) => {
      const response = await navigationService.switchTeam(teamId)
      if (!response.success) throw new Error(response.error || "Failed to switch team")
      return response.data
    }
  )

  const switchTeam = useCallback(async (teamId: string) => {
    const result = await switchMutation.execute(teamId)
    if (result) setCurrentTeam(result)
  }, [switchMutation])

  return {
    teams,
    currentTeam,
    isLoading,
    error: error || switchMutation.error,
    refetch,
    switchTeam,
  }
}

// ============================================
// useNavigation Hook
// ============================================

export function useNavigation() {
  const { data: navigation, isLoading, error, refetch } = useAsync(
    async () => {
      const response = await navigationService.getNavigation()
      if (!response.success) throw new Error(response.error || "Failed to fetch navigation")
      return response.data
    },
    null as NavigationData | null
  )

  return { navigation, isLoading, error, refetch }
}
