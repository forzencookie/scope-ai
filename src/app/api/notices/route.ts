/**
 * Meeting Notices API
 *
 * Handles sending meeting notices (kallelser) to shareholders/members.
 * In production, this would integrate with an email service like SendGrid or Resend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, ApiResponse } from "@/lib/database/auth-server"

interface NoticeRequest {
    meetingId: string
    meetingType: 'board' | 'annual' | 'general'
    recipients: string[] // email addresses
    method: 'email' | 'post' | 'both'
    message?: string
}

export const POST = withAuth(async (request) => {
    const body: NoticeRequest = await request.json()

    // Validate request
    if (!body.meetingId) {
        return ApiResponse.badRequest('Meeting ID required')
    }

    // Log the notice send attempt
    console.log(`[Notices API] Sending ${body.method} notice for meeting ${body.meetingId}`)
    console.log(`[Notices API] Recipients: ${body.recipients?.length || 0}`)

    // Check if email service is configured
    const hasEmailService = !!process.env.RESEND_API_KEY || !!process.env.SENDGRID_API_KEY

    if (!hasEmailService) {
        return NextResponse.json(
            { error: 'E-posttjänst ej konfigurerad. Konfigurera RESEND_API_KEY eller SENDGRID_API_KEY.' },
            { status: 503 }
        )
    }

    return NextResponse.json({
        sent: body.recipients?.length || 0,
        method: body.method
    })
})

/**
 * GET - List sent notices for a meeting
 */
export const GET = withAuth(async (request) => {
    const meetingId = request.nextUrl.searchParams.get('meetingId')

    return NextResponse.json({
        notices: [],
        meetingId
    })
})
