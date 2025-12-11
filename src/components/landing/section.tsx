import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("px-6 py-24 md:py-32 max-w-[1400px] mx-auto", className)}>
      {children}
    </section>
  )
}
