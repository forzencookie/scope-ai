"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BookOpen, FileText, Receipt, Calendar } from "lucide-react"

const navItems = [
    {
        title: "Kalender",
        href: "/daily-journal",
        icon: Calendar,
    },
    {
        title: "Transaktioner",
        href: "/transactions",
        icon: BookOpen,
    },
    {
        title: "Underlag",
        href: "/bookkeeping",
        icon: FileText,
    },
    {
        title: "Fakturor",
        href: "/invoices",
        icon: Receipt,
    },
]

export function BookkeepingNav() {
    const pathname = usePathname()

    return (
        <div className="inline-flex flex-col bg-muted/50 rounded-lg p-1 gap-1 w-fit">
            <div className="flex gap-1">
                {navItems.slice(0, 4).map((item) => {
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
