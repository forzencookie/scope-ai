import { NextResponse } from 'next/server'
import { db } from '@/lib/server-db'
import { randomUUID } from 'crypto'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
})

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

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

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
                const cashTx = {
                    id: `${baseId}-cash`,
                    name: 'Kontantförsäljning (Z-rapport)',
                    amount: data.cashAmount,
                    date: data.date,
                    account: 'foretagskonto',
                    status: 'pending',
                    source: 'z-rapport',
                    vatAmount: Math.round(data.vatAmount * (data.cashAmount / data.totalSales))
                }
                await db.addTransaction(cashTx)
                createdTransactions.push(cashTx)
            }

            if (data.cardAmount > 0) {
                const cardTx = {
                    id: `${baseId}-card`,
                    name: 'Kortförsäljning (Z-rapport)',
                    amount: data.cardAmount,
                    date: data.date,
                    account: 'foretagskonto',
                    status: 'pending',
                    source: 'z-rapport',
                    vatAmount: Math.round(data.vatAmount * (data.cardAmount / data.totalSales))
                }
                await db.addTransaction(cardTx)
                createdTransactions.push(cardTx)
            }

        } else if (type === 'csv') {
            // For CSV: Parse text directly
            const text = await file.text()
            const rows = parseCSV(text)

            for (const row of rows) {
                const tx = {
                    id: randomUUID(),
                    name: row.description,
                    amount: row.amount,
                    date: row.date,
                    account: row.account || 'foretagskonto',
                    status: 'pending',
                    source: 'csv-import'
                }
                await db.addTransaction(tx)
                createdTransactions.push(tx)
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
