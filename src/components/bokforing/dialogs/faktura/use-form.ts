"use client"

import { useState, useMemo, useCallback } from "react"

export interface InvoiceLineItem {
    id: string
    description: string
    quantity: number
    unitPrice: number
    vatRate: number
}

export interface InvoiceFormErrors {
    customer?: string
    email?: string
    amount?: string
    dueDate?: string
    items?: string
}

export interface InvoiceFormState {
    customer: string
    email: string
    address: string
    orgNumber: string
    reference: string
    dueDate: string
    paymentTerms: string
    notes: string
    lineItems: InvoiceLineItem[]
}

const createDefaultLineItem = (): InvoiceLineItem => ({
    id: String(Date.now()),
    description: '',
    quantity: 1,
    unitPrice: 0,
    vatRate: 25
})

const getInitialFormState = (): InvoiceFormState => ({
    customer: "",
    email: "",
    address: "",
    orgNumber: "",
    reference: "",
    dueDate: "",
    paymentTerms: "30",
    notes: "",
    lineItems: [{ id: '1', description: '', quantity: 1, unitPrice: 0, vatRate: 25 }]
})

export function useInvoiceForm() {
    const [formState, setFormState] = useState<InvoiceFormState>(getInitialFormState)
    const [formErrors, setFormErrors] = useState<InvoiceFormErrors>({})
    const [isCreating, setIsCreating] = useState(false)
    const [expanded, setExpanded] = useState(false)

    // Field setters
    const setCustomer = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, customer: value }))
        if (formErrors.customer) {
            setFormErrors(prev => ({ ...prev, customer: undefined }))
        }
    }, [formErrors.customer])

    const setEmail = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, email: value }))
        if (formErrors.email) {
            setFormErrors(prev => ({ ...prev, email: undefined }))
        }
    }, [formErrors.email])

    const setAddress = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, address: value }))
    }, [])

    const setOrgNumber = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, orgNumber: value }))
    }, [])

    const setReference = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, reference: value }))
    }, [])

    const setDueDate = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, dueDate: value }))
    }, [])

    const setPaymentTerms = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, paymentTerms: value }))
    }, [])

    const setNotes = useCallback((value: string) => {
        setFormState(prev => ({ ...prev, notes: value }))
    }, [])

    // Line item operations
    const addLineItem = useCallback(() => {
        setFormState(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, createDefaultLineItem()]
        }))
    }, [])

    const removeLineItem = useCallback((id: string) => {
        setFormState(prev => {
            if (prev.lineItems.length <= 1) return prev
            return {
                ...prev,
                lineItems: prev.lineItems.filter(item => item.id !== id)
            }
        })
    }, [])

    const updateLineItem = useCallback((id: string, field: keyof InvoiceLineItem, value: string | number) => {
        setFormState(prev => ({
            ...prev,
            lineItems: prev.lineItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }))
    }, [])

    // Calculate totals
    const invoiceTotals = useMemo(() => {
        const subtotal = formState.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        const vatAmount = formState.lineItems.reduce((sum, item) => {
            const lineTotal = item.quantity * item.unitPrice
            return sum + (lineTotal * item.vatRate / 100)
        }, 0)
        return {
            subtotal,
            vatAmount,
            total: subtotal + vatAmount
        }
    }, [formState.lineItems])

    // Form reset
    const resetForm = useCallback(() => {
        setFormState(getInitialFormState())
        setFormErrors({})
        setExpanded(false)
        setIsCreating(false)
    }, [])

    // Form validation
    const validateForm = useCallback((): boolean => {
        const errors: InvoiceFormErrors = {}

        if (!formState.customer.trim()) {
            errors.customer = "Kundnamn krävs"
        } else if (formState.customer.trim().length < 2) {
            errors.customer = "Kundnamn måste vara minst 2 tecken"
        }

        if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
            errors.email = "Ogiltig e-postadress"
        }

        const validItems = formState.lineItems.filter(item => item.description.trim() && item.unitPrice > 0)
        if (validItems.length === 0) {
            errors.items = "Lägg till minst en fakturarad med beskrivning och pris"
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }, [formState.customer, formState.email, formState.lineItems])

    return {
        formState,
        formErrors,
        isCreating,
        setIsCreating,
        expanded,
        setExpanded,
        // Field setters
        setCustomer,
        setEmail,
        setAddress,
        setOrgNumber,
        setReference,
        setDueDate,
        setPaymentTerms,
        setNotes,
        // Line items
        addLineItem,
        removeLineItem,
        updateLineItem,
        // Totals
        invoiceTotals,
        // Helpers
        resetForm,
        validateForm,
        setFormErrors,
    }
}
