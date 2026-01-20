"use client"

import * as React from "react"
import { ChevronDown, Check } from "lucide-react"
import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { type SidebarMode } from "./app-sidebar"

interface SidebarModeDropdownProps {
    mode: SidebarMode
    onModeChange: (mode: SidebarMode) => void
}

const modes = [
    { id: "navigation" as SidebarMode, label: "Arbetsyta", description: "Hantera verksamheten" },
    { id: "ai-chat" as SidebarMode, label: "AI Assistent", description: "Chatta med AI" },
]

export function SidebarModeDropdown({ mode, onModeChange }: SidebarModeDropdownProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const currentMode = modes.find(m => m.id === mode) || modes[0]

    const handleModeSelect = (selectedMode: SidebarMode) => {
        onModeChange(selectedMode)
        setIsOpen(false)
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between w-full h-10 px-2 rounded-md hover:bg-sidebar-accent transition-colors">
                    <div className="flex items-center gap-2">
                        <ScopeAILogo className="size-6" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="font-semibold text-sm">Scope AI</span>
                            <span className="text-[10px] text-muted-foreground">{currentMode.label}</span>
                        </div>
                    </div>
                    <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground/50 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-1 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-0.5 px-1">
                    {modes.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => handleModeSelect(m.id)}
                            className={cn(
                                "flex items-center justify-between w-full px-2 py-2 rounded-md text-left transition-colors",
                                "hover:bg-sidebar-accent",
                                mode === m.id && "bg-sidebar-accent/50"
                            )}
                        >
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="text-sm font-medium">{m.label}</span>
                                <span className="text-[10px] text-muted-foreground">{m.description}</span>
                            </div>
                            {mode === m.id && <Check className="h-4 w-4 text-muted-foreground" />}
                        </button>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
