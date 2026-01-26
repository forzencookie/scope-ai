"use client"

import { useState, useCallback, useEffect } from "react"
import type { BookableEntity, BookingData, BookingStep } from "./booking-types"
import type { AISuggestion } from "@/types"

export interface UseBookingDialogLogicProps {
    entity: BookableEntity | null
    aiSuggestion?: AISuggestion | null
    onBook: (booking: BookingData) => Promise<void>
    onOpenChange: (open: boolean) => void
    open: boolean
}

export interface UseBookingDialogLogicReturn {
    // Step management
    step: BookingStep
    setStep: (step: BookingStep) => void
    
    // File upload
    uploadedFile: File | null
    setUploadedFile: (file: File | null) => void
    uploadPreview: string | null
    setUploadPreview: (preview: string | null) => void
    
    // Booking fields
    category: string
    setCategory: (category: string) => void
    debitAccount: string
    setDebitAccount: (account: string) => void
    creditAccount: string
    setCreditAccount: (account: string) => void
    description: string
    setDescription: (desc: string) => void
    
    // State
    isLoading: boolean
    bookingMode: 'ai' | 'manual'
    hasAiSuggestion: boolean
    
    // Actions
    handleOpenChange: (open: boolean) => void
    handleBook: () => Promise<void>
    handleFileUpload: (files: File[]) => void
    clearFile: () => void
}

export function useBookingDialogLogic({
    entity,
    aiSuggestion,
    onBook,
    onOpenChange,
    open,
}: UseBookingDialogLogicProps): UseBookingDialogLogicReturn {
    const [step, setStep] = useState<BookingStep>('details')
    const [isLoading, setIsLoading] = useState(false)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadPreview, setUploadPreview] = useState<string | null>(null)

    // Booking fields - initialized from AI suggestion if available
    const [category, setCategory] = useState(aiSuggestion?.category || '')
    const [debitAccount, setDebitAccount] = useState(aiSuggestion?.account || '6990')
    const [creditAccount, setCreditAccount] = useState('1930')
    const [description, setDescription] = useState('')

    const bookingMode = aiSuggestion ? 'ai' : 'manual'
    const hasAiSuggestion = !!aiSuggestion && aiSuggestion.confidence > 0

    // Sync values when aiSuggestion changes or dialog opens
    useEffect(() => {
        if (open && aiSuggestion) {
            setCategory(aiSuggestion.category || '')
            setDebitAccount(aiSuggestion.account || '6990')
            setCreditAccount('1930')
        }
    }, [open, aiSuggestion])

    // Reset state when dialog opens/closes
    const handleOpenChange = useCallback((newOpen: boolean) => {
        if (!newOpen) {
            setStep('details')
            setUploadedFile(null)
            setUploadPreview(null)
            setCategory(aiSuggestion?.category || '')
            setDebitAccount(aiSuggestion?.account || '6990')
            setCreditAccount('1930')
            setDescription('')
        }
        onOpenChange(newOpen)
    }, [onOpenChange, aiSuggestion])

    const handleFileUpload = useCallback((files: File[]) => {
        if (files[0]) {
            const file = files[0]
            setUploadedFile(file)
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => setUploadPreview(e.target?.result as string)
                reader.readAsDataURL(file)
            }
        }
    }, [])

    const clearFile = useCallback(() => {
        setUploadedFile(null)
        setUploadPreview(null)
    }, [])

    const handleBook = useCallback(async () => {
        if (!entity) return
        if (isLoading) return

        setIsLoading(true)
        try {
            const bookingData: BookingData = {
                entityId: entity.id,
                entityType: entity.type,
                useAiSuggestion: !!aiSuggestion,
                category: category,
                debitAccount: debitAccount,
                creditAccount: creditAccount,
                description: description || `Bokföring: ${entity.name}`,
                amount: entity.amount ? parseFloat(entity.amount.replace(/[^0-9.-]/g, '')) : 0,
                attachmentName: uploadedFile?.name,
            }

            await onBook(bookingData)
            handleOpenChange(false)
        } catch (error) {
            console.error('Booking failed:', error)
        } finally {
            setIsLoading(false)
        }
    }, [entity, isLoading, aiSuggestion, category, debitAccount, creditAccount, description, uploadedFile, onBook, handleOpenChange])

    return {
        // Step management
        step,
        setStep,
        
        // File upload
        uploadedFile,
        setUploadedFile,
        uploadPreview,
        setUploadPreview,
        
        // Booking fields
        category,
        setCategory,
        debitAccount,
        setDebitAccount,
        creditAccount,
        setCreditAccount,
        description,
        setDescription,
        
        // State
        isLoading,
        bookingMode,
        hasAiSuggestion,
        
        // Actions
        handleOpenChange,
        handleBook,
        handleFileUpload,
        clearFile,
    }
}
