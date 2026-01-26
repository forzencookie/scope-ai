"use client"

import { useState, useCallback } from "react"
import { useFileCapture } from "@/hooks/use-file-capture"
import { type SupplierInvoiceStatus } from "@/lib/status-types"
import { type AiState } from "../shared/constants"

export interface SupplierInvoiceFormState {
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

export const getInitialFormState = (): SupplierInvoiceFormState => ({
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
})

interface UseSupplierInvoiceFormOptions {
    onProcessWithAI: (file: File) => Promise<void>
    activeTab: "manual" | "ai"
}

export function useSupplierInvoiceForm({ onProcessWithAI, activeTab }: UseSupplierInvoiceFormOptions) {
    const [formState, setFormState] = useState<SupplierInvoiceFormState>(getInitialFormState)
    const [isSaving, setIsSaving] = useState(false)

    const updateField = useCallback((field: keyof SupplierInvoiceFormState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }))
    }, [])

    const updateFormFromAI = useCallback((result: Partial<SupplierInvoiceFormState>) => {
        setFormState(prev => ({
            ...prev,
            supplier: result.supplier || prev.supplier,
            invoiceNumber: result.invoiceNumber || prev.invoiceNumber,
            ocr: result.ocr || prev.ocr,
            amount: result.amount?.toString() || prev.amount,
            vatAmount: result.vatAmount?.toString() || prev.vatAmount,
            dueDate: result.dueDate || prev.dueDate,
            category: result.category || prev.category,
            status: "Mottagen"
        }))
    }, [])

    const resetForm = useCallback(() => {
        setFormState(getInitialFormState())
    }, [])

    // Use shared file capture hook
    const {
        cameraInputProps,
        imagePreview,
        triggerCamera,
        handleFileSelect: baseHandleFileSelect,
        cameraInputRef,
        clearFile
    } = useFileCapture({
        onFileSelected: async (file) => {
            setFormState(prev => ({ ...prev, file }))
            if (activeTab === 'ai') {
                await onProcessWithAI(file)
            }
        }
    })

    const handleFileSelect = useCallback((files: File[]) => {
        baseHandleFileSelect(files)
    }, [baseHandleFileSelect])

    const clearFormFile = useCallback(() => {
        setFormState(prev => ({ ...prev, file: null, fileName: undefined }))
        clearFile()
    }, [clearFile])

    return {
        formState,
        setFormState,
        updateField,
        updateFormFromAI,
        resetForm,
        isSaving,
        setIsSaving,
        // File capture
        cameraInputProps,
        imagePreview,
        triggerCamera,
        handleFileSelect,
        cameraInputRef,
        clearFile,
        clearFormFile,
    }
}
