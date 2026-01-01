"use client"

import { useMemo } from "react"
import { useAccountBalances, type AccountActivity } from "@/hooks/use-account-balances"
import { Table2Row } from "./report-table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function BalanceSheetView() {
    const { activeAccounts, isLoading } = useAccountBalances()

    // Group accounts by class for the report structure
    const groupedAccounts = useMemo(() => {
        const groups: Record<number, { classId: number; className: string; accounts: AccountActivity[] }> = {}
        const classes = [1, 2, 3, 4, 5, 6, 7, 8] as const

        // Define labels for classes
        const classLabels: Record<number, string> = {
            1: "TILLGÅNGAR",
            2: "EGET KAPITAL & SKULDER",
            3: "RÖRELSEINTÄKTER",
            4: "MATERIAL & VAROR",
            5: "ÖVRIGA EXTERNA KOSTNADER",
            6: "ÖVRIGA KOSTNADER",
            7: "PERSONALKOSTNADER",
            8: "FINANSIELLA POSTER"
        }

        classes.forEach(c => {
            // Filter accounts that belong to this class
            // AccountActivity has account object which has class property
            const classAccounts = activeAccounts.filter(a => a.account?.class === c)

            if (classAccounts.length > 0) {
                groups[c] = {
                    classId: c,
                    className: classLabels[c],
                    accounts: classAccounts
                }
            }
        })

        return groups
    }, [activeAccounts])

    // Sort sections
    const sortedSections = Object.values(groupedAccounts).sort((a, b) => a.classId - b.classId)

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    if (sortedSections.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Inga bokförda transaktioner än.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {sortedSections.map((section) => (
                <div key={section.classId} className="space-y-1">
                    <h3 className="uppercase tracking-wide text-xs font-semibold text-muted-foreground pb-2 border-b border-border/60 mb-3">
                        {section.classId}xxx {section.className}
                    </h3>

                    <div className="space-y-0.5">
                        {section.accounts.map(activity => (
                            <Table2Row
                                key={activity.accountNumber}
                                item={{
                                    id: activity.accountNumber,
                                    label: activity.account?.name || "Okänt konto",
                                    value: activity.balance,
                                }}
                            >
                                {/* Transactions List */}
                                {activity.transactions && activity.transactions.length > 0 ? (
                                    <div className="space-y-1">
                                        {activity.transactions.map((tx, idx) => (
                                            <div key={tx.id || idx} className="flex items-center justify-between text-xs py-1.5 hover:bg-muted/50 px-2 rounded cursor-default border-b border-border/40 last:border-0">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-muted-foreground w-20 shrink-0 font-mono text-[11px]">{tx.date}</span>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-foreground/90">{tx.description}</span>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "tabular-nums font-medium",
                                                    (tx.amount || 0) > 0 ? "text-green-600 dark:text-green-400" : "text-foreground"
                                                )}>
                                                    {Math.abs(tx.amount || 0).toLocaleString('sv-SE')} kr
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground py-2 italic px-2">Inga transaktioner denna period</p>
                                )}
                            </Table2Row>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
