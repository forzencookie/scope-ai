"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { UploadCloud, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { type AiState } from "../shared/constants"
import { useSupplierInvoiceForm, getInitialFormState, type SupplierInvoiceFormState } from "./use-form"
import { SupplierInvoiceForm } from "./form"
import { AiProcessingSection } from "./ai-processing"

interface SupplierInvoiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave?: (data: SupplierInvoiceFormState) => void
    onInvoiceCreated?: () => void
}

export function SupplierInvoiceDialog({
    open,
    onOpenChange,
    onSave,
    onInvoiceCreated
}: SupplierInvoiceDialogProps) {
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual")
    const [aiState, setAiState] = useState<AiState>('idle')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // Process file with AI
    const processWithAI = useCallback(async (file: File) => {
        setAiState('processing')
        setErrorMessage(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'supplier_invoice')

            const response = await fetch('/api/ai/extract', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('AI extraction failed')
            }

            const result = await response.json()
            updateFormFromAI(result)
            setAiState('preview')
        } catch (error) {
            console.error('AI extraction error:', error)
            setErrorMessage('Kunde inte tolka fakturan. Försök igen eller använd manuell inmatning.')
            setAiState('error')
        }
    }, [])

    const {
        formState,
        setFormState,
        updateField,
        updateFormFromAI,
        resetForm,
        isSaving,
        setIsSaving,
        cameraInputProps,
        imagePreview,
        triggerCamera,
        handleFileSelect,
        cameraInputRef,
        clearFile,
        clearFormFile,
    } = useSupplierInvoiceForm({
        onProcessWithAI: processWithAI,
        activeTab
    })

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            resetForm()
            setActiveTab("manual")
            setAiState('idle')
            setErrorMessage(null)
            clearFile()
        }
    }, [open, clearFile, resetForm])

    const handleAcceptAi = async () => {
        if (isSaving) return
        setIsSaving(true)

        try {
            const response = await fetch('/api/supplier-invoices/processed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier: formState.supplier,
                    invoiceNumber: formState.invoiceNumber,
                    ocr: formState.ocr,
                    issueDate: formState.date,
                    dueDate: formState.dueDate,
                    amount: formState.amount,
                    vatAmount: formState.vatAmount,
                    category: formState.category,
                    status: 'mottagen'
                })
            })

            if (!response.ok) throw new Error('Failed to save')

            const result = await response.json()
            toast.success('Faktura sparad', `Faktura från ${result.invoice.supplier} har lagts till`)

            onSave?.({ ...formState, status: "Mottagen" })
            onInvoiceCreated?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Fel', 'Kunde inte spara fakturan')
        } finally {
            setIsSaving(false)
        }
    }

    const handleEditAi = () => {
        setActiveTab("manual")
        setAiState('idle')
    }

    const handleSave = async () => {
        if (isSaving) return
        if (!formState.supplier.trim()) {
            toast.error('Fel', 'Leverantörsnamn krävs')
            return
        }

        setIsSaving(true)

        try {
            const response = await fetch('/api/supplier-invoices/processed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supplier: formState.supplier,
                    invoiceNumber: formState.invoiceNumber,
                    ocr: formState.ocr,
                    issueDate: formState.date,
                    dueDate: formState.dueDate,
                    amount: formState.amount,
                    vatAmount: formState.vatAmount,
                    category: formState.category,
                    status: formState.status.toLowerCase()
                })
            })

            if (!response.ok) throw new Error('Failed to save')

            const result = await response.json()
            toast.success('Faktura sparad', `Faktura från ${result.invoice.supplier} har lagts till`)

            onSave?.(formState)
            onInvoiceCreated?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Save error:', error)
            toast.error('Fel', 'Kunde inte spara fakturan')
        } finally {
            setIsSaving(false)
        }
    }

    const handleRetry = () => formState.file && processWithAI(formState.file)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lägg till leverantörsfaktura</DialogTitle>
                </DialogHeader>

                {/* Hidden camera input */}
                <input {...cameraInputProps} ref={cameraInputRef} />

                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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
                        <SupplierInvoiceForm
                            formState={formState}
                            imagePreview={imagePreview}
                            onFieldChange={updateField}
                            onFilesSelected={handleFileSelect}
                            onRemoveFile={clearFormFile}
                        />
                    </TabsContent>

                    {/* AI Tab */}
                    <TabsContent value="ai" className="space-y-4">
                        <AiProcessingSection
                            aiState={aiState}
                            errorMessage={errorMessage}
                            formState={formState}
                            imagePreview={imagePreview}
                            isSaving={isSaving}
                            onFilesSelected={handleFileSelect}
                            onTriggerCamera={triggerCamera}
                            onRetry={handleRetry}
                            onEdit={handleEditAi}
                            onAccept={handleAcceptAi}
                            onSwitchToManual={() => setActiveTab('manual')}
                        />
                    </TabsContent>
                </Tabs>

                {activeTab === 'manual' && (
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                            Avbryt
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? "Sparar..." : "Spara faktura"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

// Re-export types for convenience
export type { SupplierInvoiceFormState } from "./use-form"
