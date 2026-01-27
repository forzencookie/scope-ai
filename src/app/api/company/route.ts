/**
 * Company API
 * 
 * GET: Fetch the authenticated user's company info
 * PUT: Update/create company info for the authenticated user
 */

import { NextRequest } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { companyService, CompanyUpdate } from '@/services/company-service'

/**
 * GET /api/company
 * Returns the company info for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        const company = await companyService.getByUserId(auth.userId)

        if (!company) {
            // Return empty but successful response if no company yet
            return Response.json({ company: null })
        }

        return Response.json({ company })
    } catch (error) {
        console.error('[Company API] GET error:', error)
        return ApiResponse.serverError('Failed to fetch company info')
    }
}

/**
 * PUT /api/company
 * Creates or updates company info for the authenticated user
 */
export async function PUT(request: NextRequest) {
    try {
        const auth = await verifyAuth(request)
        if (!auth) {
            return ApiResponse.unauthorized('Authentication required')
        }

        let body: unknown
        try {
            body = await request.json()
        } catch {
            return ApiResponse.badRequest('Invalid JSON body')
        }

        // Validate required fields
        const data = body as CompanyUpdate & { name?: string }
        if (!data || typeof data !== 'object') {
            return ApiResponse.badRequest('Request body must be an object')
        }

        // For new companies, name is required
        const existing = await companyService.getByUserId(auth.userId)
        if (!existing && !data.name) {
            return ApiResponse.badRequest('Company name is required')
        }

        // Upsert the company
        const company = await companyService.upsert(auth.userId, {
            name: data.name || existing?.name || 'Mitt Företag',
            ...data,
        })

        if (!company) {
            return ApiResponse.serverError('Failed to save company info')
        }

        return Response.json({ company, created: !existing })
    } catch (error) {
        console.error('[Company API] PUT error:', error)
        return ApiResponse.serverError('Failed to save company info')
    }
}
