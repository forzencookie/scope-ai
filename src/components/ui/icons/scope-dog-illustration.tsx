import { cn } from "@/lib/utils"

export function ScopeDogIllustration({ className }: { className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src="/scopedog.svg"
            alt="Scope Dog Illustration"
            className={cn("w-full h-full object-contain", className)}
        />
    )
}
