import { cn } from "@/lib/utils"

export function ScopeAILogo({ className }: { className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/scopeai.svg"
            alt="Scope AI"
            className={cn("w-auto h-auto", className)}
        />
    )
}
