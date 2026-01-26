"use client"

import { useState } from "react"

/**
 * Hook that tracks when the component was last mounted/refreshed
 * Returns a formatted Swedish string like "Senast uppdaterad: idag 14:32"
 */
export function useLastUpdated(): string {
  const [formattedTime] = useState<string>(() => {
      // Set the timestamp when component mounts
      return formatLastUpdated(new Date())
  })
  
  // Effect removed in favor of lazy initializer
  // preventing double render

  return formattedTime
}

/**
 * Formats a date to a Swedish "Senast uppdaterad" string
 */
export function formatLastUpdated(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const timeStr = date.toLocaleTimeString("sv-SE", { 
    hour: "2-digit", 
    minute: "2-digit" 
  })

  if (dateOnly.getTime() === today.getTime()) {
    return `Senast uppdaterad: idag ${timeStr}`
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return `Senast uppdaterad: igår ${timeStr}`
  } else {
    const dateStr = date.toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
    return `Senast uppdaterad: ${dateStr} ${timeStr}`
  }
}

/**
 * Returns just the formatted time string without "Senast uppdaterad:" prefix
 */
export function useLastUpdatedTime(): { time: string; date: Date | null } {
  // Use lazy initializer to set time on mount
  const [mountTime] = useState<{ time: string; date: Date | null }>(() => {
    const now = new Date()
    const timeStr = now.toLocaleTimeString("sv-SE", { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
    return { time: timeStr, date: now }
  })

  // Effect removed

  return mountTime
}
