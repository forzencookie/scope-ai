import { useState, useMemo, useEffect, useCallback } from "react"
import { useCompany } from "@/providers/company-provider"
import { useVerifications } from "@/hooks/use-verifications"
import { VatProcessor, type VatReport } from "@/services/processors/vat-processor"
import { useBulkSelection } from "@/components/shared/bulk-action-toolbar"
import { useToast } from "@/components/ui/toast"
import { BulkAction } from "@/components/shared/bulk-action-toolbar"
import { Trash2, Download } from "lucide-react"

export function useVatReport() {
    const { company } = useCompany()
    const { verifications } = useVerifications()
    const toast = useToast()

    // Data State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [periods, setPeriods] = useState<any[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [savedReports, setSavedReports] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // UI State
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedReport, setSelectedReport] = useState<VatReport | null>(null)
    const [showAIDialog, setShowAIDialog] = useState(false)
    const [vatPeriods, setVatPeriods] = useState<VatReport[]>([])

    // 1. Fetch data
    const fetchData = useCallback(async () => {
        setIsLoading(true)
        try {
            const [pRes, rRes] = await Promise.all([
                fetch('/api/financial-periods'),
                fetch('/api/reports/vat')
            ])
            const pData = await pRes.json()
            const rData = await rRes.json()
            setPeriods(pData.periods || [])
            setSavedReports(rData.reports || [])
        } catch (err) {
            console.error("Failed to fetch reports data:", err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // 2. Calculate reports
    const vatPeriodsState = useMemo(() => {
        if (isLoading && periods.length === 0) return []

        return periods.map(p => {
            // Find if there's a saved report for this period
            const saved = savedReports.find(r => r.period_id === p.id)

            if (saved && saved.status === 'submitted') {
                // If submitted, use the saved data (immutability for accounting)
                const report = saved.data as VatReport
                report.status = 'submitted'
                return report
            }

            // Otherwise, calculate LIVE draft from verifications
            const report = VatProcessor.calculateReportFromRealVerifications(verifications, p.name)

            // Set properties from DB record
            report.status = p.status === 'submitted' ? 'submitted' : 'upcoming'
            // We use the ID from the period as a key
            return { ...report, periodId: p.id }
        })
    }, [verifications, periods, savedReports, isLoading])

    // Sync state
    useEffect(() => {
        setVatPeriods(vatPeriodsState)
    }, [vatPeriodsState])


    // 3. Calculate stats
    const stats = useMemo(() => {
        // Find upcoming period
        const upcomingReport = vatPeriodsState.find(p => p.status === 'upcoming') || vatPeriodsState[0]

        if (upcomingReport) {
            return {
                nextPeriod: upcomingReport.period,
                deadline: `Deadline: ${upcomingReport.dueDate || "Datum saknas"}`,
                salesVat: upcomingReport.salesVat,
                inputVat: upcomingReport.inputVat,
                netVat: upcomingReport.netVat,
                fullReport: upcomingReport
            }
        }

        return {
            nextPeriod: "Ingen period",
            deadline: "",
            salesVat: 0,
            inputVat: 0,
            netVat: 0,
            fullReport: undefined
        }
    }, [vatPeriodsState])

    // 4. Filtering
    const filteredPeriods = useMemo(() => {
        return vatPeriods.filter(period => {
            const matchesSearch = !searchQuery ||
                period.period.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = !statusFilter || period.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [searchQuery, statusFilter, vatPeriods])

    // 5. Selection
    const periodsWithId = useMemo(() =>
        filteredPeriods.map(p => ({ ...p, id: p.period })),
        [filteredPeriods]
    )
    const selection = useBulkSelection(periodsWithId)

    // 6. Actions
    const handleDownloadXML = useCallback((reports: VatReport[]) => {
        reports.forEach(report => {
            const xml = VatProcessor.generateXML(report, company?.orgNumber || "556000-0000")
            const blob = new Blob([xml], { type: "text/xml" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `momsdeklaration-${report.period.replace(' ', '-')}.xml`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        })
    }, [company?.orgNumber])

    const bulkActions: BulkAction[] = useMemo(() => [
        {
            id: "delete",
            label: "Ta bort",
            icon: Trash2,
            variant: "destructive",
            onClick: (ids) => {
                setVatPeriods(prev => prev.filter(p => !ids.includes(p.period)))
                toast.success("Rapporter borttagna", `${ids.length} momsrapport(er) har tagits bort`)
                selection.clearSelection()
            },
        },
        {
            id: "download",
            label: "Ladda ner XML",
            icon: Download,
            onClick: (ids) => {
                const reports = vatPeriods.filter(p => ids.includes(p.period))
                handleDownloadXML(reports)
                toast.success("Nerladdat", `${ids.length} fil(er) har laddats ner.`)
                selection.clearSelection()
            },
        },
    ], [vatPeriods, selection, toast, handleDownloadXML])

    const handleUpdateReport = useCallback((updatedReport: VatReport) => {
        setVatPeriods(prev => prev.map(p =>
            p.period === updatedReport.period ? updatedReport : p
        ))
        toast.success("Rapport uppdaterad", `Momsdeklaration för ${updatedReport.period} har sparats`)
        setSelectedReport(null)
    }, [toast])

    const refreshData = fetchData

    return {
        // State
        vatPeriods,
        stats,
        searchQuery, setSearchQuery,
        statusFilter, setStatusFilter,
        selectedReport, setSelectedReport,
        showAIDialog, setShowAIDialog,
        isLoading,
        
        // Data
        filteredPeriods,
        
        // Selection
        selection,
        bulkActions,
        
        // Actions
        refreshData,
        handleUpdateReport,
        handleDownloadXML
    }
}
