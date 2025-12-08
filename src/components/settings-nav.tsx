"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, Users, Puzzle } from "lucide-react"

const navItems = [
    {
        title: "Företags information",
        href: "/settings/company-info",
        icon: Building2,
    },
    {
        title: "Team och anställda",
        href: "/settings/team",
        icon: Users,
    },
    {
        title: "Integrationer",
        href: "/settings/integrations",
        icon: Puzzle,
    },
]

export function SettingsNav() {
    const pathname = usePathname()

    return (
        <div className="inline-flex flex-col bg-muted/50 rounded-lg p-1 gap-1 w-fit">
            <div className="flex gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "inline-flex items-center justify-start rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                                isActive
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {item.title}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
