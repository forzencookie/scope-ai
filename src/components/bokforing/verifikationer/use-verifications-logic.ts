import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTransactions } from "@/hooks/use-transactions"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { useToast } from "@/components/ui/toast"
import { basAccounts, type AccountClass } from "@/data/accounts"
import { TRANSACTION_STATUS_LABELS } from "@/lib/localization"
import { Verification } from "./types"

export function useVerificationsLogic() {
    const toast = useToast()
    const { transactions, isLoading } = useTransactions()
    const searchParams = useSearchParams()
    const router = useRouter()
    const accountParam = searchParams.get("account")

    const [classFilter, setClassFilter] = useState<AccountClass | "all">("all")
    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedVerifikation, setSelectedVerifikation] = useState<Verification | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Helper to update filter via URL
    const setAccountFilter = useCallback((account: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (account) {
            params.set("account", account)
        } else {
            params.delete("account")
        }
        router.push(`/dashboard/bokforing?${params.toString()}`, { scroll: false })
    }, [searchParams, router])

    // Derive verifications from actual booked transactions
    const verifikationer = useMemo(() => {
        if (!transactions) return []

        const bookedTransactions = transactions.filter(t =>
            t.status === TRANSACTION_STATUS_LABELS.RECORDED
        )

         // Optimization: Create a lookup map for accounts to avoid O(N) search per row
        const accountMap = new Map<string, any>();
        basAccounts.forEach(a => accountMap.set(a.number, a));

        return bookedTransactions.map(t => {
            const accountInfo = accountMap.get(t.account) || accountMap.get(t.category);

            return {
                id: t.id,
                date: t.date,
                description: t.name,
                amount: t.amountValue,
                konto: t.account || "1930",
                kontoName: accountInfo?.name || t.category || "Okänt konto",
                hasTransaction: true,
                hasUnderlag: true,
                status: t.status
            } as Verification
        })
    }, [transactions])

    // Filter verifikationer by search query and class filter
    const filteredVerifikationer = useMemo(() => {
        let result = [...verifikationer]

        if (accountParam) {
            result = result.filter(v => v.konto === accountParam)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(v =>
                v.description.toLowerCase().includes(query) ||
                v.konto.includes(query) ||
                v.kontoName.toLowerCase().includes(query) ||
                String(v.id).includes(query)
            )
        }

        if (classFilter !== "all" && !accountParam) {
            const classPrefix = String(classFilter)
            result = result.filter(v => v.konto.startsWith(classPrefix))
        }

        return result
    }, [searchQuery, classFilter, verifikationer, accountParam])

    // Calculate stats for stat cards
    const stats = useMemo(() => {
        const withTransaction = verifikationer.filter(v => v.hasTransaction).length
        const withUnderlag = verifikationer.filter(v => v.hasUnderlag).length
        const missingUnderlag = verifikationer.filter(v => !v.hasUnderlag).length
        const totalAmount = verifikationer.reduce((sum, v) => sum + Math.abs(v.amount), 0)

        return {
            total: verifikationer.length,
            withTransaction,
            withUnderlag,
            missingUnderlag,
            totalAmount
        }
    }, [verifikationer])

    const handleViewDetails = useCallback((v: Verification) => {
        setSelectedVerifikation(v)
        setDetailsDialogOpen(true)
    }, [])

    const verifikationerWithId = useMemo(() =>
        filteredVerifikationer.map(v => ({ ...v, id: String(v.id) })),
        [filteredVerifikationer]
    )

    const selection = useBulkSelection(verifikationerWithId)

    const handleBulkAction = useCallback((action: string) => {
        toast.info(`${action} startad`, `Bearbetar ${selection.selectedCount} verifikationer...`)
    }, [selection.selectedCount, toast])

    return {
        // State
        searchQuery, setSearchQuery,
        classFilter, setClassFilter,
        filterDropdownOpen, setFilterDropdownOpen,
        createDialogOpen, setCreateDialogOpen,
        detailsDialogOpen, setDetailsDialogOpen,
        selectedVerifikation, setSelectedVerifikation,
        accountParam,
        
        // Actions
        setAccountFilter,
        handleViewDetails,
        handleBulkAction,

        // Data
        verifikationer,
        filteredVerifikationer,
        stats,
        selection,
        transactions, // raw transactions if needed
        isLoading
    }
}
