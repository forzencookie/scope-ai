'use server'

import { getAuthContext } from "@/lib/database/auth-server"
import { pendingBookingService } from "@/services/pending-booking-service"
import { revalidatePath } from "next/cache"
import type { VerificationEntry } from "@/types"

/**
 * Server Action to finalize a pending booking into a verification.
 */
export async function bookPendingItemAction(id: string, finalEntries?: VerificationEntry[]) {
    const ctx = await getAuthContext()
    if (!ctx) {
        return { success: false, error: "Unauthorized" }
    }

    const { supabase } = ctx
    
    try {
        const result = await pendingBookingService.bookPendingItem(id, finalEntries, supabase)
        
        // Revalidate relevant pages
        revalidatePath('/dashboard/bokforing/transaktioner')
        revalidatePath('/dashboard/bokforing/verifikationer')
        
        return { success: true, ...result }
    } catch (error) {
        console.error('[Action] bookPendingItemAction error:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to book item" 
        }
    }
}

/**
 * Server Action to dismiss a pending booking.
 */
export async function dismissPendingBookingAction(id: string) {
    const ctx = await getAuthContext()
    if (!ctx) {
        return { success: false, error: "Unauthorized" }
    }

    const { supabase } = ctx
    
    try {
        await pendingBookingService.dismissPendingBooking(id, supabase)
        
        revalidatePath('/dashboard/bokforing/transaktioner')
        
        return { success: true }
    } catch (error) {
        console.error('[Action] dismissPendingBookingAction error:', error)
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to dismiss item" 
        }
    }
}
