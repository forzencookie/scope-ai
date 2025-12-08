"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const deklarationer = [
    {
        title: "Momsdeklaration",
        href: "/reports/vat-declaration",
    },
    {
        title: "Inkomstdeklaration",
        href: "/reports/income-declaration",
    },
]

const statistik = [
    {
        title: "Årsredovisning",
        href: "/reports/annual-report",
    },
    {
        title: "Arbetsgivaravgifter",
        href: "/reports/employer-contributions",
    },
    {
        title: "Företagsstatistik",
        href: "/reports/company-statistics",
    },
]

// Helper to check which category the current path belongs to
const isDeklarationPath = (path: string) =>
    deklarationer.some(item => item.href === path)

const isStatistikPath = (path: string) =>
    statistik.some(item => item.href === path)

export function ReportsNav() {
    const pathname = usePathname()

    // Determine active tab based on current path
    const getInitialTab = () => {
        if (isStatistikPath(pathname)) return "statistik"
        return "deklarationer"
    }

    const [activeTab, setActiveTab] = React.useState(getInitialTab)

    // Update tab when pathname changes
    React.useEffect(() => {
        if (isStatistikPath(pathname)) {
            setActiveTab("statistik")
        } else if (isDeklarationPath(pathname)) {
            setActiveTab("deklarationer")
        }
    }, [pathname])

    const currentItems = activeTab === "deklarationer" ? deklarationer : statistik

    return (
        <div className="flex flex-col gap-3">
            {/* Category Tabs */}
            <div className="inline-flex gap-4 w-fit pl-1">
                <button
                    onClick={() => setActiveTab("deklarationer")}
                    className={cn(
                        "inline-flex items-center justify-center pb-1 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                        activeTab === "deklarationer"
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Deklarationer
                </button>
                <button
                    onClick={() => setActiveTab("statistik")}
                    className={cn(
                        "inline-flex items-center justify-center pb-1 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                        activeTab === "statistik"
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    Statistik
                </button>
            </div>
            {/* Sub-navigation */}
            <div className="inline-flex bg-muted/50 rounded-lg p-1 gap-1 w-fit">
                {currentItems.map((item) => {
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
