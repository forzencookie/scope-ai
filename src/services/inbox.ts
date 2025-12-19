// ============================================
// Inbox Service
// ============================================

import type { InboxItem, InboxFilter, ApiResponse, PaginatedResponse } from "@/types"
import { delay } from "@/lib/utils"

// Simulated network delay for development
const MOCK_DELAY = 0 // Set to 500 for simulating network latency

// In-memory state for mock mutations
let inboxState: InboxItem[] = []

// ============================================
// Inbox Items Service
// ============================================

export async function getInboxItems(filter?: InboxFilter): Promise<ApiResponse<InboxItem[]>> {
  await delay(MOCK_DELAY)

  // TODO: Replace with actual API call
  // const response = await fetch(`/api/receive?filter=${filter}`)
  // return response.json()

  let filteredItems = inboxState

  if (filter === "unread") {
    filteredItems = inboxState.filter(item => !item.read)
  } else if (filter === "starred") {
    filteredItems = inboxState.filter(item => item.starred)
  }

  return {
    data: filteredItems,
    success: true,
    timestamp: new Date(),
  }
}

export async function getInboxItemsPaginated(
  page: number = 1,
  pageSize: number = 10,
  filter?: InboxFilter
): Promise<PaginatedResponse<InboxItem>> {
  await delay(MOCK_DELAY)

  let filteredItems = inboxState

  if (filter === "unread") {
    filteredItems = inboxState.filter(item => !item.read)
  } else if (filter === "starred") {
    filteredItems = inboxState.filter(item => item.starred)
  }

  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedItems = filteredItems.slice(start, end)

  return {
    data: paginatedItems,
    total: filteredItems.length,
    page,
    pageSize,
    hasMore: end < filteredItems.length,
  }
}

export async function getInboxItem(id: string): Promise<ApiResponse<InboxItem | null>> {
  await delay(MOCK_DELAY)

  const item = inboxState.find(i => i.id === id)

  return {
    data: item || null,
    success: !!item,
    error: item ? undefined : "Item not found",
    timestamp: new Date(),
  }
}

// ============================================
// Inbox Actions Service
// ============================================

export async function markAsRead(id: string): Promise<ApiResponse<InboxItem>> {
  await delay(MOCK_DELAY)

  // TODO: Replace with actual API call
  // const response = await fetch(`/api/receive/${id}/read`, { method: 'POST' })
  // return response.json()

  const itemIndex = inboxState.findIndex(i => i.id === id)
  if (itemIndex === -1) {
    return {
      data: {} as InboxItem,
      success: false,
      error: "Item not found",
      timestamp: new Date(),
    }
  }

  inboxState[itemIndex] = { ...inboxState[itemIndex], read: true }

  return {
    data: inboxState[itemIndex],
    success: true,
    timestamp: new Date(),
  }
}

export async function markAsUnread(id: string): Promise<ApiResponse<InboxItem>> {
  await delay(MOCK_DELAY)

  const itemIndex = inboxState.findIndex(i => i.id === id)
  if (itemIndex === -1) {
    return {
      data: {} as InboxItem,
      success: false,
      error: "Item not found",
      timestamp: new Date(),
    }
  }

  inboxState[itemIndex] = { ...inboxState[itemIndex], read: false }

  return {
    data: inboxState[itemIndex],
    success: true,
    timestamp: new Date(),
  }
}

export async function toggleStar(id: string): Promise<ApiResponse<InboxItem>> {
  await delay(MOCK_DELAY)

  // TODO: Replace with actual API call
  // const response = await fetch(`/api/receive/${id}/star`, { method: 'POST' })
  // return response.json()

  const itemIndex = inboxState.findIndex(i => i.id === id)
  if (itemIndex === -1) {
    return {
      data: {} as InboxItem,
      success: false,
      error: "Item not found",
      timestamp: new Date(),
    }
  }

  inboxState[itemIndex] = {
    ...inboxState[itemIndex],
    starred: !inboxState[itemIndex].starred
  }

  return {
    data: inboxState[itemIndex],
    success: true,
    timestamp: new Date(),
  }
}

export async function archiveItem(id: string): Promise<ApiResponse<boolean>> {
  await delay(MOCK_DELAY)

  // TODO: Replace with actual API call
  // const response = await fetch(`/api/receive/${id}/archive`, { method: 'POST' })
  // return response.json()

  const itemIndex = inboxState.findIndex(i => i.id === id)
  if (itemIndex === -1) {
    return {
      data: false,
      success: false,
      error: "Item not found",
      timestamp: new Date(),
    }
  }

  inboxState = inboxState.filter(i => i.id !== id)

  return {
    data: true,
    success: true,
    timestamp: new Date(),
  }
}

export async function deleteItem(id: string): Promise<ApiResponse<boolean>> {
  await delay(MOCK_DELAY)

  const itemIndex = inboxState.findIndex(i => i.id === id)
  if (itemIndex === -1) {
    return {
      data: false,
      success: false,
      error: "Item not found",
      timestamp: new Date(),
    }
  }

  inboxState = inboxState.filter(i => i.id !== id)

  return {
    data: true,
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Inbox Stats Service
// ============================================

export async function getUnreadCount(): Promise<ApiResponse<number>> {
  await delay(MOCK_DELAY)

  const count = inboxState.filter(i => !i.read).length

  return {
    data: count,
    success: true,
    timestamp: new Date(),
  }
}

export async function getStarredCount(): Promise<ApiResponse<number>> {
  await delay(MOCK_DELAY)

  const count = inboxState.filter(i => i.starred).length

  return {
    data: count,
    success: true,
    timestamp: new Date(),
  }
}

// ============================================
// Reset mock state (for testing)
// ============================================

export function resetInboxState(): void {
  inboxState = []
}
