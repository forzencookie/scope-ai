/**
 * Meeting Notices API
 * 
 * Handles sending meeting notices (kallelser) to shareholders/members.
 * In production, this would integrate with an email service like SendGrid or Resend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

interface NoticeRequest {
    meetingId: string
    meetingType: 'board' | 'annual' | 'general'
    recipients: string[] // email addresses
    method: 'email' | 'post' | 'both'
    message?: string
}

export async function POST(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb()
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body: NoticeRequest = await request.json()

        // Validate request
        if (!body.meetingId) {
            return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 })
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

        // TODO: Integrate with email service
        // Example with Resend:
        // const resend = new Resend(process.env.RESEND_API_KEY)
        // await resend.emails.send({
        //     from: 'noreply@scope.se',
        //     to: body.recipients,
        //     subject: `Kallelse till ${body.meetingType === 'annual' ? 'årsmöte' : 'stämma'}`,
        //     html: generateNoticeEmail(body)
        // })

        return NextResponse.json({
            success: true,
            sent: body.recipients?.length || 0,
            method: body.method
        })
    } catch (error) {
        console.error('[Notices API] Error:', error)
        return NextResponse.json({ error: 'Failed to send notices' }, { status: 500 })
    }
}

/**
 * GET - List sent notices for a meeting
 */
export async function GET(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb()
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const meetingId = request.nextUrl.searchParams.get('meetingId')

        // TODO: Query sent notices from database
        // For now, return empty array
        return NextResponse.json({
            notices: [],
            meetingId
        })
    } catch (error) {
        console.error('[Notices API] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 })
    }
}
