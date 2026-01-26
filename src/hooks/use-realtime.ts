"use client"

/**
 * useRealtime - Real-time collaboration hooks
 *
 * Enables multi-user collaboration by subscribing to:
 * 1. Database changes - Know when data is updated
 * 2. Presence - See who's online and what they're viewing
 * 3. Broadcast - Custom events like "user is editing"
 *
 * Uses Supabase Realtime under the hood.
 */

import { useEffect, useState, useCallback, useRef } from "react"
import { getSupabaseClient } from "@/lib/database/supabase"
import { useAuth } from "./use-auth"
import type { RealtimeChannel, RealtimePresenceState } from "@supabase/supabase-js"

// ============================================================================
// Types
// ============================================================================

export interface PresenceUser {
  id: string
  email?: string
  name?: string
  avatar?: string
  currentPage?: string
  lastSeen: Date
  isEditing?: boolean
  editingRecord?: string // ID of record being edited
}

export interface RealtimeEvent<T = unknown> {
  type: "INSERT" | "UPDATE" | "DELETE"
  table: string
  record: T
  oldRecord?: T
  timestamp: Date
}

interface UseRealtimeOptions {
  /** Channel name (usually company ID or shared context) */
  channelName: string
  /** Current page the user is viewing */
  currentPage?: string
  /** Callback when data changes */
  onDataChange?: (event: RealtimeEvent) => void
  /** Tables to subscribe to */
  tables?: string[]
}

interface UseRealtimeReturn {
  /** Users currently online in this channel */
  onlineUsers: PresenceUser[]
  /** Whether the realtime connection is active */
  isConnected: boolean
  /** Broadcast a custom event to all users */
  broadcast: (event: string, payload: unknown) => void
  /** Update your presence (e.g., "I'm editing invoice X") */
  updatePresence: (data: Partial<PresenceUser>) => void
  /** Track when you start/stop editing a record */
  startEditing: (recordId: string) => void
  stopEditing: () => void
  /** Check if someone else is editing a specific record */
  isRecordBeingEdited: (recordId: string) => PresenceUser | null
}

// ============================================================================
// Main Hook
// ============================================================================

export function useRealtime({
  channelName,
  currentPage,
  onDataChange,
  tables = [],
}: UseRealtimeOptions): UseRealtimeReturn {
  const { user } = useAuth()
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabaseRef = useRef(getSupabaseClient())

  // Initialize channel and subscriptions
  useEffect(() => {
    if (!user?.id || !channelName) return

    const supabase = supabaseRef.current
    const channel = supabase.channel(`room:${channelName}`, {
      config: {
        presence: { key: user.id },
      },
    })

    // ========================================
    // 1. Presence - Who's online
    // ========================================
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceUser>()
      const users = Object.values(state)
        .flat()
        .filter((u) => u.id !== user.id) // Exclude self
      setOnlineUsers(users as PresenceUser[])
    })

    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      console.log("[Realtime] User joined:", newPresences)
    })

    channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      console.log("[Realtime] User left:", leftPresences)
    })

    // ========================================
    // 2. Database Changes
    // ========================================
    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table,
        },
        (payload) => {
          const event: RealtimeEvent = {
            type: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            table,
            record: payload.new,
            oldRecord: payload.old,
            timestamp: new Date(),
          }
          console.log("[Realtime] Database change:", event)
          onDataChange?.(event)
        }
      )
    })

    // ========================================
    // 3. Custom Broadcasts
    // ========================================
    channel.on("broadcast", { event: "*" }, (payload) => {
      console.log("[Realtime] Broadcast received:", payload)
    })

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true)
        // Announce our presence
        await channel.track({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split("@")[0],
          avatar: user.user_metadata?.avatar_url,
          currentPage,
          lastSeen: new Date(),
          isEditing: false,
        })
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false)
      }
    })

    channelRef.current = channel

    // Cleanup
    return () => {
      channel.unsubscribe()
      channelRef.current = null
      setIsConnected(false)
    }
  }, [user?.id, channelName, tables.join(","), onDataChange])

  // Update presence when page changes
  useEffect(() => {
    if (channelRef.current && currentPage) {
      channelRef.current.track({
        id: user?.id,
        currentPage,
        lastSeen: new Date(),
      })
    }
  }, [currentPage, user?.id])

  // ========================================
  // Actions
  // ========================================

  const broadcast = useCallback((event: string, payload: unknown) => {
    channelRef.current?.send({
      type: "broadcast",
      event,
      payload,
    })
  }, [])

  const updatePresence = useCallback(
    (data: Partial<PresenceUser>) => {
      if (channelRef.current && user?.id) {
        channelRef.current.track({
          id: user.id,
          ...data,
          lastSeen: new Date(),
        })
      }
    },
    [user?.id]
  )

  const startEditing = useCallback(
    (recordId: string) => {
      updatePresence({ isEditing: true, editingRecord: recordId })
      broadcast("editing:start", { userId: user?.id, recordId })
    },
    [updatePresence, broadcast, user?.id]
  )

  const stopEditing = useCallback(() => {
    updatePresence({ isEditing: false, editingRecord: undefined })
    broadcast("editing:stop", { userId: user?.id })
  }, [updatePresence, broadcast, user?.id])

  const isRecordBeingEdited = useCallback(
    (recordId: string): PresenceUser | null => {
      return onlineUsers.find((u) => u.editingRecord === recordId) || null
    },
    [onlineUsers]
  )

  return {
    onlineUsers,
    isConnected,
    broadcast,
    updatePresence,
    startEditing,
    stopEditing,
    isRecordBeingEdited,
  }
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook for showing who's viewing the same page as you
 */
export function usePagePresence(pagePath: string) {
  const { user } = useAuth()
  
  // Use company ID as channel (all company members see each other)
  // In real implementation, get this from CompanyProvider
  const channelName = user?.id ? `company-${user.id}` : ""

  const { onlineUsers, isConnected } = useRealtime({
    channelName,
    currentPage: pagePath,
  })

  // Filter to users on the same page
  const usersOnSamePage = onlineUsers.filter((u) => u.currentPage === pagePath)

  return {
    usersOnSamePage,
    allOnlineUsers: onlineUsers,
    isConnected,
  }
}

/**
 * Hook for preventing edit conflicts
 */
export function useEditLock(table: string, recordId: string) {
  const { user } = useAuth()
  const channelName = user?.id ? `edit-${table}-${recordId}` : ""

  const { onlineUsers, startEditing, stopEditing, isRecordBeingEdited } =
    useRealtime({
      channelName,
      tables: [table],
    })

  const lockedBy = isRecordBeingEdited(recordId)
  const isLocked = lockedBy !== null && lockedBy.id !== user?.id

  return {
    isLocked,
    lockedBy,
    acquireLock: () => startEditing(recordId),
    releaseLock: stopEditing,
    editors: onlineUsers.filter((u) => u.isEditing),
  }
}
