// ============================================
// Inbox Hooks
// ============================================

import { useCallback, useMemo } from "react"
import type { InboxItem, InboxFilter } from "@/types"
import * as inboxService from "@/services/inbox"
import { useAsync, useAsyncMutation } from "./use-async"

// ============================================
// useInbox Hook - Inbox data with actions
// ============================================

export function useInbox(initialFilter: InboxFilter = "all") {
  const { data: items, isLoading, error, refetch, setData } = useAsync(
    async () => {
      const response = await inboxService.getInboxItems(initialFilter)
      if (!response.success) throw new Error(response.error || "Failed to fetch inbox items")
      return response.data
    },
    [] as InboxItem[],
    [initialFilter]
  )

  const markReadMutation = useAsyncMutation(async (id: string) => {
    const response = await inboxService.markAsRead(id)
    if (!response.success) throw new Error(response.error || "Failed to mark as read")
    return response.data
  })

  const markUnreadMutation = useAsyncMutation(async (id: string) => {
    const response = await inboxService.markAsUnread(id)
    if (!response.success) throw new Error(response.error || "Failed to mark as unread")
    return response.data
  })

  const toggleStarMutation = useAsyncMutation(async (id: string) => {
    const response = await inboxService.toggleStar(id)
    if (!response.success) throw new Error(response.error || "Failed to toggle star")
    return response.data
  })

  const archiveMutation = useAsyncMutation(async (id: string) => {
    const response = await inboxService.archiveItem(id)
    if (!response.success) throw new Error(response.error || "Failed to archive")
    return response.data
  })

  const deleteMutation = useAsyncMutation(async (id: string) => {
    const response = await inboxService.deleteItem(id)
    if (!response.success) throw new Error(response.error || "Failed to delete")
    return response.data
  })

  const markAsRead = useCallback(async (id: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, read: true } : item))
    await markReadMutation.execute(id)
  }, [markReadMutation, setData])

  const markAsUnread = useCallback(async (id: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, read: false } : item))
    await markUnreadMutation.execute(id)
  }, [markUnreadMutation, setData])

  const toggleStar = useCallback(async (id: string) => {
    setData(prev => prev.map(item => item.id === id ? { ...item, starred: !item.starred } : item))
    await toggleStarMutation.execute(id)
  }, [toggleStarMutation, setData])

  const archiveItem = useCallback(async (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    await archiveMutation.execute(id)
  }, [archiveMutation, setData])

  const deleteItem = useCallback(async (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    await deleteMutation.execute(id)
  }, [deleteMutation, setData])

  const unreadCount = useMemo(() => items.filter(i => !i.read).length, [items])

  const mutationError = markReadMutation.error || markUnreadMutation.error || 
    toggleStarMutation.error || archiveMutation.error || deleteMutation.error

  const isProcessing = markReadMutation.isLoading || markUnreadMutation.isLoading ||
    toggleStarMutation.isLoading || archiveMutation.isLoading || deleteMutation.isLoading

  return {
    items,
    isLoading,
    error: error || mutationError,
    refetch,
    markAsRead,
    markAsUnread,
    toggleStar,
    archiveItem,
    deleteItem,
    unreadCount,
    isProcessing,
  }
}

// ============================================
// useInboxCounts Hook - Unread and starred counts
// ============================================

export function useInboxCounts() {
  const { data: unreadCount, isLoading: loadingUnread, refetch: refetchUnread } = useAsync(
    async () => {
      const response = await inboxService.getUnreadCount()
      if (!response.success) throw new Error(response.error || "Failed to fetch unread count")
      return response.data
    },
    0
  )

  const { data: starredCount, isLoading: loadingStarred, refetch: refetchStarred } = useAsync(
    async () => {
      const response = await inboxService.getStarredCount()
      if (!response.success) throw new Error(response.error || "Failed to fetch starred count")
      return response.data
    },
    0
  )

  const refetch = useCallback(async () => {
    await Promise.all([refetchUnread(), refetchStarred()])
  }, [refetchUnread, refetchStarred])

  return {
    unreadCount,
    starredCount,
    isLoading: loadingUnread || loadingStarred,
    refetch,
  }
}
