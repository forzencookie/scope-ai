/**
 * Contact Form API
 * 
 * Handles contact form submissions from the landing page.
 * In production, this would send emails and/or store in a CRM.
 */

import { NextRequest, NextResponse } from 'next/server'

interface ContactFormData {
    name: string
    email: string
    company?: string
    message: string
}

export async function POST(request: NextRequest) {
    try {
        const body: ContactFormData = await request.json()

        // Validate required fields
        if (!body.name?.trim()) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }
        if (!body.email?.trim() || !body.email.includes('@')) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
        }
        if (!body.message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 })
        }

        // Log the contact request
        console.log('[Contact API] New contact form submission:')
        console.log(`  Name: ${body.name}`)
        console.log(`  Email: ${body.email}`)
        console.log(`  Company: ${body.company || 'Not provided'}`)
        console.log(`  Message: ${body.message.substring(0, 100)}...`)

        // Check if email service is configured
        const hasEmailService = !!process.env.RESEND_API_KEY || !!process.env.SENDGRID_API_KEY

        if (hasEmailService) {
            // TODO: Integrate with email service
            // To enable email notifications:
            // 1. Install resend: npm install resend
            // 2. Set RESEND_API_KEY in environment
            // 3. Uncomment the email sending code below
            //
            // Example with Resend:
            // import { Resend } from 'resend'
            // const resend = new Resend(process.env.RESEND_API_KEY)
            // await resend.emails.send({
            //     from: 'Scope <noreply@scope.se>',
            //     to: ['kontakt@scope.se'],
            //     replyTo: body.email,
            //     subject: `Ny kontaktförfrågan från ${body.name}`,
            //     html: `<h2>Ny kontaktförfrågan</h2>...`
            // })
            console.log('[Contact API] Email service configured but not yet implemented')
        }

        // TODO: Store in database or CRM
        // await db.contactSubmissions.create({
        //     name: body.name,
        //     email: body.email,
        //     company: body.company,
        //     message: body.message,
        //     createdAt: new Date()
        // })

        return NextResponse.json({
            success: true,
            message: 'Contact form submitted successfully'
        })
    } catch (error) {
        console.error('[Contact API] Error:', error)
        return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 })
    }
}
