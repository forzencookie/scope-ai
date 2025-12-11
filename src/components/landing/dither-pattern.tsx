import { cn } from "@/lib/utils"

interface DitherPatternProps {
  className?: string
  opacity?: number
}

export function DitherPattern({ className, opacity = 0.1 }: DitherPatternProps) {
  return (
    <div 
      className={cn("absolute pointer-events-none bg-dither-pattern", className)}
      style={{ opacity }}
    />
  )
}
