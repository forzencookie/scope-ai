import { defineTool } from '../registry'
import { payrollService, type Employee } from '@/services/payroll'

// =============================================================================
// Update Employee Tool
// =============================================================================

export interface UpdateEmployeeParams {
    employeeId: string
    name?: string
    role?: string
    monthlySalary?: number
    status?: string
    kommun?: string
    email?: string
    effectiveDate?: string
}

export const updateEmployeeTool = defineTool<UpdateEmployeeParams, Employee>({
    name: 'update_employee',
    description: 'Uppdatera uppgifter för en befintlig anställd — lön, titel, status, eller kontaktuppgifter. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    domain: 'loner',
    keywords: ['uppdatera', 'anställd', 'lön', 'titel', 'status', 'ändra'],
    parameters: {
        type: 'object',
        properties: {
            employeeId: { type: 'string', description: 'ID för den anställde' },
            name: { type: 'string', description: 'Nytt namn' },
            role: { type: 'string', description: 'Ny titel/roll' },
            monthlySalary: { type: 'number', description: 'Ny månadslön i kronor' },
            status: { type: 'string', description: 'Ny status: aktiv | föräldraledig | tjänstledig | avslutad' },
            kommun: { type: 'string', description: 'Ny hemkommun (skattetabell)' },
            email: { type: 'string', description: 'Ny e-postadress' },
            effectiveDate: { type: 'string', description: 'Gäller från (YYYY-MM-DD)' },
        },
        required: ['employeeId'],
    },
    execute: async (params, context) => {
        if (context?.isConfirmed) {
            try {
                const updated = await payrollService.updateEmployee(params.employeeId, {
                    name: params.name,
                    role: params.role,
                    monthlySalary: params.monthlySalary,
                    status: params.status,
                    kommun: params.kommun,
                    email: params.email,
                })
                return {
                    success: true,
                    data: updated,
                    message: `${updated.name} uppdaterad.`,
                }
            } catch {
                return { success: false, error: 'Kunde inte uppdatera anställd.' }
            }
        }

        const summary: Array<{ label: string; value: string }> = []
        if (params.name) summary.push({ label: 'Namn', value: params.name })
        if (params.role) summary.push({ label: 'Titel', value: params.role })
        if (params.monthlySalary) summary.push({ label: 'Lön', value: `${params.monthlySalary.toLocaleString('sv-SE')} kr/mån` })
        if (params.status) summary.push({ label: 'Status', value: params.status })
        if (params.effectiveDate) summary.push({ label: 'Gäller från', value: params.effectiveDate })

        return {
            success: true,
            data: { id: params.employeeId, name: '', status: '', monthlySalary: 0 } as unknown as Employee,
            message: 'Uppdatering förberedd. Bekräfta för att spara.',
            confirmationRequired: {
                title: 'Uppdatera anställd',
                description: `Ändra uppgifter för anställd`,
                summary,
                action: { toolName: 'update_employee', params },
            },
        }
    },
})

// =============================================================================
// Batch Update Employee Status Tool
// =============================================================================

export interface BatchEmployeeStatusUpdate {
    employeeId: string
    status: string
    description?: string
}

export interface BatchUpdateEmployeeStatusParams {
    updates: BatchEmployeeStatusUpdate[]
}

export interface BatchUpdateResult {
    updated: number
    errors: number
}

export const batchUpdateEmployeeStatusTool = defineTool<BatchUpdateEmployeeStatusParams, BatchUpdateResult>({
    name: 'batch_update_employee_status',
    description: 'Uppdatera status för flera anställda på en gång — t.ex. aktivera nya anställda, sätt föräldraledig, eller avsluta anställningar. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    allowedCompanyTypes: [],
    domain: 'loner',
    keywords: ['batch', 'anställda', 'status', 'uppdatera', 'flera'],
    parameters: {
        type: 'object',
        properties: {
            updates: {
                type: 'array',
                description: 'Lista med statusändringar',
                items: {
                    type: 'object',
                    properties: {
                        employeeId: { type: 'string', description: 'ID för anställd' },
                        status: { type: 'string', description: 'Ny status: aktiv | föräldraledig | tjänstledig | avslutad' },
                        description: { type: 'string', description: 'Förklaring (visas i bekräftelsen)' },
                    },
                    required: ['employeeId', 'status'],
                },
            },
        },
        required: ['updates'],
    },
    execute: async (params, context) => {
        if (context?.isConfirmed) {
            let updated = 0
            let errors = 0
            for (const u of params.updates) {
                try {
                    await payrollService.updateEmployee(u.employeeId, { status: u.status })
                    updated++
                } catch {
                    errors++
                }
            }
            return {
                success: true,
                data: { updated, errors },
                message: `${updated} anställda uppdaterade${errors > 0 ? `, ${errors} misslyckades` : ''}.`,
            }
        }

        const summary = [
            { label: 'Antal anställda', value: String(params.updates.length) },
            ...params.updates.slice(0, 3).map(u => ({ label: u.description ?? u.employeeId, value: u.status })),
        ]

        return {
            success: true,
            data: { updated: 0, errors: 0 },
            message: `${params.updates.length} statusändringar förberedda. Bekräfta för att spara.`,
            confirmationRequired: {
                title: 'Uppdatera anställda',
                description: `Ändra status för ${params.updates.length} anställda`,
                summary,
                action: { toolName: 'batch_update_employee_status', params },
                requireCheckbox: true,
            },
        }
    },
})

export const updateEmployeeTools = [updateEmployeeTool, batchUpdateEmployeeStatusTool]
