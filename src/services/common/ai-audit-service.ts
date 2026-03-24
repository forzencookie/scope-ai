import { createBrowserClient } from '@/lib/database/client'
import type { Database, Json } from '@/types/database'

export interface AIAuditEntry {
    id: string
    tool_name: string
    parameters: Json
    result: Json
    user_id: string
    company_id: string
    created_at: string
}

export const aiAuditService = {
    /**
     * Save a pending tool confirmation
     */
    async savePendingConfirmation(confirmationId: string, params: Record<string, unknown>, userId: string, companyId: string) {
        const supabase = createBrowserClient()
        const { error } = await supabase
            .from('ai_audit_log')
            .insert({
                tool_name: `__confirmation__:${confirmationId}`,
                parameters: params as Json,
                user_id: userId,
                company_id: companyId,
            })
        
        if (error) throw error
    },

    /**
     * Get a pending tool confirmation
     */
    async getPendingConfirmation(confirmationId: string) {
        const supabase = createBrowserClient()
        const { data, error } = await supabase
            .from('ai_audit_log')
            .select('parameters')
            .eq('tool_name', `__confirmation__:${confirmationId}`)
            .single()
        
        if (error) return null
        return data.parameters as Record<string, unknown>
    },

    /**
     * Delete a pending tool confirmation after execution
     */
    async deletePendingConfirmation(confirmationId: string) {
        const supabase = createBrowserClient()
        try {
            await supabase
                .from('ai_audit_log')
                .delete()
                .eq('tool_name', `__confirmation__:${confirmationId}`)
        } catch (err) {
            console.warn('[AIAuditService] Failed to delete confirmation:', err)
        }
    },

    /**
     * Log a completed tool execution
     */
    async logToolExecution(toolName: string, params: unknown, result: unknown, userId: string, companyId: string) {
        const supabase = createBrowserClient()
        const { error } = await supabase
            .from('ai_audit_log')
            .insert({
                tool_name: toolName,
                parameters: params as Json,
                result: result as Json,
                user_id: userId,
                company_id: companyId,
            })
        
        if (error) {
            console.error('[AIAuditService] Logging failed:', error)
        }
    }
}
