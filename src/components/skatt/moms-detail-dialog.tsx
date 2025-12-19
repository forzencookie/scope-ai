"use client"

/**
 * Momsdeklaration Detail Dialog
 * 
 * Complete VAT declaration dialog with:
 * - Edit tab: All rutor (fields) editable, organized by section
 * - Preview tab: Official SKV 4700 document layout
 * - Download XML button
 * - Send button (placeholder for future API)
 */

import { useState, useEffect } from "react"
import {
    Calendar,
    Send,
    Download,
    Edit,
    Eye,
    FileText,
    Info,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { VatReport, recalculateVatReport } from "@/lib/vat-processor"
import { downloadVatXML, defaultCompanyInfo } from "@/lib/vat-xml-export"
import { MomsPreview } from "./moms-preview"

interface MomsDetailDialogProps {
    report: VatReport | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave?: (report: VatReport) => void
}

// Field definition for rendering
interface FieldDef {
    code: string
    key: keyof VatReport
    label: string
    tooltip?: string
}

// Section definitions
const SECTION_A: FieldDef[] = [
    { code: "05", key: "ruta05", label: "Momspliktig försäljning 25%", tooltip: "Försäljning exkl. moms med 25% momssats" },
    { code: "06", key: "ruta06", label: "Momspliktig försäljning 12%", tooltip: "Försäljning exkl. moms med 12% momssats (hotell, livsmedel)" },
    { code: "07", key: "ruta07", label: "Momspliktig försäljning 6%", tooltip: "Försäljning exkl. moms med 6% momssats (böcker, kultur)" },
    { code: "08", key: "ruta08", label: "Hyresinkomster vid frivillig skattskyldighet", tooltip: "Uthyrning av lokaler där du valt att bli momspliktig" },
]

const SECTION_B: FieldDef[] = [
    { code: "10", key: "ruta10", label: "Utgående moms 25%", tooltip: "25% moms på din försäljning" },
    { code: "11", key: "ruta11", label: "Utgående moms 12%", tooltip: "12% moms på din försäljning" },
    { code: "12", key: "ruta12", label: "Utgående moms 6%", tooltip: "6% moms på din försäljning" },
]

const SECTION_C: FieldDef[] = [
    { code: "20", key: "ruta20", label: "Inköp av varor från annat EU-land", tooltip: "EU-inköp av varor (omvänd skattskyldighet)" },
    { code: "21", key: "ruta21", label: "Inköp av tjänster från annat EU-land", tooltip: "EU-inköp av tjänster (omvänd skattskyldighet)" },
    { code: "22", key: "ruta22", label: "Inköp av tjänster utanför EU", tooltip: "Inköp från länder utanför EU (omvänd skattskyldighet)" },
    { code: "23", key: "ruta23", label: "Inköp av varor i Sverige", tooltip: "Svenska inköp där köparen är skattskyldig" },
    { code: "24", key: "ruta24", label: "Övriga inköp av tjänster", tooltip: "Andra omvända tjänsteinköp" },
]

const SECTION_D: FieldDef[] = [
    { code: "30", key: "ruta30", label: "Utgående moms 25%", tooltip: "25% moms på omvänd skattskyldighet" },
    { code: "31", key: "ruta31", label: "Utgående moms 12%", tooltip: "12% moms på omvänd skattskyldighet" },
    { code: "32", key: "ruta32", label: "Utgående moms 6%", tooltip: "6% moms på omvänd skattskyldighet" },
]

const SECTION_E: FieldDef[] = [
    { code: "35", key: "ruta35", label: "Försäljning till annat EU-land", tooltip: "Varuförsäljning till andra EU-länder (0% moms)" },
    { code: "36", key: "ruta36", label: "Försäljning utanför EU", tooltip: "Export utanför EU" },
    { code: "37", key: "ruta37", label: "Mellanmans inköp vid trepartshandel", tooltip: "Som mellanman vid trepartshandel" },
    { code: "38", key: "ruta38", label: "Mellanmans försäljning vid trepartshandel", tooltip: "Försäljning som mellanman" },
    { code: "39", key: "ruta39", label: "Försäljning av tjänster till EU", tooltip: "Tjänsteförsäljning till EU (huvudregeln)" },
    { code: "40", key: "ruta40", label: "Övrig försäljning utanför Sverige", tooltip: "Andra tjänster utanför Sverige" },
    { code: "41", key: "ruta41", label: "Försäljning där köparen är skattskyldig", tooltip: "Köparen betalar momsen (reverse charge)" },
    { code: "42", key: "ruta42", label: "Övrig momsfri försäljning", tooltip: "Annan momsfri omsättning" },
]

const SECTION_F: FieldDef[] = [
    { code: "48", key: "ruta48", label: "Ingående moms att dra av", tooltip: "Total ingående moms du får dra av" },
]

const SECTION_H: FieldDef[] = [
    { code: "50", key: "ruta50", label: "Beskattningsunderlag vid import", tooltip: "Värde på importerade varor" },
    { code: "60", key: "ruta60", label: "Utgående moms på import 25%", tooltip: "25% importmoms" },
    { code: "61", key: "ruta61", label: "Utgående moms på import 12%", tooltip: "12% importmoms" },
    { code: "62", key: "ruta62", label: "Utgående moms på import 6%", tooltip: "6% importmoms" },
]

// Editable field row component
function EditableField({
    field,
    value,
    onChange,
    disabled = false,
}: {
    field: FieldDef
    value: number
    onChange: (value: number) => void
    disabled?: boolean
}) {
    return (
        <div className="grid grid-cols-[3rem_1fr_8rem] gap-3 items-center py-2 border-b last:border-0">
            <div className="font-mono font-bold text-muted-foreground bg-muted/50 rounded px-2 py-1 text-center text-sm border">
                {field.code}
            </div>
            <div className="text-sm">
                <div className="font-medium">{field.label}</div>
                {field.tooltip && (
                    <div className="text-xs text-muted-foreground">{field.tooltip}</div>
                )}
            </div>
            <Input
                type="number"
                className="text-right h-9 font-mono"
                value={value || ""}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                disabled={disabled}
                placeholder="0"
            />
        </div>
    )
}

// Collapsible section component
function Section({
    title,
    subtitle,
    fields,
    report,
    onChange,
    defaultOpen = true,
}: {
    title: string
    subtitle?: string
    fields: FieldDef[]
    report: VatReport
    onChange: (key: keyof VatReport, value: number) => void
    defaultOpen?: boolean
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const hasValues = fields.some(f => (report[f.key] as number) > 0)

    return (
        <div className="border rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-left",
                    "bg-muted/30 hover:bg-muted/50 transition-colors",
                    hasValues && "bg-primary/5"
                )}
            >
                <div>
                    <div className="font-semibold text-sm">{title}</div>
                    {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
                </div>
                <div className="flex items-center gap-2">
                    {hasValues && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Ifylld
                        </span>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
            </button>
            {isOpen && (
                <div className="p-4 space-y-1">
                    {fields.map(field => (
                        <EditableField
                            key={field.code}
                            field={field}
                            value={report[field.key] as number}
                            onChange={(value) => onChange(field.key, value)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export function MomsDetailDialog({
    report,
    open,
    onOpenChange,
    onSave,
}: MomsDetailDialogProps) {
    const [editedReport, setEditedReport] = useState<VatReport | null>(null)
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
    const [isExpanded, setIsExpanded] = useState(false)

    // Sync editedReport with report prop
    useEffect(() => {
        if (report) {
            setEditedReport({ ...report })
        }
    }, [report])

    if (!report || !editedReport) return null

    const handleFieldChange = (key: keyof VatReport, value: number) => {
        const updated = { ...editedReport, [key]: value }
        // Recalculate derived fields
        setEditedReport(recalculateVatReport(updated))
    }

    const handleSave = () => {
        if (editedReport && onSave) {
            onSave(editedReport)
        }
        onOpenChange(false)
    }

    const handleDownloadXML = () => {
        downloadVatXML(editedReport, defaultCompanyInfo)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                expandable
                onExpandedChange={setIsExpanded}
                className="max-w-4xl"
            >
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pr-16 bg-yellow-50/50 dark:bg-yellow-950/10 -mx-6 -mt-6 p-6 border-b border-yellow-100 dark:border-yellow-900/30">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-yellow-400 text-black flex items-center justify-center font-bold text-lg rounded shadow-sm">
                            SKV
                        </div>
                        <div>
                            <DialogTitle className="text-xl">
                                Momsdeklaration
                            </DialogTitle>
                            <DialogDescription className="text-yellow-700 dark:text-yellow-500">
                                {editedReport.period} • Deadline: {editedReport.dueDate}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                            <div className="text-xs text-muted-foreground">Att betala</div>
                            <div className={cn(
                                "text-lg font-bold font-mono",
                                editedReport.ruta49 >= 0 ? "text-amber-600" : "text-green-600"
                            )}>
                                {editedReport.ruta49 >= 0 ? "+" : ""}{formatCurrency(editedReport.ruta49)}
                            </div>
                        </div>
                        <AppStatusBadge
                            status={editedReport.status === "upcoming" ? "Kommande" : "Inskickad"}
                        />
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="edit" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Redigera
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="gap-2">
                            <Eye className="h-4 w-4" />
                            Förhandsgranska
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="edit"
                        className={cn(
                            "space-y-4 overflow-y-auto",
                            isExpanded ? "max-h-[calc(90vh-280px)]" : "max-h-[50vh]"
                        )}
                    >
                        <Section
                            title="A. Momspliktig försäljning"
                            subtitle="Försäljning och uttag exklusive moms"
                            fields={SECTION_A}
                            report={editedReport}
                            onChange={handleFieldChange}
                        />

                        <Section
                            title="B. Utgående moms på försäljning"
                            subtitle="Moms som du tar ut av dina kunder"
                            fields={SECTION_B}
                            report={editedReport}
                            onChange={handleFieldChange}
                        />

                        <Section
                            title="C. Momspliktiga inköp vid omvänd skattskyldighet"
                            subtitle="EU-handel och import där du redovisar momsen"
                            fields={SECTION_C}
                            report={editedReport}
                            onChange={handleFieldChange}
                            defaultOpen={false}
                        />

                        <Section
                            title="D. Utgående moms på inköp (C)"
                            subtitle="Moms på inköp med omvänd skattskyldighet"
                            fields={SECTION_D}
                            report={editedReport}
                            onChange={handleFieldChange}
                            defaultOpen={false}
                        />

                        <Section
                            title="E. Försäljning undantagen från moms"
                            subtitle="Export, EU-handel och momsfri omsättning"
                            fields={SECTION_E}
                            report={editedReport}
                            onChange={handleFieldChange}
                            defaultOpen={false}
                        />

                        <Section
                            title="F. Ingående moms"
                            subtitle="Moms du betalat på inköp som du får dra av"
                            fields={SECTION_F}
                            report={editedReport}
                            onChange={handleFieldChange}
                        />

                        <Section
                            title="H. Import"
                            subtitle="Beskattningsunderlag och moms vid import"
                            fields={SECTION_H}
                            report={editedReport}
                            onChange={handleFieldChange}
                            defaultOpen={false}
                        />

                        {/* Result summary */}
                        <div className="border-2 border-primary/30 rounded-lg p-4 bg-primary/5">
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">G. Moms att betala eller få tillbaka</div>
                                    <div className="text-sm text-muted-foreground">
                                        Ruta 49 = Utgående moms - Ingående moms
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold font-mono">
                                        {formatCurrency(Math.abs(editedReport.ruta49))}
                                    </div>
                                    <div className={cn(
                                        "text-sm font-medium",
                                        editedReport.ruta49 >= 0 ? "text-amber-600" : "text-green-600"
                                    )}>
                                        {editedReport.ruta49 >= 0 ? "Att betala" : "Att få tillbaka"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded border border-blue-100 dark:border-blue-900/30">
                            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <p>
                                Alla fält beräknas automatiskt från din bokföring men kan redigeras manuellt.
                                Klicka på "Förhandsgranska" för att se hur deklarationen ser ut i officiellt format.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="preview"
                        className={cn(
                            "overflow-y-auto flex justify-center",
                            isExpanded ? "max-h-[calc(90vh-280px)]" : "max-h-[50vh]"
                        )}
                    >
                        <MomsPreview report={editedReport} />
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleDownloadXML} className="gap-2">
                            <Download className="h-4 w-4" />
                            Ladda ner XML
                        </Button>
                        <Button variant="outline" onClick={handleSave} className="gap-2">
                            <FileText className="h-4 w-4" />
                            Spara
                        </Button>
                    </div>

                    {editedReport.status === "upcoming" && (
                        <Button className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600">
                            <Send className="h-4 w-4" />
                            Skicka till Skatteverket
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
