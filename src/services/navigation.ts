// ============================================
// Navigation Service
// ============================================

import type { User, Team, NavItem, NavigationData, ApiResponse } from "@/types"
import { mockUser, mockTeams, navPlatform, navEconomy, navSettings } from "@/data/navigation"
import { delay } from "@/lib/utils"

// Simulated network delay for development
const MOCK_DELAY = 0 // Set to 500 for simulating network latency

// ============================================
// User Service
// ============================================

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/user/current')
  // return response.json()
  
  return {
    data: mockUser,
    success: true,
    timestamp: new Date(),
  }
}

export async function updateUser(user: Partial<User>): Promise<ApiResponse<User>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/user/current', {
  //   method: 'PATCH',
  //   body: JSON.stringify(user),
  // })
  // return response.json()
  
  const updatedUser = { ...mockUser, ...user }
  return {
    data: updatedUser,
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Team Service
// ============================================

export async function getTeams(): Promise<ApiResponse<Team[]>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // const response = await fetch('/api/teams')
  // return response.json()
  
  return {
    data: mockTeams,
    success: true,
    timestamp: new Date(),
  }
}

export async function getCurrentTeam(): Promise<ApiResponse<Team>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  return {
    data: mockTeams[0],
    success: true,
    timestamp: new Date(),
  }
}

export async function switchTeam(teamId: string): Promise<ApiResponse<Team>> {
  await delay(MOCK_DELAY)
  
  const team = mockTeams.find(t => t.id === teamId)
  if (!team) {
    return {
      data: mockTeams[0],
      success: false,
      error: "Team not found",
      timestamp: new Date(),
    }
  }
  
  return {
    data: team,
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Navigation Service
// ============================================

export async function getNavigation(): Promise<ApiResponse<NavigationData>> {
  await delay(MOCK_DELAY)
  
  // TODO: Replace with actual API call
  // Navigation items could be dynamic based on user permissions
  // const response = await fetch('/api/navigation')
  // return response.json()
  
  return {
    data: {
      navPlatform,
      navEconomy,
      navSettings,
    },
    success: true,
    timestamp: new Date(),
  }
}

export async function getNavigationBySection(section: "platform" | "economy" | "settings"): Promise<ApiResponse<NavItem[]>> {
  await delay(MOCK_DELAY)
  
  const sectionMap = {
    platform: navPlatform,
    economy: navEconomy,
    settings: navSettings,
  }
  
  return {
    data: sectionMap[section],
    success: true,
    timestamp: new Date(),
  }
}
