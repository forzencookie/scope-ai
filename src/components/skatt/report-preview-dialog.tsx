"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileText, Printer, Download } from "lucide-react"

export interface ReportItem {
    id: string
    label: string
    value: number
    highlight?: boolean
}

export interface ReportSection {
    id: string
    title: string
    items: ReportItem[]
}

export interface ReportSummary {
    label: string
    value: number
    subItems?: Array<{ label: string; value: number }>
}

export interface ReportPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    subtitle?: string
    meta: {
        year: string
        yearLabel: string
        companyName: string
        companyId: string
        location: string
    }
    sections: ReportSection[]
    summary?: ReportSummary
    status?: string
}

export function ReportPreviewDialog({
    open,
    onOpenChange,
    title,
    subtitle,
    meta,
    sections,
    summary,
    status = "Utkast"
}: ReportPreviewDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0" expandable defaultExpanded>
                <div className="flex flex-col h-full">
                    {/* Dialog Header - Actions */}
                    <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between">
                        <div className="text-left">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <FileText className="h-5 w-5 text-primary" />
                                {title}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {subtitle || `Förhandsgranskning av ${title}`}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 mr-8">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Printer className="h-4 w-4" />
                                Skriv ut
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Download className="h-4 w-4" />
                                Ladda ner PDF
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Document Scroll Area */}
                    <div className="flex-1 overflow-y-auto bg-muted/20">
                        <div className="p-8 max-w-3xl mx-auto bg-card min-h-full shadow-sm border my-8 relative">
                            {/* Document Header */}
                            <div className="flex justify-between items-start mb-12 border-b pb-8">
                                <div>
                                    <h1 className="text-2xl font-bold uppercase tracking-wide text-foreground/80">{title}</h1>
                                    <p className="text-sm font-medium text-muted-foreground mt-1">{subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold">{meta.year}</div>
                                    <div className="text-xs text-muted-foreground">{meta.yearLabel}</div>
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-8 mb-12 p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Företag</label>
                                    <div className="font-medium mt-1">{meta.companyName}</div>
                                    <div className="text-sm text-muted-foreground">{meta.location}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organisationsnummer</label>
                                    <div className="font-medium mt-1 font-mono">{meta.companyId}</div>
                                </div>
                            </div>

                            {/* Status */}
                            {status && (
                                <div className="absolute top-8 right-8">
                                    <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 bg-transparent uppercase tracking-widest text-[10px]">
                                        {status}
                                    </Badge>
                                </div>
                            )}

                            {/* Report Sections */}
                            <div className="space-y-10">
                                {sections.map((section) => (
                                    <div key={section.id}>
                                        <h3 className="text-sm font-bold uppercase text-muted-foreground mb-4 border-b pb-2 flex justify-between items-end">
                                            {section.title}
                                            <span className="text-[10px] font-normal opacity-70">Belopp i kr</span>
                                        </h3>
                                        <div className="space-y-0">
                                            {section.items.map((item, index) => (
                                                <div
                                                    key={item.id}
                                                    className={cn(
                                                        "grid grid-cols-[60px_1fr_150px] gap-4 py-3 px-2 text-sm hover:bg-muted/50 transition-colors items-center",
                                                        index % 2 === 0 ? "bg-muted/10" : "bg-transparent",
                                                        item.highlight ? "font-semibold bg-primary/5" : ""
                                                    )}
                                                >
                                                    <div className="font-mono text-muted-foreground text-xs">{item.id}</div>
                                                    <div className="text-foreground/90 font-medium">{item.label}</div>
                                                    <div className={cn(
                                                        "text-right font-mono",
                                                        item.value < 0 ? "text-red-600 dark:text-red-400" : ""
                                                    )}>
                                                        {item.value.toLocaleString('sv-SE')}
                                                    </div>
                                                </div>
                                            ))}

                                            {section.items.length === 0 && (
                                                <div className="text-sm text-muted-foreground italic py-2 px-2">Inga poster i denna sektion</div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Summary */}
                                {summary && (
                                    <div className="mt-12 pt-6 border-t-2 border-primary/20 bg-primary/5 rounded-lg p-6">
                                        <div className="grid grid-cols-[1fr_150px] gap-4 items-center">
                                            <div className="font-bold text-lg">{summary.label}</div>
                                            <div className="text-right font-mono text-xl font-bold text-primary">
                                                {summary.value.toLocaleString('sv-SE')} kr
                                            </div>
                                        </div>
                                        {summary.subItems?.map((sub, i) => (
                                            <div key={i} className="grid grid-cols-[1fr_150px] gap-4 items-center mt-2 text-sm text-muted-foreground">
                                                <div>{sub.label}</div>
                                                <div className="text-right font-mono">
                                                    {sub.value.toLocaleString('sv-SE')} kr
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Signatures */}
                            <div className="mt-20 pt-12 border-t border-dashed">
                                <p className="text-xs text-muted-foreground mb-12 uppercase tracking-wider font-semibold">Underskrift</p>
                                <div className="grid grid-cols-2 gap-12">
                                    <div className="border-b border-muted-foreground/30 h-8"></div>
                                    <div className="border-b border-muted-foreground/30 h-8"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-12 mt-2 text-xs text-muted-foreground">
                                    <div>Ort och datum</div>
                                    <div>Namnteckning</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
