
import { z } from "zod"
import { AITool, InteractionContext } from "@/lib/ai-tools/types"

export const registerEmployeeTool: AITool = {
    name: "register_employee",
    description: "Proposes registering a new employee. Returns a preview card for user confirmation.",
    requiresConfirmation: true,
    category: 'write',
    parameters: z.object({
        name: z.string().describe("Full name of the employee"),
        role: z.string().describe("Job title or role"),
        email: z.string().email().describe("Work email address"),
        salary: z.number().describe("Monthly salary in SEK"),
    }),

    execute: async (params: unknown, _context: InteractionContext) => {
        const { name, role, email, salary } = params as { name: string, role: string, email: string, salary: number }
        // We don't save immediately. We return a preview.
        // The preview component will handle the actual saving via API.

        return {
            success: true,
            message: `Jag har förberett registrering av ${name}. Ser det korrekt ut?`,
            display: {
                component: "EmployeeList",
                props: {
                    employees: [{
                        name,
                        role,
                        email,
                        salary,
                        id: 'preview',
                        status: 'active'
                    }]
                }
            },
            confirmationRequired: {
                title: `Registrera ${name}?`,
                description: "Detta lägger till en ny anställd i systemet.",
                summary: [
                    { label: "Namn", value: name },
                    { label: "Roll", value: role },
                    { label: "Månadslön", value: String(salary) + " kr" }
                ],
                action: {
                    toolName: "register_employee",
                    params: params
                }
            }
        }
    }
}
