/**
 * AI Write Tools
 * 
 * Tools for creating/mutating data. These require user confirmation
 * before execution per the product rules.
 */

import { defineTool, AIConfirmationRequest } from './registry'
import type { ProcessedPayslip } from '@/services/payroll-processor'

// =============================================================================
// Invoice Creation Tool
// =============================================================================

export interface CreateInvoiceParams {
    customerName: string
    amount: number
    description: string
    dueDate?: string
    vatRate?: number
}

export interface CreatedInvoice {
    id: string
    customerName: string
    amount: number
    vatAmount: number
    totalAmount: number
    description: string
    dueDate: string
    status: 'draft'
}

export const createInvoiceTool = defineTool<CreateInvoiceParams, CreatedInvoice>({
    name: 'create_invoice',
    description: 'Skapa en kundfaktura. Kräver bekräftelse innan skapande.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            customerName: {
                type: 'string',
                description: 'Kundens namn eller företagsnamn',
            },
            amount: {
                type: 'number',
                description: 'Belopp exklusive moms',
            },
            description: {
                type: 'string',
                description: 'Beskrivning av tjänsten/produkten',
            },
            dueDate: {
                type: 'string',
                description: 'Förfallodatum (standard: 30 dagar)',
            },
            vatRate: {
                type: 'number',
                description: 'Momssats (standard: 0.25 = 25%)',
            },
        },
        required: ['customerName', 'amount', 'description'],
    },
    execute: async (params) => {
        const vatRate = params.vatRate ?? 0.25
        const vatAmount = params.amount * vatRate
        const totalAmount = params.amount + vatAmount

        // Calculate default due date (30 days from now)
        const dueDate = params.dueDate || new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0]

        // Return confirmation request (will be intercepted by registry)
        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skapa faktura',
            description: `Skapa en faktura till ${params.customerName}`,
            summary: [
                { label: 'Kund', value: params.customerName },
                { label: 'Belopp (ex. moms)', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Moms (25%)', value: `${vatAmount.toLocaleString('sv-SE')} kr` },
                { label: 'Totalt', value: `${totalAmount.toLocaleString('sv-SE')} kr` },
                { label: 'Förfallodatum', value: dueDate },
                { label: 'Beskrivning', value: params.description },
            ],
            action: {
                toolName: 'create_invoice',
                params,
            },
            requireCheckbox: false,
        }

        // If this is an actual execution (after confirmation), create the invoice
        const invoiceData = {
            id: `INV-${Date.now()}`,
            invoiceNumber: `INV-${Date.now()}`,
            customerName: params.customerName,
            amount: params.amount,
            vatAmount,
            totalAmount,
            description: params.description,
            dueDate,
            status: 'draft',
            source: 'user_reported',
            createdBy: 'ai_assistant'
        }

        // Actually save to database via API
        try {
            const response = await fetch('/api/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataType: 'invoice',
                    data: invoiceData
                })
            })

            if (!response.ok) {
                throw new Error('Failed to save invoice')
            }
        } catch (error) {
            console.error('Failed to save invoice:', error)
            return {
                success: false,
                error: 'Kunde inte spara fakturan. Försök igen.',
                message: 'Ett fel uppstod vid sparande av faktura.',
            }
        }

        return {
            success: true,
            data: invoiceData as any,
            message: `Faktura skapad: ${totalAmount.toLocaleString('sv-SE')} kr till ${params.customerName}. Förfallodatum: ${dueDate}.`,
            confirmationRequired: confirmationRequest,
            display: {
                component: 'InvoicePreview',
                props: { invoice: invoiceData },
                title: 'Skapad faktura',
                fullViewRoute: '/dashboard/appar/bokforing?tab=kundfakturor',
            },
        }
    },
})

// =============================================================================
// Transaction Categorization Tool
// =============================================================================

export interface CategorizeTransactionParams {
    transactionId: string
    category: string
    account?: string
}

export const categorizeTransactionTool = defineTool<CategorizeTransactionParams, { success: boolean }>({
    name: 'categorize_transaction',
    description: 'Kategorisera en transaktion till ett konto. Kan köras automatiskt.',
    category: 'write',
    requiresConfirmation: false, // Safe operation per product rules
    parameters: {
        type: 'object',
        properties: {
            transactionId: {
                type: 'string',
                description: 'ID för transaktionen',
            },
            category: {
                type: 'string',
                description: 'Kategori/kontotyp',
            },
            account: {
                type: 'string',
                description: 'Kontonummer i BAS-kontoplanen',
            },
        },
        required: ['transactionId', 'category'],
    },
    execute: async (params) => {
        // In production, this would update the transaction in the database
        return {
            success: true,
            data: { success: true },
            message: `Transaktion ${params.transactionId} kategoriserad som "${params.category}"${params.account ? ` (konto ${params.account})` : ''}.`,
        }
    },
})

// =============================================================================
// Run Payroll Tool
// =============================================================================

export interface RunPayrollParams {
    period: string
    employees?: string[]
}

export const runPayrollTool = defineTool<RunPayrollParams, ProcessedPayslip[]>({
    name: 'run_payroll',
    description: 'Kör lönekörning för en period. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            period: {
                type: 'string',
                description: 'Period (t.ex. "December 2024")',
            },
            employees: {
                type: 'array',
                items: { type: 'string' },
                description: 'Lista med anställda (standard: alla)',
            },
        },
        required: ['period'],
    },
    execute: async (params) => {
        // Mock payroll calculation
        const payslips: ProcessedPayslip[] = [
            { id: '1', employee: 'Anna Andersson', period: params.period, grossSalary: 45000, tax: 10800, netSalary: 34200, status: 'Utkast' },
            { id: '2', employee: 'Erik Eriksson', period: params.period, grossSalary: 40000, tax: 9600, netSalary: 30400, status: 'Utkast' },
        ]

        const totalGross = payslips.reduce((sum, p) => sum + p.grossSalary, 0)
        const totalNet = payslips.reduce((sum, p) => sum + p.netSalary, 0)
        const totalTax = payslips.reduce((sum, p) => sum + p.tax, 0)

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Kör lönekörning',
            description: `Kör löner för ${params.period}`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Antal anställda', value: String(payslips.length) },
                { label: 'Total bruttolön', value: `${totalGross.toLocaleString('sv-SE')} kr` },
                { label: 'Total skatt', value: `${totalTax.toLocaleString('sv-SE')} kr` },
                { label: 'Total nettolön', value: `${totalNet.toLocaleString('sv-SE')} kr` },
            ],
            warnings: [
                'Detta skapar lönebesked för alla anställda',
                'Lönebesked måste godkännas innan utbetalning',
            ],
            action: {
                toolName: 'run_payroll',
                params,
            },
            requireCheckbox: true,
            checkboxLabel: 'Jag bekräftar att uppgifterna stämmer',
        }

        return {
            success: true,
            data: payslips,
            message: `Löner för ${params.period} förberedd: ${payslips.length} anställda, ${totalNet.toLocaleString('sv-SE')} kr totalt.`,
            confirmationRequired: confirmationRequest,
            display: {
                component: 'PayslipsTable',
                props: { payslips },
                title: 'Lönebesked',
                fullViewRoute: '/dashboard/appar/loner',
            },
        }
    },
})

// =============================================================================
// Submit VAT Declaration Tool
// =============================================================================

export interface SubmitVatParams {
    period: string
}

export const submitVatTool = defineTool<SubmitVatParams, { submitted: boolean; referenceNumber: string }>({
    name: 'submit_vat_declaration',
    description: 'Skicka in momsdeklaration till Skatteverket. Kräver alltid bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            period: {
                type: 'string',
                description: 'Period (t.ex. "Q4 2024")',
            },
        },
        required: ['period'],
    },
    execute: async (params) => {
        // Mock VAT calculation
        const outputVat = 125000
        const inputVat = 45000
        const netVat = outputVat - inputVat
        const dueDate = '12 feb 2025'

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skicka momsdeklaration',
            description: 'Skicka momsdeklaration till Skatteverket',
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Utgående moms', value: `${outputVat.toLocaleString('sv-SE')} kr` },
                { label: 'Ingående moms', value: `${inputVat.toLocaleString('sv-SE')} kr` },
                { label: 'Att betala', value: `${netVat.toLocaleString('sv-SE')} kr` },
                { label: 'Betalas senast', value: dueDate },
            ],
            warnings: [
                'Detta är en juridiskt bindande deklaration',
                'Du är personligt ansvarig för uppgifternas riktighet',
            ],
            action: {
                toolName: 'submit_vat_declaration',
                params,
            },
            requireCheckbox: true,
            checkboxLabel: 'Jag intygar att uppgifterna är korrekta',
        }

        return {
            success: true,
            data: { submitted: true, referenceNumber: `SKV-${Date.now()}` },
            message: `Momsdeklaration för ${params.period} förberedd för inskickning. Att betala: ${netVat.toLocaleString('sv-SE')} kr.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Submit AGI (Employer Declaration) Tool
// =============================================================================

export interface SubmitAGIParams {
    period: string
}

export const submitAGITool = defineTool<SubmitAGIParams, { submitted: boolean; referenceNumber: string }>({
    name: 'submit_agi_declaration',
    description: 'Skicka in arbetsgivardeklaration (AGI) till Skatteverket. Kräver alltid bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            period: {
                type: 'string',
                description: 'Period (t.ex. "December 2024")',
            },
        },
        required: ['period'],
    },
    execute: async (params) => {
        // Mock AGI calculation
        const employees = 2
        const totalSalary = 85000
        const totalTax = 20400
        const contributions = 26690
        const totalDue = totalTax + contributions

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Skicka arbetsgivardeklaration',
            description: 'Skicka AGI till Skatteverket',
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Antal anställda', value: String(employees) },
                { label: 'Total bruttolön', value: `${totalSalary.toLocaleString('sv-SE')} kr` },
                { label: 'Avdragen skatt', value: `${totalTax.toLocaleString('sv-SE')} kr` },
                { label: 'Arbetsgivaravgifter', value: `${contributions.toLocaleString('sv-SE')} kr` },
                { label: 'Totalt att betala', value: `${totalDue.toLocaleString('sv-SE')} kr` },
            ],
            warnings: [
                'Detta är en juridiskt bindande deklaration',
                'Individuell arbetsgivardeklaration skickas för varje anställd',
            ],
            action: {
                toolName: 'submit_agi_declaration',
                params,
            },
            requireCheckbox: true,
            checkboxLabel: 'Jag intygar att uppgifterna är korrekta',
        }

        return {
            success: true,
            data: { submitted: true, referenceNumber: `AGI-${Date.now()}` },
            message: `AGI för ${params.period} förberedd. Att betala: ${totalDue.toLocaleString('sv-SE')} kr.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Receipt Creation Tool (AI-First Data Entry)
// =============================================================================

export interface CreateReceiptParams {
    supplier: string
    amount: number
    date?: string
    category?: string
    description?: string
    vatRate?: number
}

export interface CreatedReceipt {
    id: string
    supplier: string
    amount: string
    date: string
    category: string
    status: 'pending'
    source: 'user_reported'
    createdBy: 'ai_assistant'
    originalUserMessage?: string
}

export const createReceiptTool = defineTool<CreateReceiptParams, CreatedReceipt>({
    name: 'create_receipt',
    description: 'Registrera ett nytt kvitto rapporterat av användaren. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            supplier: {
                type: 'string',
                description: 'Leverantör/butik (t.ex. "Staples", "Amazon")',
            },
            amount: {
                type: 'number',
                description: 'Belopp i kronor (positivt tal, blir negativt i bokföringen)',
            },
            date: {
                type: 'string',
                description: 'Datum (YYYY-MM-DD). Standard: dagens datum',
            },
            category: {
                type: 'string',
                description: 'Kategori (t.ex. "Kontorsmaterial", "Resa", "Programvara")',
            },
            description: {
                type: 'string',
                description: 'Beskrivning av inköpet',
            },
            vatRate: {
                type: 'number',
                description: 'Momssats (standard: 0.25 = 25%)',
            },
        },
        required: ['supplier', 'amount'],
    },
    execute: async (params) => {
        const date = params.date || new Date().toISOString().split('T')[0]
        const category = params.category || 'Övrigt'
        const vatRate = params.vatRate ?? 0.25
        const vatAmount = params.amount * vatRate

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Registrera kvitto',
            description: `Skapa kvitto från ${params.supplier}`,
            summary: [
                { label: 'Leverantör', value: params.supplier },
                { label: 'Belopp', value: `-${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'Moms', value: `${vatAmount.toLocaleString('sv-SE')} kr (${vatRate * 100}%)` },
                { label: 'Datum', value: date },
                { label: 'Kategori', value: category },
                ...(params.description ? [{ label: 'Beskrivning', value: params.description }] : []),
            ],
            warnings: [
                'Detta kvitto markeras som "rapporterat av användare"',
                'Ladda upp kvittobild för verifikation',
            ],
            action: {
                toolName: 'create_receipt',
                params,
            },
            requireCheckbox: false,
        }

        // Prepare receipt data
        const receiptData = {
            supplier: params.supplier,
            amount: `-${params.amount} kr`,
            date,
            category,
            source: 'user_reported',
            createdBy: 'ai_assistant',
        }

        // Actually save to database via API
        let savedReceipt: CreatedReceipt
        try {
            const response = await fetch('/api/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataType: 'receipt',
                    data: {
                        merchant: params.supplier,
                        amount: -params.amount,
                        date,
                        category,
                        source: 'user_reported',
                        createdBy: 'ai_assistant'
                    }
                })
            })

            if (response.ok) {
                const result = await response.json()
                savedReceipt = {
                    id: result.item?.id || `REC-${Date.now()}`,
                    supplier: params.supplier,
                    amount: `-${params.amount.toLocaleString('sv-SE')} kr`,
                    date,
                    category,
                    status: 'pending',
                    source: 'user_reported',
                    createdBy: 'ai_assistant',
                }
            } else {
                throw new Error('Failed to save receipt')
            }
        } catch (error) {
            console.error('Failed to save receipt:', error)
            // Return error if save fails
            return {
                success: false,
                error: 'Kunde inte spara kvittot. Försök igen.',
                message: 'Ett fel uppstod vid sparande av kvitto.',
            }
        }

        return {
            success: true,
            data: savedReceipt,
            message: `Kvitto registrerat: ${params.supplier}, ${params.amount.toLocaleString('sv-SE')} kr.`,
            confirmationRequired: confirmationRequest,
            display: {
                component: 'ReceiptCard',
                props: { receipt: savedReceipt },
                title: 'Registrerat kvitto',
                fullViewRoute: '/dashboard/appar/bokforing?tab=kvitton',
            },
        }
    },
})

// =============================================================================
// Transaction Creation Tool (AI-First Data Entry)
// =============================================================================

export interface CreateTransactionParams {
    name: string
    amount: number
    date?: string
    category?: string
    account?: string
    vatRate?: number
    type?: 'expense' | 'income'
}

export interface CreatedTransaction {
    id: string
    name: string
    amount: string
    amountValue: number
    date: string
    status: 'pending'
    category: string
    account: string
    source: 'user_reported'
    createdBy: 'ai_assistant'
}

export const createTransactionTool = defineTool<CreateTransactionParams, CreatedTransaction>({
    name: 'create_transaction',
    description: 'Registrera en ny transaktion rapporterad av användaren. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Namn/beskrivning av transaktionen',
            },
            amount: {
                type: 'number',
                description: 'Belopp i kronor (positivt tal)',
            },
            type: {
                type: 'string',
                enum: ['expense', 'income'],
                description: 'Typ: expense (utgift) eller income (intäkt). Standard: expense',
            },
            date: {
                type: 'string',
                description: 'Datum (YYYY-MM-DD). Standard: dagens datum',
            },
            category: {
                type: 'string',
                description: 'Kategori (t.ex. "Kontorsmaterial", "Intäkter")',
            },
            account: {
                type: 'string',
                description: 'Konto/betalningssätt (t.ex. "Företagskonto", "Företagskort")',
            },
            vatRate: {
                type: 'number',
                description: 'Momssats (standard: 0.25 = 25%)',
            },
        },
        required: ['name', 'amount'],
    },
    execute: async (params) => {
        const date = params.date || new Date().toISOString().split('T')[0]
        const category = params.category || 'Övrigt'
        const account = params.account || 'Företagskonto'
        const isIncome = params.type === 'income'
        const amountValue = isIncome ? params.amount : -params.amount
        const amountStr = isIncome
            ? `+${params.amount.toLocaleString('sv-SE')} kr`
            : `-${params.amount.toLocaleString('sv-SE')} kr`

        const confirmationRequest: AIConfirmationRequest = {
            title: isIncome ? 'Registrera intäkt' : 'Registrera utgift',
            description: `Skapa transaktion: ${params.name}`,
            summary: [
                { label: 'Beskrivning', value: params.name },
                { label: 'Belopp', value: amountStr },
                { label: 'Typ', value: isIncome ? 'Intäkt' : 'Utgift' },
                { label: 'Datum', value: date },
                { label: 'Kategori', value: category },
                { label: 'Konto', value: account },
            ],
            warnings: [
                'Denna transaktion markeras som "rapporterad av användare"',
                'Underlag kan laddas upp separat',
            ],
            action: {
                toolName: 'create_transaction',
                params,
            },
            requireCheckbox: false,
        }

        // Actually save to database via API
        let savedTransaction: CreatedTransaction
        try {
            const response = await fetch('/api/receive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataType: 'transaction',
                    data: {
                        name: params.name,
                        description: params.name,
                        amount: amountValue,
                        date,
                        account,
                        category,
                        source: 'user_reported',
                        createdBy: 'ai_assistant'
                    }
                })
            })

            if (response.ok) {
                const result = await response.json()
                savedTransaction = {
                    id: result.item?.id || `TXN-${Date.now()}`,
                    name: params.name,
                    amount: amountStr,
                    amountValue,
                    date,
                    status: 'pending',
                    category,
                    account,
                    source: 'user_reported',
                    createdBy: 'ai_assistant',
                }
            } else {
                throw new Error('Failed to save transaction')
            }
        } catch (error) {
            console.error('Failed to save transaction:', error)
            return {
                success: false,
                error: 'Kunde inte spara transaktionen. Försök igen.',
                message: 'Ett fel uppstod vid sparande av transaktion.',
            }
        }

        return {
            success: true,
            data: savedTransaction,
            message: `Transaktion registrerad: ${params.name}, ${amountStr}.`,
            confirmationRequired: confirmationRequest,
            display: {
                component: 'TransactionCard',
                props: { transaction: savedTransaction },
                title: 'Registrerad transaktion',
                fullViewRoute: '/dashboard/appar/bokforing?tab=transaktioner',
            },
        }
    },
})

// =============================================================================
// Benefit Assignment Tool
// =============================================================================

export interface AssignBenefitParams {
    employeeName: string
    benefitId: string
    amount: number
    year?: number
}

export const assignBenefitTool = defineTool<AssignBenefitParams, any>({
    name: 'assign_benefit',
    description: 'Tilldela en förmån till en anställd. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            employeeName: {
                type: 'string',
                description: 'Namn på den anställda',
            },
            benefitId: {
                type: 'string',
                description: 'ID för förmånen (t.ex. "friskvard")',
            },
            amount: {
                type: 'number',
                description: 'Belopp i kronor',
            },
            year: {
                type: 'number',
                description: 'År (standard: nuvarande år)',
            },
        },
        required: ['employeeName', 'benefitId', 'amount'],
    },
    execute: async (params) => {
        const year = params.year || new Date().getFullYear()

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Tilldela förmån',
            description: `Tilldela ${params.benefitId} till ${params.employeeName}`,
            summary: [
                { label: 'Anställd', value: params.employeeName },
                { label: 'Förmån', value: params.benefitId },
                { label: 'Belopp', value: `${params.amount.toLocaleString('sv-SE')} kr` },
                { label: 'År', value: String(year) },
            ],
            action: {
                toolName: 'assign_benefit',
                params,
            },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: { success: true },
            message: `Förmån ${params.benefitId} förberedd för ${params.employeeName}. Belopp: ${params.amount} kr.`,
            confirmationRequired: confirmationRequest,
        }
    }
})

// =============================================================================
// Export all write tools
// =============================================================================

export const writeTools = [
    createInvoiceTool,
    createReceiptTool,
    createTransactionTool,
    categorizeTransactionTool,
    runPayrollTool,
    submitVatTool,
    submitAGITool,
    assignBenefitTool,
]

