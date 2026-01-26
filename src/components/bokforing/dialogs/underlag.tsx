"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Calendar,
    UploadCloud,
    FileText,
    CheckCircle2,
    X,
    Building2,
    Banknote,
    Tag,
    Pencil,
    Check,
    AlertCircle,
    Bot,
    Camera,
    RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { UploadDropzone, FilePreview } from "@/components/ui/upload-dropzone"
import { RECEIPT_STATUSES, type ReceiptStatus } from "@/lib/status-types"
import { AiProcessingState } from "@/components/shared"
import { type Receipt } from "@/data/receipts"
import { FormField, FormFieldRow } from "@/components/ui/form-field"
import { useFileCapture } from "@/hooks/use-file-capture"
import { useAiExtraction } from "@/hooks/use-ai-extraction"

// Category options for select
const CATEGORY_OPTIONS = [
    { value: "Övriga kostnader", label: "Övriga kostnader" },
    { value: "Kontorsmaterial", label: "Kontorsmaterial" },
    { value: "Programvara", label: "Programvara" },
    { value: "Resekostnader", label: "Resekostnader" },
    { value: "Representation", label: "Representation" },
    { value: "IT-utrustning", label: "IT-utrustning" },
]

// Extended receipt type for form handling
interface UnderlagFormState {
    supplier: string
    date: string
    amount: string
    moms: string
    category: string
    status: ReceiptStatus
    file: File | null
    fileName?: string
}

interface UnderlagDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "create" | "edit" | "view"
    receipt?: Receipt
    onSave?: (data: UnderlagFormState) => void | Promise<void>
}

const initialFormState: UnderlagFormState = {
    supplier: "",
    date: new Date().toISOString().split('T')[0],
    amount: "",
    moms: "",
    category: "Övriga kostnader",
    status: RECEIPT_STATUSES.PENDING,
    file: null
}

export function UnderlagDialog({
    open,
    onOpenChange,
    mode = "create",
    receipt,
    onSave
}: UnderlagDialogProps) {
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual")
    const [isSaving, setIsSaving] = useState(false)

    // Use AI extraction hook for processing receipts
    const {
        aiState,
        errorMessage,
        formState,
        setFormState,
        processWithAI,
        reset: resetAiState,
        retry: retryAi,
        switchToManual
    } = useAiExtraction<UnderlagFormState>({
        apiEndpoint: '/api/ai/extract-receipt',
        initialState: initialFormState,
        transformResponse: (data) => {
            const { supplier, date, amount, moms, category } = data
            return {
                supplier: supplier?.value || supplier || '',
                date: date?.value || date || new Date().toISOString().split('T')[0],
                amount: `${amount?.value || amount} kr` || '',
                moms: moms ? `${moms?.value || moms} kr` : '',
                category: category?.value || category || 'Övriga kostnader',
                status: RECEIPT_STATUSES.REVIEW_NEEDED
            }
        }
    })

    // Use shared file capture hook
    const fileCapture = useFileCapture({
        onFileSelected: async (file) => {
            setFormState(prev => ({ ...prev, file }))
            if (activeTab === 'ai') {
                await processWithAI(file)
            }
        }
    })

    // Reset or populate form when dialog opens
    useEffect(() => {
        if (open) {
            if (receipt && mode !== "create") {
                setFormState({
                    supplier: receipt.supplier,
                    date: receipt.date,
                    amount: receipt.amount,
                    moms: "",
                    category: receipt.category,
                    status: receipt.status as ReceiptStatus,
                    file: null,
                    fileName: receipt.attachment
                })
            } else {
                resetAiState()
                fileCapture.clearFile()
            }
            setActiveTab("manual")
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, receipt, mode])

    const handleAcceptAi = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            await onSave?.({ ...formState, status: RECEIPT_STATUSES.VERIFIED })
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    const handleEditAi = () => {
        setActiveTab("manual")
        switchToManual()
    }

    const handleSave = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            await onSave?.({ ...formState, status: RECEIPT_STATUSES.VERIFIED })
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    const handleRetry = () => retryAi()

    const updateField = (field: keyof UnderlagFormState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }))
    }

    const isViewMode = mode === "view"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create" ? "Lägg till underlag" :
                            mode === "edit" ? "Redigera underlag" : "Underlag"}
                    </DialogTitle>
                </DialogHeader>

                {/* Hidden camera input */}
                <input {...fileCapture.cameraInputProps} ref={fileCapture.cameraInputRef} />

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                    {!isViewMode && (
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="manual" className="gap-2">
                                <UploadCloud className="h-4 w-4" />
                                Manuell
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="gap-2">
                                <Bot className="h-4 w-4" />
                                Skanna med AI
                            </TabsTrigger>
                        </TabsList>
                    )}

                    {/* Manual Tab */}
                    <TabsContent value="manual" className="space-y-4">
                        {!formState.file && !formState.fileName ? (
                            <UploadDropzone
                                onFilesSelected={fileCapture.handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png"
                                title="Ladda upp underlag"
                                description="Valfritt - bifoga kvitto eller faktura"
                            />
                        ) : (
                            <div className="space-y-2">
                                {fileCapture.imagePreview && (
                                    <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={fileCapture.imagePreview}
                                            alt="Receipt preview"
                                            className="w-full max-h-32 object-contain"
                                        />
                                    </div>
                                )}
                                {formState.file && (
                                    <FilePreview
                                        file={formState.file}
                                        onRemove={() => {
                                            setFormState(prev => ({ ...prev, file: null, fileName: undefined }))
                                            fileCapture.clearFile()
                                        }}
                                    />
                                )}
                                {!formState.file && formState.fileName && (
                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm truncate">{formState.fileName}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setFormState(prev => ({ ...prev, fileName: undefined }))}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {/* Form Fields - Now using FormField component */}
                                <div className="grid gap-4 pt-2">
                                    <FormField
                                        type="text"
                                        label="Leverantör"
                                        icon={Building2}
                                        value={formState.supplier}
                                        onChange={(v) => updateField('supplier', v)}
                                        placeholder="T.ex. Adobe Systems"
                                        disabled={isViewMode}
                                    />

                                    <FormFieldRow>
                                        <FormField
                                            type="date"
                                            label="Datum"
                                            icon={Calendar}
                                            value={formState.date}
                                            onChange={(v) => updateField('date', v)}
                                            disabled={isViewMode}
                                        />
                                        <FormField
                                            type="text"
                                            label="Belopp (inkl. moms)"
                                            icon={Banknote}
                                            value={formState.amount}
                                            onChange={(v) => updateField('amount', v)}
                                            placeholder="0 kr"
                                            disabled={isViewMode}
                                        />
                                    </FormFieldRow>

                                    <FormField
                                        type="text"
                                        label="Varav moms"
                                        icon={Banknote}
                                        value={formState.moms}
                                        onChange={(v) => updateField('moms', v)}
                                        placeholder="0 kr"
                                        disabled={isViewMode}
                                    />

                                    <FormField
                                        type="select"
                                        label="Kategori"
                                        icon={Tag}
                                        value={formState.category}
                                        onChange={(v) => updateField('category', v)}
                                        options={CATEGORY_OPTIONS}
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* AI Tab */}
                    <TabsContent value="ai" className="space-y-4">
                        {aiState === 'idle' && (
                            <div className="space-y-4">
                                <UploadDropzone
                                    onFilesSelected={fileCapture.handleFileSelect}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    title="Ladda upp för AI-skanning"
                                    description="AI läser av all information automatiskt"
                                />
                                <div className="flex justify-center">
                                    <Button variant="outline" size="sm" onClick={fileCapture.triggerCamera} className="gap-2">
                                        <Camera className="h-4 w-4" />
                                        Ta foto med kamera
                                    </Button>
                                </div>
                            </div>
                        )}

                        {aiState === 'processing' && (
                            <AiProcessingState
                                messages={["Analyserar kvittot...", "Läser av text...", "Identifierar belopp...", "Snart klar..."]}
                                subtext="Leverantör, belopp, datum och moms"
                            />
                        )}

                        {aiState === 'error' && (
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
                                    <Button variant="outline" onClick={handleRetry} className="gap-2">
                                        <RefreshCw className="h-4 w-4" />
                                        Försök igen
                                    </Button>
                                    <Button variant="outline" onClick={() => setActiveTab('manual')}>
                                        Fyll i manuellt
                                    </Button>
                                </div>
                            </div>
                        )}

                        {aiState === 'preview' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/30">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <p className="font-medium text-green-900 dark:text-green-100 text-sm">Analys klar!</p>
                                </div>

                                {errorMessage && (
                                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-xs text-amber-800 dark:text-amber-200">
                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                        {errorMessage}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    {fileCapture.imagePreview && (
                                        <div className="w-24 h-32 rounded-lg overflow-hidden border bg-muted/30 shrink-0">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={fileCapture.imagePreview} alt="Receipt" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Leverantör</p>
                                            <p className="font-medium">{formState.supplier || '—'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Belopp (inkl. moms)</p>
                                                <p className="font-semibold text-lg">{formState.amount || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Varav moms</p>
                                                <p className="font-medium">{formState.moms || '—'}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Datum</p>
                                                <p className="text-sm">{formState.date || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Kategori</p>
                                                <p className="text-sm">{formState.category || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button variant="outline" className="flex-1 gap-2" onClick={handleEditAi} disabled={isSaving}>
                                        <Pencil className="h-4 w-4" />
                                        Redigera
                                    </Button>
                                    <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={handleAcceptAi} disabled={isSaving}>
                                        <Check className="h-4 w-4" />
                                        {isSaving ? "Sparar..." : "Godkänn"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {(activeTab === 'manual' || isViewMode) && (
                    <DialogFooter className="mt-4">
                        {!isViewMode ? (
                            <>
                                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                                    Avbryt
                                </Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Sparar..." : "Spara underlag"}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={() => onOpenChange(false)}>
                                Stäng
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
