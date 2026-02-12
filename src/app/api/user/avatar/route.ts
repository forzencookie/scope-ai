/**
 * User Avatar API
 *
 * POST: Upload a new avatar image
 */

import { NextRequest } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { uploadAvatarFile } from '@/services/upload-service'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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
            return ApiResponse.badRequest('File must be an image (JPEG, PNG, WebP, or GIF)')
        }

        if (file.size > MAX_SIZE) {
            return ApiResponse.badRequest('File must be under 2MB')
        }

        const result = await uploadAvatarFile(file, auth.userId)

        if (!result.success) {
            return ApiResponse.serverError(result.error)
        }

        return Response.json({ avatar_url: result.url })
    } catch (error) {
        console.error('[Avatar API] Upload error:', error)
        return ApiResponse.serverError('Failed to upload avatar')
    }
}
