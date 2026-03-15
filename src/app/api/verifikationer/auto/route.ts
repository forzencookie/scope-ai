/**
 * Auto-Verifikation Proposal Endpoint
 *
 * POST — Takes pending items + accountingMethod, returns AI-generated
 * verifikation proposals. Pre-calculated entries (payslips, dividends)
 * are passed through; transactions and invoices are categorized by AI.
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { verifyAuth, ApiResponse } from '@/lib/database/auth'
import { basAccounts } from '@/data/accounts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PendingBookingItem {
  type: 'pending_booking'
  id: string
  sourceType: string
  description: string
  proposedEntries: VerificationEntryInput[]
  proposedDate: string
  proposedSeries: string
}

interface TransactionItem {
  type: 'transaction'
  id: string
  name: string
  amount: number
  date: string
  description?: string
}

interface CustomerInvoiceItem {
  type: 'customer_invoice'
  id: string
  customerName: string
  totalAmount: number
  vatRate?: number
  invoiceNumber?: string
  date: string
}

interface SupplierInvoiceItem {
  type: 'supplier_invoice'
  id: string
  supplierName: string
  totalAmount: number
  vatRate?: number
  invoiceNumber?: string
  date: string
}

type PendingItem =
  | PendingBookingItem
  | TransactionItem
  | CustomerInvoiceItem
  | SupplierInvoiceItem

interface AutoVerifikationRequest {
  items: PendingItem[]
  accountingMethod: 'cash' | 'invoice'
}

interface VerificationEntryInput {
  account: string
  debit: number
  credit: number
  description?: string
}

export interface VerifikationProposal {
  tempId: string
  sourceType: string
  sourceId: string
  date: string
  description: string
  series: string
  entries: VerificationEntryInput[]
  reasoning: string
  confidence: number
  needsReview: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
  })
}

/** Build a compact account list for the AI system prompt */
function buildAccountContext(): string {
  const common = basAccounts.filter((a) => a.isCommon)
  const list = (common.length > 0 ? common : basAccounts.slice(0, 80))
    .map((a) => `${a.number} ${a.name}`)
    .join('\n')
  return list
}

/** Pass through pre-calculated pending bookings without AI */
function passThroughPendingBooking(item: PendingBookingItem): VerifikationProposal {
  return {
    tempId: `pb-${item.id}`,
    sourceType: item.sourceType,
    sourceId: item.id,
    date: item.proposedDate,
    description: item.description,
    series: item.proposedSeries || 'A',
    entries: item.proposedEntries,
    reasoning: 'Förberäknade poster — inga AI-ändringar.',
    confidence: 100,
    needsReview: false,
  }
}

// ---------------------------------------------------------------------------
// AI categorization for transactions + invoices
// ---------------------------------------------------------------------------

interface AIProposalResult {
  proposals: Array<{
    itemIndex: number
    description: string
    series: string
    entries: VerificationEntryInput[]
    reasoning: string
    confidence: number
  }>
}

async function categorizeWithAI(
  items: PendingItem[],
  accountingMethod: 'cash' | 'invoice',
  accounts: string,
): Promise<AIProposalResult> {
  const openai = getOpenAIClient()

  const itemDescriptions = items.map((item, i) => {
    switch (item.type) {
      case 'transaction':
        return `[${i}] Banktransaktion: "${item.name}", ${item.amount} kr, ${item.date}${item.description ? ` — ${item.description}` : ''}`
      case 'customer_invoice':
        return `[${i}] Kundfaktura #${item.invoiceNumber || '?'}: ${item.customerName}, ${item.totalAmount} kr, moms ${item.vatRate ?? 25}%, ${item.date}`
      case 'supplier_invoice':
        return `[${i}] Leverantörsfaktura #${item.invoiceNumber || '?'}: ${item.supplierName}, ${item.totalAmount} kr, moms ${item.vatRate ?? 25}%, ${item.date}`
      default:
        return `[${i}] Okänd post`
    }
  })

  const cashNote =
    accountingMethod === 'cash'
      ? 'Kassametoden: Kundfordringar (1510) och leverantörsskulder (2440) ska INTE användas. Använd bank (1930) direkt.'
      : 'Fakturametoden: Kundfakturor ska debiteras 1510 (Kundfordringar). Leverantörsfakturor ska krediteras 2440 (Leverantörsskulder).'

  const systemPrompt = `Du är en svensk bokföringsassistent. Du skapar verifikationsförslag för poster som ska bokföras.

REGLER:
- Alla verifikationer MÅSTE balansera (total debet = total kredit).
- ${cashNote}
- Moms (25%): utgående 2610, ingående 2641. Moms 12%: 2620/2642. Moms 6%: 2630/2643.
- Serie: A = försäljning/intäkt, B = inköp/kostnad, L = lön
- Bankkonto: 1930

Vanliga BAS-konton:
${accounts}

Svara med JSON i exakt detta format:
{
  "proposals": [
    {
      "itemIndex": 0,
      "description": "Kort bokföringsbeskrivning",
      "series": "A",
      "entries": [
        { "account": "1930", "debit": 1250, "credit": 0, "description": "Bank" },
        { "account": "3001", "debit": 0, "credit": 1000, "description": "Försäljning" },
        { "account": "2610", "debit": 0, "credit": 250, "description": "Utgående moms 25%" }
      ],
      "reasoning": "Kort motivering",
      "confidence": 85
    }
  ]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.1,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Skapa verifikationsförslag för följande ${items.length} poster:\n\n${itemDescriptions.join('\n')}`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    return { proposals: [] }
  }

  try {
    return JSON.parse(content) as AIProposalResult
  } catch {
    console.error('Failed to parse AI response:', content)
    return { proposals: [] }
  }
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return ApiResponse.unauthorized()
  }

  try {
    const body: AutoVerifikationRequest = await request.json()
    const { items, accountingMethod } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ proposals: [] })
    }

    const proposals: VerifikationProposal[] = []

    // Separate pre-calculated pending bookings from items needing AI
    const passThrough: PendingBookingItem[] = []
    const needsAI: PendingItem[] = []

    for (const item of items) {
      if (item.type === 'pending_booking') {
        passThrough.push(item)
      } else {
        needsAI.push(item)
      }
    }

    // 1. Pass through pre-calculated entries
    for (const item of passThrough) {
      proposals.push(passThroughPendingBooking(item))
    }

    // 2. AI categorize remaining items
    if (needsAI.length > 0) {
      const accounts = buildAccountContext()
      const aiResult = await categorizeWithAI(needsAI, accountingMethod, accounts)

      for (const p of aiResult.proposals) {
        const source = needsAI[p.itemIndex]
        if (!source) continue

        proposals.push({
          tempId: `ai-${source.type}-${source.id}`,
          sourceType: source.type,
          sourceId: source.id,
          date: 'date' in source ? source.date : new Date().toISOString().split('T')[0],
          description: p.description,
          series: p.series || 'A',
          entries: p.entries,
          reasoning: p.reasoning,
          confidence: p.confidence,
          needsReview: p.confidence < 80,
        })
      }
    }

    return NextResponse.json({ proposals })
  } catch (error) {
    console.error('Auto-verifikation failed:', error)
    const message = error instanceof Error ? error.message : 'Auto-verifikation misslyckades'
    return ApiResponse.serverError(message)
  }
}
