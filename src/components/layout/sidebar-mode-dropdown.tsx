"use client"

import * as React from "react"
import { Bot, Menu, ChevronDown, LogOut, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type SidebarMode } from "./app-sidebar"

interface SidebarModeDropdownProps {
    mode: SidebarMode
    onModeChange: (mode: SidebarMode) => void
}

export function SidebarModeDropdown({ mode, onModeChange }: SidebarModeDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-full justify-between h-10 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
                >
                    <div className="flex items-center gap-2">
                        <ScopeAILogo className="size-6 text-purple-600 dark:text-purple-400" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="font-semibold text-sm">Scope AI</span>
                            <span className="text-[10px] text-muted-foreground">Workspace</span>
                        </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[220px]" align="start" sideOffset={4}>
                <DropdownMenuItem
                    onClick={() => onModeChange("navigation")}
                    className="gap-3 py-2.5 cursor-pointer"
                >
                    <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-medium">Meny</span>
                        <span className="text-xs text-muted-foreground">Hantera verksamheten</span>
                    </div>
                    {mode === "navigation" && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onModeChange("ai-chat")}
                    className="gap-3 py-2.5 cursor-pointer"
                >
                    <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-medium">Scope AI</span>
                        <span className="text-xs text-muted-foreground">Automatisera arbetet</span>
                    </div>
                    {mode === "ai-chat" && <Check className="h-4 w-4 ml-auto" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem className="gap-2 text-muted-foreground focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 py-2 cursor-pointer">
                    <LogOut className="h-4 w-4 text-current" />
                    <span className="text-sm">Logga ut</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
