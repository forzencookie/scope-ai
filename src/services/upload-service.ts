/**
 * Upload Service for Supabase Storage
 * 
 * Handles file uploads to Supabase Storage buckets
 */

import { getSupabaseClient } from '@/lib/database/supabase'

export type UploadResult = {
    success: true
    url: string
    path: string
} | {
    success: false
    error: string
}

/**
 * Upload a receipt file to Supabase Storage
 * 
 * @param file - The File object to upload
 * @param userId - The user's ID (used for folder organization)
 * @returns Upload result with URL or error
 */
export async function uploadReceiptFile(file: File, userId: string): Promise<UploadResult> {
    try {
        const supabase = getSupabaseClient()

        // Generate unique filename to avoid collisions
        const timestamp = Date.now()
        const extension = file.name.split('.').pop() || 'bin'
        const filename = `${timestamp}-${crypto.randomUUID().slice(0, 8)}.${extension}`

        // Store in user's folder for RLS
        const path = `${userId}/${filename}`

        const { data, error } = await supabase.storage
            .from('receipts')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            return { success: false, error: error.message }
        }

        // Get public URL (even for private buckets, signed URLs work for the owner)
        const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(data.path)

        return {
            success: true,
            url: urlData.publicUrl,
            path: data.path
        }
    } catch (error) {
        console.error('Upload service error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown upload error'
        }
    }
}

/**
 * Get a signed URL for a private receipt file
 * 
 * @param path - The file path in storage
 * @param expiresIn - Seconds until URL expires (default 1 hour)
 */
export async function getReceiptSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
    try {
        const supabase = getSupabaseClient()

        const { data, error } = await supabase.storage
            .from('receipts')
            .createSignedUrl(path, expiresIn)

        if (error) {
            console.error('Signed URL error:', error)
            return null
        }

        return data.signedUrl
    } catch (error) {
        console.error('Get signed URL error:', error)
        return null
    }
}

/**
 * Delete a receipt file from storage
 * 
 * @param path - The file path to delete
 */
export async function deleteReceiptFile(path: string): Promise<boolean> {
    try {
        const supabase = getSupabaseClient()

        const { error } = await supabase.storage
            .from('receipts')
            .remove([path])

        if (error) {
            console.error('Delete error:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Delete error:', error)
        return false
    }
}
