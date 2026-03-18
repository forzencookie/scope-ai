/**
 * Company Logo API
 *
 * POST: Upload a new company logo
 */

import { NextRequest } from 'next/server'
import { verifyAuth, ApiResponse } from "@/lib/database/auth-server"
import { uploadCompanyLogo } from '@/services/upload-service'
import { createBrowserClient } from '@/lib/database/client'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

export async function POST(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return ApiResponse.badRequest('No file provided')
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return ApiResponse.badRequest('File must be an image (JPEG, PNG, WebP, or SVG)')
        }

        if (file.size > MAX_SIZE) {
            return ApiResponse.badRequest('File must be under 2MB')
        }

        const result = await uploadCompanyLogo(file, auth.userId)

        if (!result.success) {
            return ApiResponse.serverError(result.error)
        }

        // Update company logo_url in database
        const supabase = createBrowserClient()
        await supabase
            .from('companies')
            .update({ logo_url: result.url } as Record<string, unknown>)
            .eq('user_id', auth.userId)

        return Response.json({ logo_url: result.url })
    } catch (error) {
        console.error('[Company Logo API] Upload error:', error)
        return ApiResponse.serverError('Failed to upload company logo')
    }
}
