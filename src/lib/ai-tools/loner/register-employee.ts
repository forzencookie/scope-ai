// @ts-nocheck

import { z } from "zod"
import { AITool, InteractionContext } from "@/lib/ai-tools/types.ts"

export const registerEmployeeTool: AITool = {
    name: "register_employee",
    description: "Proposes registering a new employee. Returns a preview card for user confirmation.",
    parameters: z.object({
        name: z.string().describe("Full name of the employee"),
        role: z.string().describe("Job title or role"),
        email: z.string().email().describe("Work email address"),
        salary: z.number().describe("Monthly salary in SEK"),
    }),

    execute: async ({ name, role, email, salary }: { name: string, role: string, email: string, salary: number }, context: InteractionContext) => {
        // We don't save immediately. We return a preview.
        // The preview component will handle the actual saving via API.

        return {
            success: true,
            message: `Prepared registration for ${name}. Please confirm details.`,
            display: {
                type: 'employee_preview',
                data: {
                    name,
                    role,
                    email,
                    salary
                }
            }
        }
    }
}
