"use client"

import { useState } from "react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Plus, X } from "lucide-react"

export interface TabConfig {
    id: string
    label: string
    color?: string
    icon?: React.ElementType
    feature?: string | null
}

interface PageTabsLayoutProps {
    tabs: TabConfig[]
    currentTab: string
    onTabChange: (tabId: string) => void
    lastUpdated?: React.ReactNode
    maxVisibleTabs?: number
}

export function PageTabsLayout({
    tabs,
    currentTab,
    onTabChange,
    lastUpdated,
    maxVisibleTabs = 4
}: PageTabsLayoutProps) {
    const [showAllTabs, setShowAllTabs] = useState(false)

    // Helper to render a single tab button
    const renderTabButton = (tab: TabConfig) => {
        const isActive = currentTab === tab.id
        const Icon = tab.icon

        return (
            <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                    <button
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap",
                            isActive
                                ? "text-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        {tab.color && <div className={cn("h-2 w-2 rounded-full", tab.color)} />}
                        {Icon && <Icon className="h-4 w-4" />}
                        {isActive && <span>{tab.label}</span>}
                    </button>
                </TooltipTrigger>
                {!isActive && (
                    <TooltipContent side="bottom">
                        <p>{tab.label}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        )
    }

    // Determine which tabs to show based on expansion state
    const visibleTabs = showAllTabs ? tabs : tabs.slice(0, maxVisibleTabs)
    const hasMoreTabs = tabs.length > maxVisibleTabs

    return (
        <TooltipProvider delayDuration={400}>
            <div className="w-full">
                <div className="flex items-center gap-1 pb-2 mb-4 border-b-2 border-border/60 overflow-x-auto scrollbar-hide">

                    {/* Render primary tabs */}
                    {tabs.slice(0, maxVisibleTabs).map(renderTabButton)}

                    {/* Toggle Button for Overflow */}
                    {hasMoreTabs && !showAllTabs && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setShowAllTabs(true)}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Visa fler ({tabs.length - maxVisibleTabs})</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Render Expanded Tabs */}
                    {showAllTabs && tabs.slice(maxVisibleTabs).map(renderTabButton)}

                    {/* Collapse Button */}
                    {showAllTabs && hasMoreTabs && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setShowAllTabs(false)}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Dölj</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Footer / Last Updated */}
                    {lastUpdated && (
                        <div className="ml-auto text-sm text-muted-foreground pl-4 whitespace-nowrap">
                            {lastUpdated}
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
