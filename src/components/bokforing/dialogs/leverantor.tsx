"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
    Calendar,
    UploadCloud,
    FileText,
    CheckCircle2,
    Building2,
    Banknote,
    Tag,
    Pencil,
    Check,
    AlertCircle,
    Bot,
    Camera,
    RefreshCw,
    Hash,
    CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { UploadDropzone, FilePreview } from "@/components/ui/upload-dropzone"
import { AiProcessingState } from "@/components/shared"
import { type SupplierInvoiceStatus } from "@/lib/status-types"
import { FormField, FormFieldRow } from "@/components/ui/form-field"
import { useFileCapture } from "@/hooks/use-file-capture"

// Category options
const CATEGORY_OPTIONS = [
    { value: "Övriga kostnader", label: "Övriga kostnader" },
    { value: "Kontorsmaterial", label: "Kontorsmaterial" },
    { value: "Programvara", label: "Programvara" },
    { value: "Konsulttjänster", label: "Konsulttjänster" },
    { value: "Hyra", label: "Hyra" },
    { value: "Inköp material", label: "Inköp material" },
]

// Contract type options
const CONTRACT_TYPE_OPTIONS = [
    { value: "tillsvidare", label: "Tillsvidare" },
    { value: "visstid", label: "Visstid" },
    { value: "engangs", label: "Projekt / Engångs" },
]

// Notice period options
const NOTICE_PERIOD_OPTIONS = [
    { value: "0", label: "Ingen" },
    { value: "1", label: "1 månad" },
    { value: "3", label: "3 månader" },
    { value: "6", label: "6 månader" },
    { value: "12", label: "12 månader" },
]

type AiState = 'idle' | 'processing' | 'preview' | 'error'

interface SupplierInvoiceFormState {
    supplier: string
    invoiceNumber: string
    ocr: string
    date: string
    dueDate: string
    amount: string
    vatAmount: string
    category: string
    status: SupplierInvoiceStatus
    file: File | null
    fileName?: string
}

interface SupplierInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave?: (data: SupplierInvoiceFormState) => void
}

const initialFormState: SupplierInvoiceFormState = {
    supplier: "",
    invoiceNumber: "",
    ocr: "",
    date: new Date().toISOString().split('T')[0],
    dueDate: "",
    amount: "",
    vatAmount: "",
    category: "Övriga kostnader",
    status: "Mottagen",
    file: null
}

export function SupplierInvoiceDialog({
    open,
    onOpenChange,
    onSave
}: SupplierInvoiceDialogProps) {
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual")
    const [aiState, setAiState] = useState<AiState>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [formState, setFormState] = useState<SupplierInvoiceFormState>(initialFormState)

    // Process file with AI
    const processWithAI = async (file: File) => {
        setAiState('processing')
        setErrorMessage(null)

        try {
            // Artificial delay to show processing state (mock)
            await new Promise(resolve => setTimeout(resolve, 3000))

            setFormState(prev => ({
                ...prev,
                supplier: "Leverantör AB",
                invoiceNumber: "INV-" + Math.floor(Math.random() * 10000),
                ocr: Math.floor(Math.random() * 1000000000).toString(),
                amount: "12500",
                vatAmount: "2500",
                category: "Konsulttjänster",
                status: "Mottagen"
            }))
            setAiState('preview')
        } catch (error) {
            console.error('AI extraction error:', error)
            setErrorMessage('Kunde inte tolka fakturan. Försök igen eller använd manuell inmatning.')
            setAiState('error')
        }
    }

    // Use shared file capture hook
    const fileCapture = useFileCapture({
        onFileSelected: async (file) => {
            setFormState(prev => ({ ...prev, file }))
            if (activeTab === 'ai') {
                await processWithAI(file)
            }
        }
    })

    // Calculate due date based on invoice date (default 30 days)
    useEffect(() => {
        if (formState.date && !formState.dueDate) {
            const date = new Date(formState.date)
            date.setDate(date.getDate() + 30)
            setFormState(prev => ({ ...prev, dueDate: date.toISOString().split('T')[0] }))
        }
    }, [formState.date])

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setFormState(initialFormState)
            setActiveTab("manual")
            setAiState('idle')
            setErrorMessage(null)
            fileCapture.clearFile()
        }
    }, [open])

    const updateField = (field: keyof SupplierInvoiceFormState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }))
    }

    const handleAcceptAi = () => {
        onSave?.({ ...formState, status: "Mottagen" })
        onOpenChange(false)
    }

    const handleEditAi = () => {
        setActiveTab("manual")
        setAiState('idle')
    }

    const handleSave = () => {
        onSave?.(formState)
        onOpenChange(false)
    }

    const handleRetry = () => formState.file && processWithAI(formState.file)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lägg till leverantörsfaktura</DialogTitle>
                </DialogHeader>

                {/* Hidden camera input */}
                <input {...fileCapture.cameraInputProps} ref={fileCapture.cameraInputRef} />

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
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

                    {/* Manual Tab */}
                    <TabsContent value="manual" className="space-y-4">
                        {!formState.file && !formState.fileName ? (
                            <UploadDropzone
                                onFilesSelected={fileCapture.handleFileSelect}
                                accept=".pdf,.jpg,.jpeg,.png"
                                title="Ladda upp faktura"
                                description="Bifoga PDF eller bild på fakturan"
                            />
                        ) : (
                            <div className="space-y-2">
                                {fileCapture.imagePreview && (
                                    <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                                        <img
                                            src={fileCapture.imagePreview}
                                            alt="Preview"
                                            className="w-full max-h-32 object-contain"
                                        />
                                    </div>
                                )}
                                <FilePreview
                                    file={formState.file}
                                    fileName={formState.fileName}
                                    onRemove={() => {
                                        setFormState(prev => ({ ...prev, file: null, fileName: undefined }))
                                        fileCapture.clearFile()
                                    }}
                                />
                            </div>
                        )}

                        {/* Form Fields */}
                        <div className="grid gap-4">
                            <FormField
                                type="text"
                                label="Leverantör"
                                icon={Building2}
                                value={formState.supplier}
                                onChange={(v) => updateField('supplier', v)}
                                placeholder="T.ex. Leverantör AB"
                            />

                            <FormFieldRow>
                                <FormField
                                    type="text"
                                    label="Fakturanummer"
                                    icon={Hash}
                                    value={formState.invoiceNumber}
                                    onChange={(v) => updateField('invoiceNumber', v)}
                                />
                                <FormField
                                    type="text"
                                    label="OCR-nummer"
                                    icon={CreditCard}
                                    value={formState.ocr}
                                    onChange={(v) => updateField('ocr', v)}
                                />
                            </FormFieldRow>

                            <FormFieldRow>
                                <FormField
                                    type="date"
                                    label="Fakturadatum"
                                    icon={Calendar}
                                    value={formState.date}
                                    onChange={(v) => updateField('date', v)}
                                />
                                <FormField
                                    type="date"
                                    label="Förfallodatum"
                                    icon={Calendar}
                                    value={formState.dueDate}
                                    onChange={(v) => updateField('dueDate', v)}
                                />
                            </FormFieldRow>

                            <FormFieldRow>
                                <FormField
                                    type="text"
                                    label="Totalbelopp"
                                    icon={Banknote}
                                    value={formState.amount}
                                    onChange={(v) => updateField('amount', v)}
                                    placeholder="0 kr"
                                />
                                <FormField
                                    type="text"
                                    label="Momsbelopp"
                                    icon={Banknote}
                                    value={formState.vatAmount}
                                    onChange={(v) => updateField('vatAmount', v)}
                                    placeholder="0 kr"
                                />
                            </FormFieldRow>

                            <FormField
                                type="select"
                                label="Kategori"
                                icon={Tag}
                                value={formState.category}
                                onChange={(v) => updateField('category', v)}
                                options={CATEGORY_OPTIONS}
                            />

                            {/* Contract section */}
                            <div className="pt-4 border-t">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Avtal &amp; Abonnemang</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Koppla denna faktura till ett avtal för bättre koll på uppsägningstider.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
                                        <FormFieldRow>
                                            <FormField
                                                type="select"
                                                label="Typ av avtal"
                                                value="tillsvidare"
                                                onChange={() => { }}
                                                options={CONTRACT_TYPE_OPTIONS}
                                            />
                                            <FormField
                                                type="select"
                                                label="Uppsägningstid"
                                                value="3"
                                                onChange={() => { }}
                                                options={NOTICE_PERIOD_OPTIONS}
                                            />
                                        </FormFieldRow>

                                        <div className="grid gap-2">
                                            <Label className="text-xs text-muted-foreground">Avtalsdokument (PDF)</Label>
                                            <Button variant="outline" size="sm" className="h-8 gap-2 w-full justify-start text-muted-foreground font-normal">
                                                <UploadCloud className="h-3.5 w-3.5" />
                                                Ladda upp avtal...
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* AI Tab */}
                    <TabsContent value="ai" className="space-y-4">
                        {aiState === 'idle' && (
                            <div className="space-y-4">
                                <UploadDropzone
                                    onFilesSelected={fileCapture.handleFileSelect}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    title="Ladda upp för AI-skanning"
                                    description="AI läser av leverantör, belopp, OCR och datum automatiskt"
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
                                messages={["Analyserar faktura...", "Läser av leverantör...", "Identifierar OCR-nummer...", "Kontrollerar belopp och moms...", "Snart klar..."]}
                                subtext="Leverantör, fakturanummer, OCR och belopp"
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
                                    <p className="font-medium text-green-900 dark:text-green-100 text-sm">Analys klar! Kontrollera uppgifterna.</p>
                                </div>

                                <div className="flex gap-4">
                                    {fileCapture.imagePreview && (
                                        <div className="w-24 h-32 rounded-lg overflow-hidden border bg-muted/30 shrink-0">
                                            <img src={fileCapture.imagePreview} alt="Invoice" className="w-full h-full object-cover" />
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
                                    <Button variant="outline" className="flex-1 gap-2" onClick={handleEditAi}>
                                        <Pencil className="h-4 w-4" />
                                        Redigera
                                    </Button>
                                    <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={handleAcceptAi}>
                                        <Check className="h-4 w-4" />
                                        Godkänn
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {activeTab === 'manual' && (
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Avbryt
                        </Button>
                        <Button onClick={handleSave}>
                            Spara faktura
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
