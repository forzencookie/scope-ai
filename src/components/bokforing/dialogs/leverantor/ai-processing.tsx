"use client"

import * as React from "react"
import {
    AlertCircle,
    Bot,
    Camera,
    CheckCircle2,
    Pencil,
    Check,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UploadDropzone } from "@/components/ui/upload-dropzone"
import { AiProcessingState } from "@/components/shared"
import { type AiState } from "../shared/constants"
import { type SupplierInvoiceFormState } from "./use-form"

interface AiProcessingSectionProps {
    aiState: AiState
    errorMessage: string | null
    formState: SupplierInvoiceFormState
    imagePreview: string | null
    isSaving: boolean
    onFilesSelected: (files: File[]) => void
    onTriggerCamera: () => void
    onRetry: () => void
    onEdit: () => void
    onAccept: () => void
    onSwitchToManual: () => void
}

export function AiProcessingSection({
    aiState,
    errorMessage,
    formState,
    imagePreview,
    isSaving,
    onFilesSelected,
    onTriggerCamera,
    onRetry,
    onEdit,
    onAccept,
    onSwitchToManual,
}: AiProcessingSectionProps) {
    if (aiState === 'idle') {
        return (
            <div className="space-y-4">
                <UploadDropzone
                    onFilesSelected={onFilesSelected}
                    accept=".pdf,.jpg,.jpeg,.png"
                    title="Ladda upp för AI-skanning"
                    description="AI läser av leverantör, belopp, OCR och datum automatiskt"
                />
                <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={onTriggerCamera} className="gap-2">
                        <Camera className="h-4 w-4" />
                        Ta foto med kamera
                    </Button>
                </div>
            </div>
        )
    }

    if (aiState === 'processing') {
        return (
            <AiProcessingState
                messages={["Analyserar faktura...", "Läser av leverantör...", "Identifierar OCR-nummer...", "Kontrollerar belopp och moms...", "Snart klar..."]}
                subtext="Leverantör, fakturanummer, OCR och belopp"
            />
        )
    }

    if (aiState === 'error') {
        return (
            <div className="space-y-4 py-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-semibold">Tolkning misslyckades</h3>
                        <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={onRetry} className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Försök igen
                    </Button>
                    <Button variant="outline" onClick={onSwitchToManual}>
                        Fyll i manuellt
                    </Button>
                </div>
            </div>
        )
    }

    // Preview state
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <p className="font-medium text-green-900 dark:text-green-100 text-sm">Analys klar! Kontrollera uppgifterna.</p>
            </div>

            <div className="flex gap-4">
                {imagePreview && (
                    <div className="w-24 h-32 rounded-lg overflow-hidden border bg-muted/30 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Invoice" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Leverantör</p>
                        <p className="font-medium">{formState.supplier || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-xs text-muted-foreground">OCR / Fakturanr</p>
                            <p className="font-mono text-sm">{formState.ocr || formState.invoiceNumber || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Totalt belopp</p>
                            <p className="font-semibold">{formState.amount ? `${formState.amount} kr` : '—'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-xs text-muted-foreground">Förfallodatum</p>
                            <p className="text-sm">{formState.dueDate || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Moms</p>
                            <p className="text-sm">{formState.vatAmount ? `${formState.vatAmount} kr` : '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={onEdit} disabled={isSaving}>
                    <Pencil className="h-4 w-4" />
                    Redigera
                </Button>
                <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={onAccept} disabled={isSaving}>
                    <Check className="h-4 w-4" />
                    {isSaving ? "Sparar..." : "Godkänn"}
                </Button>
            </div>
        </div>
    )
}
