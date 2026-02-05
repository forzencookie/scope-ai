import { useState, useEffect } from "react"
import { Calendar, TrendingUp, Percent, Calculator, FileDown, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GridTableHeader, GridTableRows, GridTableRow } from "@/components/ui/grid-table"
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge"
import { useToast } from "@/components/ui/toast"
import { formatNumber, cn } from "@/lib/utils"
import { downloadSRUPackage } from "@/lib/generators/sru-generator"
import { useCompany } from "@/providers/company-provider"
import type { SRUPackage, SRUDeclaration, SRUField } from "@/types/sru"
import type { K10Data } from "../use-k10-calculation"

interface K10Report {
    id: string
    tax_year: number
    data: K10Data
    status: string
    created_at: string
}

interface GridTableCellProps {
    children: React.ReactNode
    span?: number
    align?: "left" | "right" | "center"
    className?: string
    hiddenOnMobile?: boolean
}

function GridTableCell({ children, span = 1, align = "left", className, hiddenOnMobile }: GridTableCellProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 min-w-0",
                align === "right" && "justify-end",
                align === "center" && "justify-center",
                hiddenOnMobile && "hidden md:flex",
                className
            )}
            style={{ gridColumn: `span ${span}` }}
        >
            {children}
        </div>
    )
}

export function K10History() {
    const toast = useToast()
    const { company } = useCompany()
    const [reports, setReports] = useState<K10Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [exportingId, setExportingId] = useState<string | null>(null)

    // Fetch K10 reports
    useEffect(() => {
        async function fetchReports() {
            try {
                const response = await fetch('/api/reports/k10')
                if (response.ok) {
                    const data = await response.json()
                    setReports(data.reports || [])
                }
            } catch (err) {
                console.error("Failed to fetch K10 reports:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchReports()
    }, [])

    const handleExportSRU = async (report: K10Report) => {
        setExportingId(report.id)
        toast.info("Exporterar SRU", "Förbereder K10 SRU-filer...")

        try {
            const k10Data = report.data

            // Build K10 SRU fields based on saved data
            const fields: SRUField[] = [
                { code: 100, value: k10Data.aktiekapital },              // Aktiekapital
                { code: 200, value: k10Data.omkostnadsbelopp },          // Omkostnadsbelopp
                { code: 300, value: k10Data.agarandel },                 // Ägarandel %
                { code: 400, value: k10Data.schablonbelopp },            // Schablonbelopp
                { code: 500, value: k10Data.lonebaseratUtrymme },        // Lönebaserat utrymme
                { code: 600, value: k10Data.gransbelopp },               // Gränsbelopp
                { code: 700, value: k10Data.totalDividends },            // Utdelning
                { code: 800, value: k10Data.remainingUtrymme },          // Sparat utrymme
            ]

            const declaration: SRUDeclaration = {
                blankettType: 'K10',
                period: `${report.tax_year}P4`,
                orgnr: company?.orgNumber || '556000-0000',
                name: company?.name || 'Företag AB',
                fields,
            }

            const pkg: SRUPackage = {
                sender: {
                    orgnr: company?.orgNumber || '556000-0000',
                    name: company?.name || 'Företag AB',
                    email: company?.email || '',
                },
                declarations: [declaration],
                generatedAt: new Date(),
                programName: 'Scope AI',
            }

            await downloadSRUPackage(pkg)
            toast.success("Klart", `K10 SRU-filer för ${report.tax_year} har laddats ner.`)
        } catch {
            toast.error("Fel", "Kunde inte skapa SRU-filer.")
        } finally {
            setExportingId(null)
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'submitted': return 'Inlämnad'
            case 'approved': return 'Godkänd'
            case 'draft': return 'Utkast'
            default: return 'Utkast'
        }
    }

    const getStatusVariant = (status: string): StatusVariant => {
        switch (status) {
            case 'submitted': return 'success'
            case 'approved': return 'success'
            case 'draft': return 'neutral'
            default: return 'neutral'
        }
    }

    const hasHistory = reports.length > 0

    return (
        <div className="pt-6 border-t-2 border-border/60">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">K10-historik</h3>
            </div>

            <GridTableHeader
                columns={[
                    { label: "År", icon: Calendar, span: 2 },
                    { label: "Gränsbelopp", icon: TrendingUp, align: "right", span: 3, hiddenOnMobile: true },
                    { label: "Utnyttjat", icon: Percent, align: "right", span: 3, hiddenOnMobile: true },
                    { label: "Sparat", icon: Calculator, align: "right", span: 2 },
                    { label: "Status", align: "center", span: 2 },
                ]}
            />

            {isLoading ? (
                <div className="text-center py-12 mt-6">
                    <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Laddar K10-historik...</p>
                </div>
            ) : hasHistory ? (
                <GridTableRows>
                    {reports.map((report) => (
                        <GridTableRow key={report.id} className="group">
                            <GridTableCell span={2}>
                                <span className="font-medium">{report.tax_year}</span>
                            </GridTableCell>
                            <GridTableCell span={3} align="right" hiddenOnMobile>
                                {formatNumber(report.data.gransbelopp)} kr
                            </GridTableCell>
                            <GridTableCell span={3} align="right" hiddenOnMobile>
                                {formatNumber(report.data.totalDividends)} kr
                            </GridTableCell>
                            <GridTableCell span={2} align="right">
                                {formatNumber(report.data.remainingUtrymme)} kr
                            </GridTableCell>
                            <GridTableCell span={2} align="center" className="flex items-center justify-center gap-2">
                                <StatusBadge
                                    status={getStatusLabel(report.status)}
                                    variant={getStatusVariant(report.status)}
                                    size="sm"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleExportSRU(report)}
                                    disabled={exportingId === report.id}
                                    title="Exportera SRU"
                                >
                                    {exportingId === report.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <FileDown className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </GridTableCell>
                        </GridTableRow>
                    ))}
                </GridTableRows>
            ) : (
                <div className="text-center py-12 mt-6 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Ingen K10-historik än.</p>
                    <p className="text-xs mt-1">Skapa din första K10-blankett genom att klicka på &quot;Skapa blankett&quot; ovan.</p>
                </div>
            )}
        </div>
    )
}
