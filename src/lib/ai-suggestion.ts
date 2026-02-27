/**
 * AI Booking Suggestion Helper
 *
 * Fetches a booking suggestion from /api/chat/booking and parses the
 * streaming response into an AISuggestion object.
 */

import type { AISuggestion } from '@/types'

interface TransactionContext {
  id: string
  name: string
  amount: string | number
  date: string
  account?: string
}

/**
 * Fetch an AI booking suggestion for a transaction.
 * Calls the existing /api/chat/booking endpoint, collects the streamed
 * response, and parses the structured fields (Kategori, Debetkonto, Kreditkonto).
 */
export async function fetchAiBookingSuggestion(
  transaction: TransactionContext
): Promise<AISuggestion | null> {
  try {
    const response = await fetch('/api/chat/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction,
        messages: [
          {
            role: 'user',
            content: `Bokför: "${transaction.name}", belopp: ${transaction.amount} kr, datum: ${transaction.date}`,
          },
        ],
      }),
    })

    if (!response.ok) return null

    // Collect the streamed text
    const reader = response.body?.getReader()
    if (!reader) return null

    const decoder = new TextDecoder()
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      text += decoder.decode(value, { stream: true })
    }

    return parseAiResponse(text)
  } catch {
    return null
  }
}

/**
 * Parse the AI response text into an AISuggestion.
 *
 * Expected format:
 * - **Kategori:** IT-tjänster
 * - **Debetkonto:** 6540
 * - **Kreditkonto:** 1930
 * Some reasoning text...
 */
function parseAiResponse(text: string): AISuggestion | null {
  const categoryMatch = text.match(/\*?\*?Kategori:?\*?\*?\s*(.+)/i)
  const debitMatch = text.match(/\*?\*?Debetkonto:?\*?\*?\s*(\d{4})/i)
  const creditMatch = text.match(/\*?\*?Kreditkonto:?\*?\*?\s*(\d{4})/i)

  const category = categoryMatch?.[1]?.trim() || ''
  const account = debitMatch?.[1]?.trim() || ''

  if (!account) return null

  // Extract reasoning: everything after the structured fields
  const lines = text.split('\n')
  const reasoningLines = lines.filter(
    (line) =>
      !line.match(/\*?\*?(Kategori|Debetkonto|Kreditkonto):?\*?\*?/i) &&
      line.trim().length > 0
  )
  const reasoning = reasoningLines.join(' ').trim()

  return {
    category,
    account,
    confidence: 75, // Default confidence for AI suggestions
    reasoning: reasoning || undefined,
  }
}
