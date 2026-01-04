"use client"

import { useMemo } from "react"
import { FileDown, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useVerifications } from "@/hooks/use-verifications"
import { useCompany } from "@/providers/company-provider"
import { generateSRUFiles } from "@/lib/sru-generator"
import { INK2SRUProcessor, type CompanyInfo } from "@/lib/ink2-sru-processor"
import type { SRUPackage, SRUSenderInfo, TaxPeriod } from "@/types/sru"

interface SRUPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SRUPreviewDialog({ open, onOpenChange }: SRUPreviewDialogProps) {
    const { verifications } = useVerifications()
    const { company } = useCompany()

    // Company info for the processor (from context)
    const companyInfo: CompanyInfo = useMemo(() => ({
        orgnr: company?.orgNumber || "556000-0000",
        name: company?.name || "Företag AB",
        fiscalYearStart: new Date(2024, 0, 1),
        fiscalYearEnd: new Date(2024, 11, 31),
    }), [company])

    // Tax period - must match fiscal year end
    const taxPeriod: TaxPeriod = "2024P4"

    // Generate SRU package
    const { sruPackage } = useMemo(() => {
        const declarations = INK2SRUProcessor.generateDeclarations(
            verifications,
            companyInfo,
            taxPeriod
        )

        const sender: SRUSenderInfo = {
            orgnr: company?.orgNumber || "556000-0000",
            name: company?.name || "Företag AB",
            address: company?.address || "",
            postalCode: company?.zipCode || "",
            city: company?.city || "",
            email: company?.email || "",
            phone: company?.phone || "",
        }

        const pkg: SRUPackage = {
            sender,
            declarations,
            generatedAt: new Date(),
            programName: "Scope AI",
        }

        return { sruPackage: pkg }
    }, [verifications, companyInfo, company])

    // Generate SRU files
    const preview = useMemo(() => {
        return generateSRUFiles(sruPackage)
    }, [sruPackage])

    const declaration = sruPackage.declarations[0]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5" />
                        Exportera SRU
                    </DialogTitle>
                    <DialogDescription>
                        Ladda ner SRU-filerna för att skicka till Skatteverket.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Company Info */}
                    <div className="space-y-1">
                        <h3 className="font-semibold">{sruPackage.sender.name}</h3>
                        <p className="text-sm text-muted-foreground">
                            Org.nr: {sruPackage.sender.orgnr}
                        </p>
                        <div className="flex gap-6 text-sm pt-2">
                            <div>
                                <span className="text-muted-foreground">Blankett: </span>
                                <span className="font-medium">INK2-{declaration.period}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Period: </span>
                                <span className="font-medium">2024</span>
                            </div>
                        </div>
                    </div>

                    {/* Download Files */}
                    <div className="space-y-0">
                        <div className="flex items-center justify-between py-3 border-b border-border/40">
                            <span className="text-sm font-medium">INFO.SRU</span>
                            <button
                                onClick={() => {
                                    const blob = new Blob([preview.infoSRU], { type: 'text/plain;charset=iso-8859-1' })
                                    const url = URL.createObjectURL(blob)
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.download = 'INFO.SRU'
                                    link.click()
                                    URL.revokeObjectURL(url)
                                }}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                            >
                                <Download className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <span className="text-sm font-medium">BLANKETTER.SRU</span>
                            <button
                                onClick={() => {
                                    const blob = new Blob([preview.blanketterSRU], { type: 'text/plain;charset=iso-8859-1' })
                                    const url = URL.createObjectURL(blob)
                                    const link = document.createElement('a')
                                    link.href = url
                                    link.download = 'BLANKETTER.SRU'
                                    link.click()
                                    URL.revokeObjectURL(url)
                                }}
                                className="p-2 hover:bg-muted rounded-md transition-colors"
                            >
                                <Download className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Info banner */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Ladda ner filerna och använd{" "}
                                <a
                                    href="https://www.skatteverket.se/foretag/etjansterochblanketter/svaborgtjanster/filoverforing.4.7459477810df5bccdd480007281.html"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline font-medium"
                                >
                                    Skatteverkets filöverföring
                                </a>
                                .
                            </p>
                        </div>
                    </div>


                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Stäng
                    </Button>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
