import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowRight, Download } from "lucide-react"
import { AGIReport } from "../use-employer-declaration"
import { useToast } from "@/components/ui/toast"
import { generateAgiXML } from "@/lib/generators/agi-generator"
import { useCompany } from "@/providers/company-provider"

interface AgiGridProps {
    reports: AGIReport[]
    selectedIds: Set<string>
    onToggleSelection: (id: string) => void
    onToggleAll: () => void
}

export function AgiGrid({ reports, selectedIds, onToggleSelection, onToggleAll }: AgiGridProps) {
    const { company } = useCompany()
    const toast = useToast()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(amount)
    }

    const handleDownload = (report: AGIReport) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reportWithData = report as any
        const xml = generateAgiXML({
            period: report.period,
            orgNumber: company?.orgNumber || "556000-0000",
            totalSalary: report.totalSalary,
            tax: report.tax,
            contributions: report.contributions,
            employees: report.employees,
            individualData: reportWithData.individualData,
        })

        const blob = new Blob([xml], { type: "text/xml" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `agi-${report.period.replace(/\s+/g, '-').toLowerCase()}.xml`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.success("AGI fil nerladdad", `AGI fil för ${report.period} sparades`)
    }

    return (
        <div className="rounded-md border bg-card">
            <div className="w-full overflow-x-auto">
                <div className="md:min-w-[1000px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">
                                    <Checkbox
                                        checked={reports.length > 0 && selectedIds.size === reports.length}
                                        onCheckedChange={onToggleAll}
                                    />
                                </TableHead>
                                <TableHead>Period</TableHead>
                                <TableHead>Förfallodatum</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Bruttolön</TableHead>
                                <TableHead className="text-right">Skatt</TableHead>
                                <TableHead className="text-right">Arbetsgivaravgift</TableHead>
                                <TableHead className="text-right">Att betala</TableHead>
                                <TableHead className="text-right">Åtgärder</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center">
                                        Inga rapporter hittades.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report) => (
                                    <TableRow key={report.period}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedIds.has(report.period)}
                                                onCheckedChange={() => onToggleSelection(report.period)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{report.period}</TableCell>
                                        <TableCell>{report.dueDate}</TableCell>
                                        <TableCell>
                                            <Badge variant={report.status === "submitted" ? "secondary" : "default"}>
                                                {report.status === "submitted" ? "Inlämnad" : "Ej inlämnad"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(report.totalSalary)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(report.tax)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(report.contributions)}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(report.tax + report.contributions)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownload(report)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
