/**
 * Transaction Import API
 * 
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'
import { randomUUID } from 'crypto'
import OpenAI from 'openai'

function getOpenAIClient() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 30000,
    })
}

interface ZRapportData {
    date: string
    totalSales: number
    cashAmount: number
    cardAmount: number
    transactionCount: number
    vatAmount: number
}

async function parseZRapport(base64Data: string): Promise<ZRapportData | null> {
    try {
        const openai = getOpenAIClient()
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Du är en OCR-motor som läser Z-rapporter (dagsavslut) från kassasystem. Returnera endast JSON.'
                },
                {
                    role: 'user',
                    content: `Läs denna Z-rapport och extrahera:
{
  "date": "YYYY-MM-DD",
  "totalSales": nummer (total försäljning exkl moms),
  "cashAmount": nummer (kontantbetalningar),
  "cardAmount": nummer (kortbetalningar),
  "transactionCount": nummer (antal transaktioner/kvitton),
  "vatAmount": nummer (total moms)
}

Returnera endast valid JSON. Om något värde saknas, använd 0.`
                }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) return null

        return JSON.parse(content) as ZRapportData
    } catch (error) {
        console.error('[Z-rapport Parser Error]', error)
        return null
    }
}

interface CSVRow {
    date: string
    description: string
    amount: number
    account?: string
}

interface GenericDocumentTransaction {
    date: string
    description: string
    amount: number
    vat?: number
}

async function parseGenericDocument(base64Data: string, mimeType: string): Promise<GenericDocumentTransaction[]> {
    try {
        const openai = getOpenAIClient()
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Du är en OCR-motor som läser kvitton, fakturor och andra ekonomiska dokument. Extrahera alla transaktioner du hittar. Returnera endast JSON.'
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Läs detta dokument och extrahera alla transaktioner. Returnera JSON i detta format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "beskrivning av transaktionen",
      "amount": nummer (positivt för inkomst, negativt för utgift),
      "vat": nummer (momsbelopp, 0 om okänt)
    }
  ]
}

Om du inte kan läsa dokumentet eller hittar inga transaktioner, returnera: {"transactions": []}
Om datum saknas, använd dagens datum.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${mimeType};base64,${base64Data}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) return []

        const parsed = JSON.parse(content)
        return (parsed.transactions || []) as GenericDocumentTransaction[]
    } catch (error) {
        console.error('[Generic Document Parser Error]', error)
        return []
    }
}

function getFileMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop() || ''
    const mimeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        'bmp': 'image/bmp',
    }
    return mimeMap[ext] || 'application/octet-stream'
}

function isSpreadsheetFile(fileName: string): boolean {
    const ext = fileName.toLowerCase().split('.').pop() || ''
    return ['csv', 'xlsx', 'xls'].includes(ext)
}

function parseCSV(text: string): CSVRow[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].toLowerCase().split(/[,;\t]/).map(h => h.trim())
    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/[,;\t]/).map(v => v.trim().replace(/^"|"$/g, ''))

        const dateIdx = headers.findIndex(h => h.includes('datum') || h === 'date')
        const descIdx = headers.findIndex(h => h.includes('beskrivning') || h.includes('description') || h.includes('name'))
        const amountIdx = headers.findIndex(h => h.includes('belopp') || h.includes('amount') || h.includes('summa'))
        const accountIdx = headers.findIndex(h => h.includes('konto') || h.includes('account'))

        if (dateIdx >= 0 && amountIdx >= 0) {
            rows.push({
                date: values[dateIdx] || new Date().toISOString().split('T')[0],
                description: values[descIdx] || 'Importerad transaktion',
                amount: parseFloat(values[amountIdx]?.replace(/[^\d.-]/g, '') || '0'),
                account: accountIdx >= 0 ? values[accountIdx] : undefined
            })
        }
    }

    return rows
}

export async function POST(request: NextRequest) {
    try {
        const userDb = await createUserScopedDb();
        
        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const createdTransactions: any[] = []

        if (type === 'z-rapport') {
            // For Z-rapport: Parse image/PDF via GPT
            const buffer = await file.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')

            const data = await parseZRapport(base64)

            if (!data) {
                return NextResponse.json({ error: 'Could not parse Z-rapport' }, { status: 400 })
            }

            // Create transactions for cash and card sales
            const baseId = `zr-${Date.now()}`

            if (data.cashAmount > 0) {
                const cashTx = await userDb.transactions.create({
                    id: `${baseId}-cash`,
                    description: 'Kontantförsäljning (Z-rapport)',
                    name: 'Kontantförsäljning (Z-rapport)',
                    amount: String(data.cashAmount),
                    amount_value: data.cashAmount,
                    date: data.date,
                    status: 'pending',
                    source: 'z-rapport',
                })
                if (cashTx) createdTransactions.push(cashTx)
            }

            if (data.cardAmount > 0) {
                const cardTx = await userDb.transactions.create({
                    id: `${baseId}-card`,
                    description: 'Kortförsäljning (Z-rapport)',
                    name: 'Kortförsäljning (Z-rapport)',
                    amount: String(data.cardAmount),
                    amount_value: data.cardAmount,
                    date: data.date,
                    status: 'pending',
                    source: 'z-rapport',
                })
                if (cardTx) createdTransactions.push(cardTx)
            }

        } else if (type === 'csv') {
            // For CSV: Parse text directly
            const text = await file.text()
            const rows = parseCSV(text)

            for (const row of rows) {
                const tx = await userDb.transactions.create({
                    id: randomUUID(),
                    name: row.description,
                    description: row.description,
                    amount: String(row.amount),
                    amount_value: Number(row.amount),
                    date: row.date,
                    status: 'pending',
                    source: 'csv-import',
                })
                if (tx) createdTransactions.push(tx)
            }
        } else if (type === 'ocr') {
            // Auto-detect: spreadsheet files → CSV parser, images/PDFs → GPT OCR
            const fileName = file.name || ''

            if (isSpreadsheetFile(fileName)) {
                // Route spreadsheet files to CSV parser
                const text = await file.text()
                const rows = parseCSV(text)

                for (const row of rows) {
                    const tx = await userDb.transactions.create({
                        id: randomUUID(),
                        name: row.description,
                        description: row.description,
                        amount: String(row.amount),
                        amount_value: Number(row.amount),
                        date: row.date,
                        status: 'pending',
                        source: 'ocr-import',
                    })
                    if (tx) createdTransactions.push(tx)
                }
            } else {
                // Image or PDF → GPT-4o-mini OCR
                const buffer = await file.arrayBuffer()
                const base64 = Buffer.from(buffer).toString('base64')
                const mimeType = file.type || getFileMimeType(fileName)

                const transactions = await parseGenericDocument(base64, mimeType)

                if (transactions.length === 0) {
                    return NextResponse.json({ error: 'Kunde inte läsa några transaktioner från dokumentet' }, { status: 400 })
                }

                for (const t of transactions) {
                    const tx = await userDb.transactions.create({
                        id: randomUUID(),
                        name: t.description,
                        description: t.description,
                        amount: String(t.amount),
                        amount_value: Number(t.amount),
                        date: t.date,
                        status: 'pending',
                        source: 'ocr-import',
                    })
                    if (tx) createdTransactions.push(tx)
                }
            }
        } else {
            return NextResponse.json({ error: 'Unknown import type' }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            imported: createdTransactions.length,
            transactions: createdTransactions
        })

    } catch (error) {
        console.error('Transaction import error:', error)
        return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }
}
