
import { AITool, InteractionContext } from "@/lib/ai-tools/types"
import { taxService } from '@/services/tax-service'

export const registerEmployeeTool: AITool = {
    name: "register_employee",
    description: "Proposes registering a new employee. Returns a preview card for user confirmation.",
    requiresConfirmation: true,
    category: 'write',
    parameters: {
        type: 'object',
        properties: {
            name: { type: 'string', description: 'Full name of the employee' },
            role: { type: 'string', description: 'Job title or role' },
            email: { type: 'string', format: 'email', description: 'Work email address' },
            salary: { type: 'number', description: 'Monthly salary in SEK' },
            personalNumber: { type: 'string', description: 'Personnummer (YYYYMMDD-XXXX)' },
            taxTable: { type: 'number', description: 'SKV tax table number (29-40). Used for SFL 11 kap compliant withholding.' },
            taxColumn: { type: 'number', description: 'SKV tax table column (1-6, default 1)' },
        },
        required: ['name', 'role', 'email', 'salary']
    },

    execute: async (params: unknown, context: InteractionContext) => {
        const { name, role, email, salary, personalNumber, taxTable, taxColumn } = params as {
            name: string, role: string, email: string, salary: number, personalNumber?: string, taxTable?: number, taxColumn?: number
        }

        // If confirmed, persist to database
        if (context?.isConfirmed) {
            try {
                const year = new Date().getFullYear()
                const rates = await taxService.getAllTaxRates(year)
                const defaultTaxRate = rates?.marginalTaxRateApprox ?? 0.32

                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const res = await fetch(`${baseUrl}/api/employees`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        role,
                        email,
                        monthly_salary: salary,
                        personal_number: personalNumber || null,
                        tax_rate: defaultTaxRate,
                        tax_table: taxTable || null,
                        tax_column: taxColumn || null,
                        status: 'active',
                    }),
                })

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}))
                    return { success: false, error: err.error || 'Kunde inte registrera anställd.' }
                }

                const data = await res.json()
                return {
                    success: true,
                    data: data.employee,
                    message: `${name} har registrerats som anställd. Månadslön: ${salary.toLocaleString('sv-SE')} kr.`,
                }
            } catch (error) {
                return { success: false, error: 'Kunde inte spara anställd till databasen.' }
            }
        }

        // Preflight: return confirmation request
        return {
            success: true,
            message: `Jag har förberett registrering av ${name}. Bekräfta för att spara.`,
            confirmationRequired: {
                title: `Registrera ${name}?`,
                description: "Detta lägger till en ny anställd i systemet.",
                summary: [
                    { label: "Namn", value: name },
                    { label: "Roll", value: role },
                    { label: "E-post", value: email },
                    { label: "Månadslön", value: `${salary.toLocaleString('sv-SE')} kr` },
                ],
                action: {
                    toolName: "register_employee",
                    params: params
                }
            }
        }
    }
}
