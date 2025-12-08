"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
    {
        title: "Lönespecifikationer",
        href: "/payroll/payslips",
    },
    {
        title: "AGI",
        href: "/payroll/agi",
    },
    {
        title: "Utdelning",
        href: "/payroll/dividends",
    },
]

export function PayrollNav() {
    const pathname = usePathname()

    return (
        <div className="inline-flex items-center bg-muted/50 rounded-lg p-1 gap-1 w-fit">
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
