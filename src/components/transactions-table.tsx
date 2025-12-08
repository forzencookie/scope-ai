"use client"

import * as React from "react"
import { useState, useCallback } from "react"
import {
    Calendar,
    ArrowRightLeft,
    CreditCard,
    Search,
    SlidersHorizontal,
    Tag,
    User,
    ArrowUpDown,
    Zap,
    Settings,
    Building2,
    Coffee,
    Smartphone,
    Plane,
    Briefcase,
    LucideIcon,
    Sparkles,
    Check,
    X,
    ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { type Transaction, allTransactions } from "@/lib/transaction-data"

const iconMap: Record<string, LucideIcon> = {
    Building2,
    Coffee,
    Smartphone,
    Plane,
    Briefcase,
    Tag,
    User,
}

const statusConfig = {
    "Bokförd": "bg-green-50 text-green-700",
    "Att bokföra": "bg-yellow-50 text-yellow-800",
    "Saknar underlag": "bg-red-50 text-red-700",
    "Ignorerad": "bg-gray-50 text-gray-600",
} as const

// AI suggestions for transactions - simulates AI categorization
type AISuggestion = {
    category: string
    account: string
    confidence: number // 0-100
}

const aiSuggestions: Record<string, AISuggestion> = {
    "1": { category: "IT & Programvara", account: "5420", confidence: 94 },
    "2": { category: "Kontorsmaterial", account: "5410", confidence: 88 },
    "3": { category: "Resor", account: "5800", confidence: 96 },
    "4": { category: "Intäkter", account: "3040", confidence: 99 },
    "5": { category: "Representation", account: "6072", confidence: 72 },
    "6": { category: "Lokalhyra", account: "5010", confidence: 91 },
    "7": { category: "IT & Programvara", account: "5420", confidence: 89 },
}

interface HeaderCellProps {
    icon?: React.ReactNode
    label: string
    className?: string
}

function HeaderCell({ icon, label, className }: HeaderCellProps) {
    return (
        <th className={cn("h-8 px-2 text-left align-middle font-medium text-muted-foreground", className)}>
            {icon ? (
                <div className="flex items-center gap-2">
                    {icon}
                    {label}
                </div>
            ) : (
                <span className="text-[10px] uppercase tracking-wider">{label}</span>
            )}
        </th>
    )
}

// AI Suggestion badge component
function AISuggestionBadge({ 
    suggestion, 
    onApprove, 
    onReject,
    isApproved,
}: { 
    suggestion: AISuggestion
    onApprove: () => void
    onReject: () => void
    isApproved: boolean
}) {
    if (isApproved) {
        return (
            <div className="flex items-center gap-1.5 text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Godkänd</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted">
                <span className="text-xs font-medium text-foreground">{suggestion.category}</span>
                <span className="text-[10px] font-medium text-foreground">
                    {suggestion.confidence}%
                </span>
            </div>
            <div className="flex items-center gap-0.5">
                <button
                    onClick={(e) => { e.stopPropagation(); onApprove(); }}
                    className="h-5 w-5 rounded-full flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 transition-colors"
                    title="Godkänn förslag"
                >
                    <Check className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onReject(); }}
                    className="h-5 w-5 rounded-full flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"
                    title="Avvisa förslag"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}

interface TransactionRowProps {
    transaction: Transaction
    isEmpty?: boolean
    suggestion?: AISuggestion
    onApproveSuggestion?: () => void
    onRejectSuggestion?: () => void
    isApproved?: boolean
    isRejected?: boolean
}

function TransactionRow({ 
    transaction, 
    isEmpty = false, 
    suggestion,
    onApproveSuggestion,
    onRejectSuggestion,
    isApproved = false,
    isRejected = false,
}: TransactionRowProps) {
    const Icon = !isEmpty ? iconMap[transaction.iconName] || Tag : null

    return (
        <tr className="h-[44px] border-b border-border/50 transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted group">
            {!isEmpty ? (
                <>
                    <td className="px-3 py-1.5 align-middle font-medium leading-none whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <div className={cn("h-5 w-5 rounded flex items-center justify-center bg-current/10", transaction.iconColor)}>
                                <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span>{transaction.name}</span>
                        </div>
                    </td>
                    <td className="px-3 py-1.5 align-middle text-muted-foreground leading-none whitespace-nowrap">
                        {transaction.date}
                    </td>
                    <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                        {suggestion && onApproveSuggestion && onRejectSuggestion ? (
                            <AISuggestionBadge
                                suggestion={suggestion}
                                onApprove={onApproveSuggestion}
                                onReject={onRejectSuggestion}
                                isApproved={isApproved}
                            />
                        ) : isRejected ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <X className="h-3.5 w-3.5" />
                                <span className="text-xs font-medium">Inte godkänd</span>
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">–</span>
                        )}
                    </td>
                    <td className="px-3 py-1.5 align-middle font-medium leading-none whitespace-nowrap">
                        <span className={cn(
                            transaction.amount.startsWith("+") ? "text-green-600" : "text-foreground"
                        )}>
                            {transaction.amount}
                        </span>
                    </td>
                    <td className="px-3 py-1.5 align-middle whitespace-nowrap">
                        <span className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                            statusConfig[transaction.status as keyof typeof statusConfig]
                        )}>
                            {transaction.status}
                        </span>
                    </td>
                    <td className="px-3 py-1.5 align-middle text-muted-foreground leading-none whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded flex items-center justify-center bg-current/10">
                                <User className="h-3.5 w-3.5" />
                            </div>
                            {transaction.account}
                        </div>
                    </td>
                    <td className="px-3 py-1.5 align-middle leading-none">
                        <Checkbox className="translate-y-[2px] opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity" />
                    </td>
                </>
            ) : (
                <>
                    <td className="px-3 py-1.5 align-middle leading-none">&nbsp;</td>
                    <td className="px-3 py-1.5 align-middle leading-none">&nbsp;</td>
                    <td className="px-3 py-1.5 align-middle leading-none">&nbsp;</td>
                    <td className="px-3 py-1.5 align-middle leading-none">&nbsp;</td>
                    <td className="px-3 py-1.5 align-middle leading-none">&nbsp;</td>
                    <td className="px-3 py-1.5 align-middle leading-none">&nbsp;</td>
                    <td className="px-3 py-1.5 align-middle leading-none">
                        <Checkbox className="translate-y-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </td>
                </>
            )}
        </tr>
    )
}

export function TransactionsTable({ 
    title = "Alla transaktioner",
    subtitle,
    transactions = allTransactions 
}: { 
    title?: string
    subtitle?: string
    transactions?: Transaction[]
}) {
    const [approvedSuggestions, setApprovedSuggestions] = useState<Set<string>>(new Set())
    const [rejectedSuggestions, setRejectedSuggestions] = useState<Set<string>>(new Set())

    const handleApprove = useCallback((transactionId: string) => {
        setApprovedSuggestions(prev => new Set([...prev, transactionId]))
        setRejectedSuggestions(prev => {
            const next = new Set(prev)
            next.delete(transactionId)
            return next
        })
    }, [])

    const handleReject = useCallback((transactionId: string) => {
        setRejectedSuggestions(prev => new Set([...prev, transactionId]))
        setApprovedSuggestions(prev => {
            const next = new Set(prev)
            next.delete(transactionId)
            return next
        })
    }, [])

    // Count pending suggestions
    const pendingSuggestions = transactions.filter(
        t => aiSuggestions[t.id] && !approvedSuggestions.has(t.id) && !rejectedSuggestions.has(t.id)
    ).length

    return (
        <div className="w-full space-y-4">
            {/* Table Toolbar */}
            <div className="flex items-center justify-between pb-2">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                            <ArrowRightLeft className="h-4 w-4 text-primary" />
                        </div>
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-sm text-muted-foreground mt-1 ml-8">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <InputGroup className="w-64">
                        <InputGroupAddon>
                            <InputGroupText>
                                <Search />
                            </InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput placeholder="Search..." />
                    </InputGroup>
                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowUpDown className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Zap className="h-4 w-4" />
                    </button>
                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        <Settings className="h-4 w-4" />
                    </button>
                    <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                        Ny
                    </button>
                </div>
            </div>

            {/* AI Suggestions Banner */}
            {pendingSuggestions > 0 && (
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="font-medium">
                            AI har {pendingSuggestions} kategoriseringsförslag
                        </p>
                        <p className="text-sm text-muted-foreground underline decoration-1 underline-offset-4">
                            Granska och godkänn för snabbare bokföring
                        </p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-100 dark:text-sky-400 dark:hover:text-sky-300 dark:hover:bg-sky-900/30"
                        onClick={() => {
                            transactions.forEach(t => {
                                const suggestion = aiSuggestions[t.id]
                                if (suggestion && suggestion.confidence >= 90 && !approvedSuggestions.has(t.id)) {
                                    handleApprove(t.id)
                                }
                            })
                        }}
                    >
                        <Zap className="h-4 w-4 mr-1" />
                        Godkänn alla med hög säkerhet
                    </Button>
                </div>
            )}

            {/* Notion-style Table */}
            <div className="w-full">
                <div className="w-full overflow-x-auto scrollbar-thin border-t border-b border-border/40">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b border-border/50 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <HeaderCell label="Name" />
                                <HeaderCell icon={<Calendar className="h-3.5 w-3.5" />} label="Date" />
                                <HeaderCell 
                                    icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} 
                                    label="AI-kategorisering" 
                                    className="text-primary"
                                />
                                <HeaderCell icon={<span className="text-xs font-serif italic">123</span>} label="Amount" />
                                <HeaderCell 
                                    icon={
                                        <div className="h-3.5 w-3.5 rounded-full border border-current flex items-center justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                        </div>
                                    } 
                                    label="Status" 
                                />
                                <HeaderCell icon={<CreditCard className="h-3.5 w-3.5" />} label="Account" />
                                <HeaderCell label="Aa" />
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {transactions.map((transaction) => {
                                const suggestion = aiSuggestions[transaction.id]
                                const isRejected = rejectedSuggestions.has(transaction.id)
                                return (
                                    <TransactionRow 
                                        key={transaction.id} 
                                        transaction={transaction}
                                        suggestion={!isRejected ? suggestion : undefined}
                                        onApproveSuggestion={() => handleApprove(transaction.id)}
                                        onRejectSuggestion={() => handleReject(transaction.id)}
                                        isApproved={approvedSuggestions.has(transaction.id)}
                                        isRejected={isRejected}
                                    />
                                )
                            })}
                            {Array.from({ length: 3 }).map((_, i) => (
                                <TransactionRow key={`empty-${i}`} isEmpty transaction={{} as Transaction} />
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Table Footer / Add Row */}
                <div className="border-t border-border/40 p-2 text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-2">
                    <div className="h-4 w-4 flex items-center justify-center ml-4">
                        <span className="text-lg leading-none">+</span>
                    </div>
                    New
                </div>
            </div>
        </div>
    )
}
