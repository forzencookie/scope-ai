'use server'

import { getAuthContext } from "@/lib/database/auth-server"
import { updateCompany as updateCompanyInDb } from "@/services/company/company-service.server"
import { CompanySettingsSchema } from "@/lib/ai-schema"
import { revalidatePath } from "next/cache"

/**
 * Server Action to update company settings.
 * Validated by Zod and requires authentication.
 */
export async function updateCompanyAction(id: string, settings: any) {
    const ctx = await getAuthContext()
    if (!ctx) {
        return { success: false, error: "Unauthorized" }
    }

    const { userId } = ctx

    // Validate settings using the standard schema
    const validation = CompanySettingsSchema.safeParse(settings)
    if (!validation.success) {
        return {
            success: false,
            error: "Valideringsfel: " + validation.error.issues[0].message
        }
    }

    try {
        await updateCompanyInDb(id, userId, validation.data)
        
        // Revalidate the dashboard and settings pages
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/settings')
        
        return { success: true }
    } catch (error) {
        console.error('[Action] updateCompanyAction error:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to update company" 
        }
    }
}
