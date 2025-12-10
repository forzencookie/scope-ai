"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { RefreshCw, CheckCircle2, AlertCircle, Clock, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export type SyncState = "synced" | "syncing" | "error" | "offline" | "stale"

interface SyncStatusProps {
    /** Current sync state */
    state?: SyncState
    /** Last sync timestamp */
    lastSynced?: Date | string | null
    /** Callback when refresh is requested */
    onRefresh?: () => void
    /** Whether refresh is in progress */
    isRefreshing?: boolean
    /** Custom label */
    label?: string
    /** Show refresh button */
    showRefresh?: boolean
    /** Compact mode - only show icon */
    compact?: boolean
    /** Additional className */
    className?: string
}

const stateConfig: Record<SyncState, { 
    icon: React.ElementType
    color: string
    label: string
    animate?: boolean
}> = {
    synced: { 
        icon: CheckCircle2, 
        color: "text-emerald-600", 
        label: "Synkroniserad" 
    },
    syncing: { 
        icon: RefreshCw, 
        color: "text-blue-600", 
        label: "Synkroniserar...",
        animate: true
    },
    error: { 
        icon: AlertCircle, 
        color: "text-red-600", 
        label: "Synkfel" 
    },
    offline: { 
        icon: WifiOff, 
        color: "text-muted-foreground", 
        label: "Offline" 
    },
    stale: { 
        icon: Clock, 
        color: "text-amber-600", 
        label: "Uppdatering tillgänglig" 
    },
}

function formatLastSynced(date: Date | string | null): string {
    if (!date) return ""
    
    const now = new Date()
    const syncDate = typeof date === "string" ? new Date(date) : date
    const diffMs = now.getTime() - syncDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return "Just nu"
    if (diffMins === 1) return "1 min sedan"
    if (diffMins < 60) return `${diffMins} min sedan`
    if (diffHours === 1) return "1 timme sedan"
    if (diffHours < 24) return `${diffHours} timmar sedan`
    if (diffDays === 1) return "Igår"
    return `${diffDays} dagar sedan`
}

export function SyncStatus({
    state = "synced",
    lastSynced,
    onRefresh,
    isRefreshing = false,
    label,
    showRefresh = true,
    compact = false,
    className,
}: SyncStatusProps) {
    const [relativeTime, setRelativeTime] = useState<string>("")
    
    // Update relative time every minute
    useEffect(() => {
        if (!lastSynced) return
        
        const updateTime = () => {
            setRelativeTime(formatLastSynced(lastSynced))
        }
        
        updateTime()
        const interval = setInterval(updateTime, 60000)
        return () => clearInterval(interval)
    }, [lastSynced])
    
    const config = stateConfig[isRefreshing ? "syncing" : state]
    const Icon = config.icon
    const displayLabel = label || config.label
    
    const content = (
        <div className={cn(
            "flex items-center gap-1.5 text-sm",
            config.color,
            className
        )}>
            <Icon className={cn(
                "h-3.5 w-3.5",
                (config.animate || isRefreshing) && "animate-spin"
            )} />
            {!compact && (
                <>
                    <span className="font-medium">{displayLabel}</span>
                    {relativeTime && state === "synced" && !isRefreshing && (
                        <span className="text-muted-foreground">• {relativeTime}</span>
                    )}
                </>
            )}
        </div>
    )
    
    if (compact) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                        {content}
                        {showRefresh && onRefresh && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={onRefresh}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={cn(
                                    "h-3 w-3",
                                    isRefreshing && "animate-spin"
                                )} />
                            </Button>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{displayLabel}{relativeTime && ` • ${relativeTime}`}</p>
                </TooltipContent>
            </Tooltip>
        )
    }
    
    return (
        <div className="flex items-center gap-2">
            {content}
            {showRefresh && onRefresh && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw className={cn(
                        "h-3.5 w-3.5",
                        isRefreshing && "animate-spin"
                    )} />
                </Button>
            )}
        </div>
    )
}

// Hook to manage sync state
export function useSyncStatus(initialLastSynced?: Date) {
    const [state, setState] = useState<SyncState>("synced")
    const [lastSynced, setLastSynced] = useState<Date | null>(initialLastSynced || new Date())
    const [isRefreshing, setIsRefreshing] = useState(false)
    
    const refresh = async (syncFn?: () => Promise<void>) => {
        setIsRefreshing(true)
        setState("syncing")
        
        try {
            if (syncFn) {
                await syncFn()
            } else {
                // Simulate sync delay
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
            setLastSynced(new Date())
            setState("synced")
        } catch {
            setState("error")
        } finally {
            setIsRefreshing(false)
        }
    }
    
    const setOffline = () => setState("offline")
    const setOnline = () => setState("synced")
    const setStale = () => setState("stale")
    const setError = () => setState("error")
    
    return {
        state,
        lastSynced,
        isRefreshing,
        refresh,
        setOffline,
        setOnline,
        setStale,
        setError,
    }
}
