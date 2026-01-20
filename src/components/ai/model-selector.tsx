"use client"

import { ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModel } from "@/providers/model-provider"
import { AI_MODELS } from "@/lib/ai-models"
import { cn } from "@/lib/utils"

export function ModelSelector() {
    const { modelId, model, setModelId } = useModel()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                    <span className="max-w-[120px] truncate">{model?.name || 'Model'}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal py-1.5">
                    Model
                </DropdownMenuLabel>
                {AI_MODELS.map((m) => (
                    <DropdownMenuItem
                        key={m.id}
                        onClick={() => setModelId(m.id)}
                        className="flex items-center justify-between cursor-pointer py-1.5"
                    >
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "text-sm",
                                modelId === m.id && "font-medium"
                            )}>
                                {m.name}
                            </span>
                            {m.tier === 'free' && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    New
                                </span>
                            )}
                        </div>
                        {modelId === m.id && <Check className="h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
