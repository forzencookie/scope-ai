/**
 * Meeting Status Utilities
 * Centralized functions for meeting status labels and mappings.
 * Used by: arsmote, styrelseprotokoll, bolagsstamma
 */

import type { MeetingStatus } from "@/lib/status-types"

// =============================================================================
// Annual Meeting Status
// =============================================================================

export type AnnualMeetingStatus = 'planerad' | 'kallad' | 'genomförd' | 'protokoll signerat'

const ANNUAL_MEETING_STATUS_MAP: Record<AnnualMeetingStatus, MeetingStatus> = {
    'planerad': 'Planerad',
    'kallad': 'Kallad',
    'genomförd': 'Genomförd',
    'protokoll signerat': 'Signerat',
}

/**
 * Get display label for annual meeting status
 */
export function getAnnualMeetingStatusLabel(status: AnnualMeetingStatus): MeetingStatus {
    return ANNUAL_MEETING_STATUS_MAP[status] ?? 'Planerad'
}

// =============================================================================
// Board Meeting Status
// =============================================================================

export type BoardMeetingStatus = 'planerad' | 'genomförd' | 'protokoll signerat'

const BOARD_MEETING_STATUS_MAP: Record<BoardMeetingStatus, MeetingStatus> = {
    'planerad': 'Planerad',
    'genomförd': 'Genomförd',
    'protokoll signerat': 'Signerat',
}

/**
 * Get display label for board meeting status
 */
export function getBoardMeetingStatusLabel(status: BoardMeetingStatus): MeetingStatus {
    return BOARD_MEETING_STATUS_MAP[status] ?? 'Planerad'
}

// =============================================================================
// Generic Meeting Status (for components that handle both types)
// =============================================================================

/**
 * Get display label for any meeting status
 * Falls back to the input if not recognized
 */
export function getMeetingStatusLabel(status: string): MeetingStatus {
    const allMappings: Record<string, MeetingStatus> = {
        ...ANNUAL_MEETING_STATUS_MAP,
        ...BOARD_MEETING_STATUS_MAP,
    }
    return allMappings[status] ?? (status as MeetingStatus)
}
