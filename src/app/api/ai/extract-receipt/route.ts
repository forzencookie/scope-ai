/**
 * AI Receipt Extraction API
 * 
 * Accepts a receipt image/PDF and uses OpenAI Vision to extract:
 * - Vendor name
 * - Date
 * - Amount
 * - Category suggestion
 * - Per-field confidence scores
 * 
 * SECURITY: Requires authentication (GPT-4o Vision is expensive)
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'

function getOpenAIClient() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
    })
}

export interface FieldConfidence {
    value: string | number
    confidence: number // 0-100
}

export interface ExtractedReceiptData {
    supplier: FieldConfidence
    date: FieldConfidence
    amount: FieldConfidence
    category: FieldConfidence
    overallConfidence: number
    rawText?: string
}

/**
 * POST /api/ai/extract-receipt
 * 
 * Accepts FormData with 'file' field containing the receipt image
 * Returns extracted receipt data with per-field confidence
 * 
 * SECURITY: Requires authentication
 */
export async function POST(request: NextRequest) {
    // Verify authentication - this endpoint uses expensive GPT-4o Vision API
    const auth = await verifyAuth(request)
    if (!auth) {
        return ApiResponse.unauthorized('Authentication required for AI extraction')
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        console.log(`[Receipt OCR] Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`)

        // Convert file to base64 for OpenAI Vision API
        const bytes = await file.arrayBuffer()
        const base64 = Buffer.from(bytes).toString('base64')
        const mimeType = file.type || 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${base64}`

        // Call OpenAI Vision API
        const openai = getOpenAIClient()
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are an OCR system specialized in Swedish receipts and invoices. 
Extract data from the receipt image and return JSON:
{
    "supplier": { "value": "Company name", "confidence": 0-100 },
    "date": { "value": "YYYY-MM-DD", "confidence": 0-100 },
    "amount": { "value": numeric total amount in SEK (inkl. moms), "confidence": 0-100 },
    "moms": { "value": numeric VAT amount in SEK, "confidence": 0-100 },
    "category": { "value": "Category name", "confidence": 0-100 },
    "overallConfidence": 0-100,
    "rawText": "Key extracted text"
}

Categories: Kontorsmaterial, Programvara, Resekostnader, Representation, IT-utrustning, Övriga kostnader

Swedish receipt hints:
- TOTALT, ATT BETALA, SUMMA = total amount (inkl moms)
- MOMS, Varav moms, Moms 25% = VAT amount
- If moms not explicitly shown, calculate as 20% of total (25% VAT rate means moms = total * 0.2)
- Company name usually at top with org.nr
- Vendor categories: Espresso House/MAX→Representation, IKEA/Clas Ohlson→Kontorsmaterial`
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
                            text: 'Extract all receipt data with confidence scores. Return valid JSON only.'
                        }
                    ]
                }
            ],
            max_tokens: 1000,
            temperature: 0.1,
        })

        const content = response.choices[0]?.message?.content
        if (!content) {
            throw new Error('No response from OpenAI')
        }

        console.log('[Receipt OCR] Raw response:', content)

        // Parse JSON from response (may be wrapped in markdown code block)
        let jsonContent = content
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
            jsonContent = jsonMatch[1].trim()
        }

        const extractedData: ExtractedReceiptData = JSON.parse(jsonContent)

        console.log('[Receipt OCR] Extracted:', {
            supplier: extractedData.supplier,
            amount: extractedData.amount,
            date: extractedData.date,
            category: extractedData.category,
            overallConfidence: extractedData.overallConfidence
        })

        return NextResponse.json({
            success: true,
            data: extractedData
        })

    } catch (error) {
        console.error('[Receipt OCR Error]', error)

        // In production, return an error; in development, provide fallback
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json({
                success: false,
                error: 'Failed to extract receipt data. Please try again.'
            }, { status: 500 })
        }

        // Development fallback with placeholder data
        const fallbackData: ExtractedReceiptData = {
            supplier: { value: 'Okänd leverantör', confidence: 0 },
            date: { value: new Date().toISOString().split('T')[0], confidence: 0 },
            amount: { value: 0, confidence: 0 },
            category: { value: 'Övriga kostnader', confidence: 0 },
            overallConfidence: 0,
            rawText: 'Could not extract - API error'
        }

        return NextResponse.json({
            success: true,
            data: fallbackData,
            warning: 'Extraction failed - using placeholder data'
        })
    }
}
