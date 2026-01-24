// @ts-nocheck - TODO: Fix after regenerating Supabase types with proper PostgrestVersion
// ============================================
// Navigation Service
// ============================================

import type { User, Team, NavItem, NavigationData, ApiResponse } from "@/types"
import { navPlatform, navSettings } from "@/data/navigation"
import { delay } from "@/lib/utils"

// Helper to get base URL
function getApiBaseUrl() {
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

// ============================================
// User Service
// ============================================

export async function getCurrentUser(): Promise<ApiResponse<User>> {
    try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/api/auth/me`, {
            credentials: 'include',
            cache: 'no-store'
        })
        
        if (res.ok) {
            const data = await res.json()
            return {
                data: data.user,
                success: true,
                timestamp: new Date(),
            }
        }
    } catch (error) {
        console.error('[Navigation] Failed to fetch current user:', error)
    }
    
    // Return empty user if not authenticated
    return {
        data: null as unknown as User,
        success: false,
        error: 'Not authenticated',
        timestamp: new Date(),
    }
}

export async function updateUser(user: Partial<User>): Promise<ApiResponse<User>> {
    try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/api/auth/me`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        })
        
        if (res.ok) {
            const data = await res.json()
            return {
                data: data.user,
                success: true,
                timestamp: new Date(),
            }
        }
    } catch (error) {
        console.error('[Navigation] Failed to update user:', error)
    }
    
    return {
        data: null as unknown as User,
        success: false,
        error: 'Failed to update user',
        timestamp: new Date(),
    }
}

// ============================================
// Team Service
// ============================================

export async function getTeams(): Promise<ApiResponse<Team[]>> {
    try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/api/teams`, {
            credentials: 'include',
            cache: 'no-store'
        })
        
        if (res.ok) {
            const data = await res.json()
            return {
                data: data.teams || [],
                success: true,
                timestamp: new Date(),
            }
        }
    } catch (error) {
        console.error('[Navigation] Failed to fetch teams:', error)
    }
    
    return {
        data: [],
        success: false,
        error: 'Failed to fetch teams',
        timestamp: new Date(),
    }
}

export async function getCurrentTeam(): Promise<ApiResponse<Team>> {
    const teamsResponse = await getTeams()
    
    if (teamsResponse.success && teamsResponse.data.length > 0) {
        return {
            data: teamsResponse.data[0],
            success: true,
            timestamp: new Date(),
        }
    }
    
    return {
        data: null as unknown as Team,
        success: false,
        error: 'No teams available',
        timestamp: new Date(),
    }
}

export async function switchTeam(teamId: string): Promise<ApiResponse<Team>> {
    try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/api/teams/switch`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId })
        })
        
        if (res.ok) {
            const data = await res.json()
            return {
                data: data.team,
                success: true,
                timestamp: new Date(),
            }
        }
    } catch (error) {
        console.error('[Navigation] Failed to switch team:', error)
    }
    
    return {
        data: null as unknown as Team,
        success: false,
        error: 'Failed to switch team',
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
      navSettings,
    },
    success: true,
    timestamp: new Date(),
  }
}

export async function getNavigationBySection(section: "platform" | "settings"): Promise<ApiResponse<NavItem[]>> {
  await delay(MOCK_DELAY)

  const sectionMap = {
    platform: navPlatform,
    settings: navSettings,
  }

  return {
    data: sectionMap[section],
    success: true,
    timestamp: new Date(),
  }
}
