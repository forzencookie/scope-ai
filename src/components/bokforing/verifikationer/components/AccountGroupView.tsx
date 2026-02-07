"use client"

import { useMemo, useState } from "react"
import { ChevronDown, CreditCard, Hash, TrendingDown, TrendingUp } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import { basAccounts, type AccountClass } from "@/data/accounts"
import type { Verification } from "../types"

const CLASS_LABELS: Record<AccountClass, string> = {
    1: "Tillgångar",
    2: "Eget kapital & Skulder",
    3: "Intäkter",
    4: "Varor & Material",
    5: "Övriga externa kostnader",
    6: "Övriga externa kostnader forts.",
    7: "Personalkostnader",
    8: "Finansiella poster",
}

interface AccountSummary {
    account: string
    name: string
    group: string
    accountClass: AccountClass
    count: number
    totalDebit: number
    totalCredit: number
    net: number
}

interface AccountGroupViewProps {
    verifications: Verification[]
    onSelectAccount: (account: string) => void
}

export function AccountGroupView({ verifications, onSelectAccount }: AccountGroupViewProps) {
    const [expandedClasses, setExpandedClasses] = useState<Set<number>>(() => {
        // Auto-expand classes that have data
        const classesWithData = new Set<number>()
        verifications.forEach(v => {
            const cls = parseInt(v.konto[0])
            if (cls >= 1 && cls <= 8) classesWithData.add(cls)
        })
        return classesWithData
    })

    // Build account lookup
    const accountMap = useMemo(() => {
        const map = new Map<string, { name: string; group: string; class: AccountClass }>()
        basAccounts.forEach(a => map.set(a.number, { name: a.name, group: a.group, class: a.class }))
        return map
    }, [])

    // Group verifications by account
    const accountSummaries = useMemo(() => {
        const summaryMap = new Map<string, AccountSummary>()

        verifications.forEach(v => {
            const existing = summaryMap.get(v.konto)
            const accountInfo = accountMap.get(v.konto)
            const cls = (accountInfo?.class || parseInt(v.konto[0]) || 1) as AccountClass

            if (existing) {
                existing.count++
                if (v.amount > 0) existing.totalDebit += v.amount
                else existing.totalCredit += Math.abs(v.amount)
                existing.net += v.amount
            } else {
                summaryMap.set(v.konto, {
                    account: v.konto,
                    name: accountInfo?.name || v.kontoName || "Okänt konto",
                    group: accountInfo?.group || "",
                    accountClass: cls,
                    count: 1,
                    totalDebit: v.amount > 0 ? v.amount : 0,
                    totalCredit: v.amount < 0 ? Math.abs(v.amount) : 0,
                    net: v.amount,
                })
            }
        })

        return Array.from(summaryMap.values()).sort((a, b) => a.account.localeCompare(b.account))
    }, [verifications, accountMap])

    // Group summaries by account class
    const groupedByClass = useMemo(() => {
        const groups = new Map<AccountClass, AccountSummary[]>()
        accountSummaries.forEach(s => {
            const existing = groups.get(s.accountClass) || []
            existing.push(s)
            groups.set(s.accountClass, existing)
        })
        return groups
    }, [accountSummaries])

    const toggleClass = (cls: number) => {
        setExpandedClasses(prev => {
            const next = new Set(prev)
            if (next.has(cls)) next.delete(cls)
            else next.add(cls)
            return next
        })
    }

    // All 8 account classes
    const allClasses: AccountClass[] = [1, 2, 3, 4, 5, 6, 7, 8]

    return (
        <div className="space-y-1">
            {allClasses.map(cls => {
                const accounts = groupedByClass.get(cls) || []
                const isExpanded = expandedClasses.has(cls)
                const classTotal = accounts.reduce((sum, a) => sum + a.net, 0)
                const classCount = accounts.reduce((sum, a) => sum + a.count, 0)

                if (accounts.length === 0) return null

                return (
                    <div key={cls} className="rounded-lg border overflow-hidden">
                        {/* Class header */}
                        <button
                            onClick={() => toggleClass(cls)}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                        >
                            <ChevronDown className={cn(
                                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                                isExpanded && "rotate-180"
                            )} />
                            <span className="font-mono text-sm text-muted-foreground w-6">{cls}</span>
                            <span className="font-semibold text-sm flex-1">{CLASS_LABELS[cls]}</span>
                            <span className="text-xs text-muted-foreground mr-2">{classCount} ver.</span>
                            <span className={cn(
                                "tabular-nums text-sm font-medium",
                                classTotal > 0 && "text-green-600 dark:text-green-400",
                                classTotal < 0 && "text-red-600 dark:text-red-400",
                                classTotal === 0 && "text-muted-foreground"
                            )}>
                                {formatCurrency(classTotal)}
                            </span>
                        </button>

                        {/* Account rows */}
                        {isExpanded && (
                            <div className="divide-y divide-border/50">
                                {accounts.map(account => (
                                    <button
                                        key={account.account}
                                        onClick={() => onSelectAccount(account.account)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left group"
                                    >
                                        <div className="w-4" /> {/* Indent spacer */}
                                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="tabular-nums text-sm font-mono text-primary group-hover:underline w-12">
                                            {account.account}
                                        </span>
                                        <span className="text-sm flex-1 truncate">
                                            {account.name}
                                        </span>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Hash className="h-3 w-3" />
                                                {account.count}
                                            </span>
                                            {account.totalDebit > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 tabular-nums">
                                                    <TrendingUp className="h-3 w-3" />
                                                    {formatCurrency(account.totalDebit)}
                                                </span>
                                            )}
                                            {account.totalCredit > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 tabular-nums">
                                                    <TrendingDown className="h-3 w-3" />
                                                    {formatCurrency(account.totalCredit)}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
