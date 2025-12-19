import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/server-db'
import type { InboxItem } from '@/types'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        console.log('[Upload] Processing file:', file.name, file.type, file.size)

        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')

        //  Determine mime type
        let mimeType = file.type
        if (!mimeType) {
            if (file.name.endsWith('.pdf')) mimeType = 'application/pdf'
            else if (file.name.endsWith('.png')) mimeType = 'image/png'
            else if (file.name.endsWith('.jpg') || file.name.endsWith('.jpeg')) mimeType = 'image/jpeg'
        }

        console.log('[Upload] Using GPT Vision to read invoice...')

        // Use GPT Vision to extract invoice data
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are reading an invoice or receipt document. Extract ALL text and information you can see.

Return a plain text representation of what you see, including:
- Company name/sender
- Invoice/receipt number
- Date
- Amount/total
- Line items/description
- Payment info (OCR, bankgiro, etc.)
- Any other relevant text

Format it as a readable email body.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        })

        const extractedText = response.choices[0]?.message?.content || 'Could not extract text'

        console.log('[Upload] Extracted text:', extractedText.substring(0, 200) + '...')

        // Extract sender/company name from the text
        const senderMatch = extractedText.match(/(?:From|Sender|Company|Företag):\s*([^\n]+)/i) ||
            extractedText.match(/^([A-Z][^\n]{2,50})/m) // First capitalized line
        const sender = senderMatch?.[1]?.trim() || 'Unknown Sender'

        console.log('[Upload] Detected sender:', sender)

        // Create inbox item with extracted text (formatted as email)
        const newItem: InboxItem = {
            id: `upload-${Date.now()}`,
            sender: sender,
            title: `Uploaded: ${file.name}`,
            description: extractedText,
            date: new Date().toLocaleDateString('sv-SE'),
            timestamp: new Date(),
            category: 'other', // AI will categorize
            read: false,
            starred: false,
            aiSuggestion: null,
            aiStatus: 'pending', // Will be processed by AI
        }

        await db.addInboxItem(newItem)

        console.log('[Upload] Created inbox item:', newItem.id)

        // Trigger AI processing
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/process-inbox`, {
            method: 'POST'
        })

        return NextResponse.json({ success: true, item: newItem })
    } catch (error) {
        console.error('[Upload] Error:', error)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}
