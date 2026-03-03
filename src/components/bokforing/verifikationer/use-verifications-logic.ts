import { useState, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useVerifications } from "@/hooks/use-verifications"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { useToast } from "@/components/ui/toast"
import { type AccountClass } from "@/data/accounts"
import { Verification } from "./types"

export function useVerificationsLogic() {
    const toast = useToast()
    const { verifications: rawVerifications, isLoading } = useVerifications()
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

    // Map real verifications to the UI Verification type
    const verifikationer = useMemo(() => {
        if (!rawVerifications || rawVerifications.length === 0) return []

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rawVerifications.map((v: any) => {
            const entries = v.rows || v.lines || []
            const totalDebit = entries.reduce((sum: number, e: { debit?: number }) => sum + (e.debit || 0), 0)

            // Primary account is the first debit entry's account
            const primaryEntry = entries.find((e: { debit?: number }) => (e.debit || 0) > 0) || entries[0]
            const konto = primaryEntry?.account || primaryEntry?.account_number?.toString() || '1930'

            const series = v.series || 'A'
            const number = v.number || 0

            return {
                id: v.id,
                verificationNumber: `${series}${number}`,
                date: v.date || '',
                description: v.description || '',
                amount: totalDebit,
                konto,
                kontoName: primaryEntry?.account_name || primaryEntry?.description || '',
                hasTransaction: !!v.source_id,
                hasUnderlag: true,
                entries: entries.map((e: { account?: string; account_number?: number; debit?: number; credit?: number; description?: string }) => ({
                    account: e.account || e.account_number?.toString() || '',
                    debit: e.debit || 0,
                    credit: e.credit || 0,
                    description: e.description,
                })),
            } as Verification
        })
    }, [rawVerifications])

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
        isLoading
    }
}
