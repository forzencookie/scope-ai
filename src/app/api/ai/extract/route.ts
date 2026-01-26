/**
 * General AI Document Extraction API
 * 
 * Accepts an image/PDF and uses OpenAI Vision to extract document data.
 * Supports: receipts, supplier_invoices, customer_invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

function getOpenAIClient() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
    })
}

const EXTRACTION_PROMPTS: Record<string, string> = {
    supplier_invoice: `You are an OCR system specialized in Swedish supplier invoices (leverantörsfakturor).
Extract data from the invoice image and return JSON:
{
    "supplier": "Company/vendor name",
    "invoiceNumber": "Invoice number (fakturanummer)",
    "ocr": "OCR number if present",
    "issueDate": "YYYY-MM-DD issue date",
    "dueDate": "YYYY-MM-DD due date (förfallodatum)",
    "amount": numeric amount excluding VAT in SEK,
    "vatAmount": numeric VAT amount in SEK (moms),
    "totalAmount": numeric total amount including VAT,
    "category": "Category suggestion",
    "confidence": 0-100 overall confidence
}

Categories: Kontorsmaterial, Programvara, Konsulttjänster, Hyra, Inköp material, IT-utrustning, Övriga kostnader

Swedish invoice hints:
- "Fakturanr" or "Fakturanummer" = invoice number
- "OCR" = payment reference
- "Förfallodatum" = due date
- "Fakturadatum" = issue date
- "Moms" or "Mervärdesskatt" = VAT
- "Att betala" or "Summa" = total amount

Return ONLY valid JSON, no markdown.`,

    receipt: `You are an OCR system specialized in Swedish receipts (kvitton).
Extract data from the receipt image and return JSON:
{
    "supplier": "Store/vendor name",
    "date": "YYYY-MM-DD",
    "amount": numeric total amount in SEK including VAT,
    "vatAmount": numeric VAT amount in SEK,
    "category": "Category suggestion",
    "confidence": 0-100 overall confidence
}

Categories: Kontorsmaterial, Programvara, Resekostnader, Representation, IT-utrustning, Övriga kostnader

Return ONLY valid JSON, no markdown.`,

    customer_invoice: `You are an OCR system specialized in Swedish customer invoices.
Extract data from the invoice image and return JSON:
{
    "customer": "Customer name",
    "invoiceNumber": "Invoice number",
    "issueDate": "YYYY-MM-DD",
    "dueDate": "YYYY-MM-DD",
    "amount": numeric amount excluding VAT,
    "vatAmount": numeric VAT amount,
    "totalAmount": numeric total amount,
    "confidence": 0-100 overall confidence
}

Return ONLY valid JSON, no markdown.`
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const documentType = (formData.get('type') as string) || 'receipt'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Check if OpenAI is configured
        if (!process.env.OPENAI_API_KEY) {
            console.log('[AI Extract] OpenAI not configured, returning mock data')
            // Return mock data for development
            return NextResponse.json(getMockData(documentType))
        }

        console.log(`[AI Extract] Processing ${documentType}: ${file.name}, size: ${file.size}`)

        // Convert file to base64 for OpenAI Vision API
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mimeType = file.type || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64}`

        // Get the appropriate prompt
        const systemPrompt = EXTRACTION_PROMPTS[documentType] || EXTRACTION_PROMPTS.receipt

        // Call OpenAI Vision API
        const openai = getOpenAIClient()
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: dataUrl,
                                detail: 'high'
                            }
                        },
                        {
                            type: 'text',
                            text: 'Extract all relevant data from this document.'
                        }
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.1,
        })

        const content = response.choices[0]?.message?.content || '{}'
        
        // Parse the JSON response
        let extractedData
        try {
            // Clean up markdown code blocks if present
            const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            extractedData = JSON.parse(cleanedContent)
        } catch (parseError) {
            console.error('[AI Extract] Failed to parse response:', content)
            return NextResponse.json({ 
                error: 'Failed to parse AI response',
                raw: content 
            }, { status: 500 })
        }

        console.log('[AI Extract] Extracted:', extractedData)

        return NextResponse.json({
            success: true,
            ...extractedData
        })
    } catch (error) {
        console.error('[AI Extract] Error:', error)
        return NextResponse.json({ 
            error: 'Extraction failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

function getMockData(documentType: string) {
    // Return realistic mock data for development
    switch (documentType) {
        case 'supplier_invoice':
            return {
                success: true,
                supplier: 'Exempelföretag AB',
                invoiceNumber: 'F-' + Math.floor(10000 + Math.random() * 90000),
                ocr: Math.floor(100000000 + Math.random() * 900000000).toString(),
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                amount: Math.floor(5000 + Math.random() * 20000),
                vatAmount: Math.floor(1250 + Math.random() * 5000),
                category: 'Konsulttjänster',
                confidence: 85
            }
        case 'receipt':
            return {
                success: true,
                supplier: 'Butik AB',
                date: new Date().toISOString().split('T')[0],
                amount: Math.floor(100 + Math.random() * 1000),
                vatAmount: Math.floor(25 + Math.random() * 250),
                category: 'Kontorsmaterial',
                confidence: 90
            }
        default:
            return {
                success: true,
                confidence: 0
            }
    }
}
