"use client"

import { useState, useEffect } from "react"

/**
 * Hook that tracks when the component was last mounted/refreshed
 * Returns a formatted Swedish string like "Senast uppdaterad: idag 14:32"
 */
export function useLastUpdated(): string {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [formattedTime, setFormattedTime] = useState<string>("")

  useEffect(() => {
    // Set the timestamp when component mounts
    const now = new Date()
    setLastUpdated(now)
    setFormattedTime(formatLastUpdated(now))
  }, [])

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [formattedTime, setFormattedTime] = useState<string>("")

  useEffect(() => {
    const now = new Date()
    setLastUpdated(now)
    
    const timeStr = now.toLocaleTimeString("sv-SE", { 
      hour: "2-digit", 
      minute: "2-digit" 
    })
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    if (dateOnly.getTime() === today.getTime()) {
      setFormattedTime(`idag ${timeStr}`)
    } else {
      const dateStr = now.toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "short"
      })
      setFormattedTime(`${dateStr} ${timeStr}`)
    }
  }, [])

  return { time: formattedTime, date: lastUpdated }
}
