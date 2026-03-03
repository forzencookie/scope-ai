// ============================================
// Navigation Service
// ============================================
// Provides user, team/company, and navigation data.
// Uses direct Supabase auth + company-service (Pattern A).

import { getSupabaseClient } from '@/lib/database/supabase'
import { getMyCompany, type CompanyInfo } from './company-service'
import type { User, Team, NavItem, NavigationData, ApiResponse } from "@/types"
import { navPlatform, navSettings } from "@/data/navigation"

// ============================================
// User Service (direct Supabase auth)
// ============================================

export async function getCurrentUser(): Promise<ApiResponse<User>> {
    try {
        const supabase = getSupabaseClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
            return {
                data: null as unknown as User,
                success: false,
                error: 'Not authenticated',
                timestamp: new Date(),
            }
        }

        return {
            data: {
                id: user.id,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Användare',
                email: user.email || '',
                avatar: user.user_metadata?.avatar_url || '',
            } as User,
            success: true,
            timestamp: new Date(),
        }
    } catch (error) {
        console.error('[Navigation] Failed to fetch current user:', error)
        return {
            data: null as unknown as User,
            success: false,
            error: 'Failed to fetch user',
            timestamp: new Date(),
        }
    }
}

export async function updateUser(user: Partial<User>): Promise<ApiResponse<User>> {
    try {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase.auth.updateUser({
            data: {
                full_name: user.name,
                avatar_url: user.avatar,
            }
        })

        if (error || !data.user) {
            return {
                data: null as unknown as User,
                success: false,
                error: error?.message || 'Failed to update user',
                timestamp: new Date(),
            }
        }

        return {
            data: {
                id: data.user.id,
                name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Användare',
                email: data.user.email || '',
                avatar: data.user.user_metadata?.avatar_url || '',
            } as User,
            success: true,
            timestamp: new Date(),
        }
    } catch (error) {
        console.error('[Navigation] Failed to update user:', error)
        return {
            data: null as unknown as User,
            success: false,
            error: 'Failed to update user',
            timestamp: new Date(),
        }
    }
}

// ============================================
// Team/Company Service (direct Supabase via company-service)
// ============================================

/**
 * Maps a CompanyInfo to the Team shape used by the sidebar.
 */
function companyToTeam(company: CompanyInfo): Team {
    return {
        id: company.id,
        name: company.name,
        orgNumber: company.orgNumber || undefined,
    } as Team
}

export async function getTeams(): Promise<ApiResponse<Team[]>> {
    try {
        const company = await getMyCompany()

        if (company) {
            return {
                data: [companyToTeam(company)],
                success: true,
                timestamp: new Date(),
            }
        }

        return {
            data: [],
            success: true,
            timestamp: new Date(),
        }
    } catch (error) {
        console.error('[Navigation] Failed to fetch teams:', error)
        return {
            data: [],
            success: false,
            error: 'Failed to fetch teams',
            timestamp: new Date(),
        }
    }
}

export async function getCurrentTeam(): Promise<ApiResponse<Team>> {
    const teamsResponse = await getTeams()

    if (teamsResponse.success && teamsResponse.data && teamsResponse.data.length > 0) {
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
    // Currently single-company — switching is a no-op.
    // When multi-company support is added, this will update the active company in context.
    const teamsResponse = await getTeams()
    const team = teamsResponse.data?.find(t => t.id === teamId)

    if (team) {
        return {
            data: team,
            success: true,
            timestamp: new Date(),
        }
    }

    return {
        data: null as unknown as Team,
        success: false,
        error: 'Team not found',
        timestamp: new Date(),
    }
}

// ============================================
// Navigation Service
// ============================================

export function getNavigation(): ApiResponse<NavigationData> {
    return {
        data: {
            navPlatform,
            navSettings,
        },
        success: true,
        timestamp: new Date(),
    }
}

export function getNavigationBySection(section: "platform" | "settings"): ApiResponse<NavItem[]> {
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
