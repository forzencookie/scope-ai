import { defineTool } from '../registry'
import type { AIConfirmationRequest } from '../registry'

export interface RegisterCustomerParams {
    name: string
    email?: string
    phone?: string
    orgNumber?: string
    address?: string
    city?: string
    country?: string
    paymentTerms?: number
}

export interface RegisteredCustomer {
    id: string
    name: string
    email?: string
    phone?: string
    orgNumber?: string
    address?: string
    city?: string
    country: string
    paymentTerms: number
}

export const registerCustomerTool = defineTool<RegisterCustomerParams, RegisteredCustomer>({
    name: 'register_customer',
    description: 'Registrerar en ny kund i systemet. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    domain: 'common',
    keywords: ['registrera kund', 'ny kund', 'kundregister', 'faktureringskund'],
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Kundens namn (person eller företag)' },
            email: { type: 'string', description: 'E-postadress' },
            phone: { type: 'string', description: 'Telefonnummer' },
            orgNumber: { type: 'string', description: 'Organisationsnummer' },
            address: { type: 'string', description: 'Gatuadress' },
            city: { type: 'string', description: 'Ort' },
            country: { type: 'string', description: 'Land (standard: Sverige)' },
            paymentTerms: { type: 'number', description: 'Betalningsvillkor i dagar (standard: 30)' },
        },
        required: ['name'],
    },
    execute: async (params, context) => {
        const country = params.country ?? 'Sverige'
        const paymentTerms = params.paymentTerms ?? 30

        if (context?.isConfirmed) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const res = await fetch(`${baseUrl}/api/customers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: params.name,
                        email: params.email ?? null,
                        phone: params.phone ?? null,
                        org_number: params.orgNumber ?? null,
                        address: params.address ?? null,
                        city: params.city ?? null,
                        country,
                        payment_terms: paymentTerms,
                    }),
                })
                if (!res.ok) {
                    const err = await res.json().catch(() => ({})) as { error?: string }
                    return { success: false, error: err.error ?? 'Kunde inte registrera kund.' }
                }
                const data = await res.json() as { customer?: RegisteredCustomer }
                const saved: RegisteredCustomer = data.customer ?? { id: 'unknown', name: params.name, email: params.email, phone: params.phone, orgNumber: params.orgNumber, address: params.address, city: params.city, country, paymentTerms }
                return { success: true, data: saved, message: `${params.name} har registrerats som kund.` }
            } catch {
                return { success: false, error: 'Kunde inte spara kund till databasen.' }
            }
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: `Registrera ${params.name}?`,
            description: 'Detta lägger till en ny kund i systemet.',
            summary: [
                { label: 'Namn', value: params.name },
                ...(params.email ? [{ label: 'E-post', value: params.email }] : []),
                ...(params.phone ? [{ label: 'Telefon', value: params.phone }] : []),
                ...(params.orgNumber ? [{ label: 'Org.nr', value: params.orgNumber }] : []),
                ...(params.city ? [{ label: 'Ort', value: params.city }] : []),
                { label: 'Land', value: country },
                { label: 'Betalningsvillkor', value: `${paymentTerms} dagar` },
            ],
            action: { toolName: 'register_customer', params },
        }

        return {
            success: true,
            message: `Jag har förberett registrering av ${params.name}. Bekräfta för att spara.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const customerTools = [registerCustomerTool]
