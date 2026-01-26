import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000,
    maxRetries: 2,
  })
}

const SYSTEM_PROMPT = `Du är en bokföringsassistent. Prata naturligt och kortfattat, som en kollega - inte formellt.

LÄS BELOPPET:
- Positivt belopp = INKOMST (pengar in)
- Negativt belopp = UTGIFT (pengar ut)

Svara ALLTID med detta format (exakt):
- **Kategori:** [namn]
- **Debetkonto:** [4 siffror]
- **Kreditkonto:** [4 siffror]

Sen en kort förklaring, typ 1-2 meningar max. Skriv som du pratar, t.ex:
- "Det här ser ut som en konsultintäkt, så jag bokför det mot 3040."
- "Typisk programvarukostnad, 5420 funkar bra här."
- "Spotify brukar vara IT-tjänster, 6540."

REGLER:
1. INKOMSTER: Debet 1930, kredit intäktskonto (3010/3040)
2. UTGIFTER: Debet kostnadskonto, kredit 1930

Vanliga konton:
- 1930 Företagskonto
- 3010 Försäljning varor
- 3040 Försäljning tjänster
- 4010 Inköp varor
- 5010 Lokalhyra
- 5410 Förbrukningsinventarier
- 5420 Programvara
- 5800 Resekostnader
- 6071 Representation
- 6110 Kontorsmaterial
- 6212 Mobiltelefon
- 6540 IT-tjänster
- 6570 Bankkostnader

Var tydlig men inte långrandig. Inga formella fraser som "Jag rekommenderar" eller "Baserat på min analys". Bara säg vad det är och varför.`

interface BookingRequest {
  transaction: {
    id: string
    name: string
    amount: string | number
    date: string
    account?: string
  }
  messages: Array<{ role: string; content: string }>
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const auth = await verifyAuth(request)
  if (!auth) {
    return ApiResponse.unauthorized('Authentication required')
  }

  try {
    const body: BookingRequest = await request.json()
    const { transaction, messages } = body

    if (!transaction || !messages) {
      return new Response(JSON.stringify({ error: 'Missing transaction or messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build messages with system prompt and transaction context
    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const openai = getOpenAIClient()
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      stream: true,
      temperature: 0.3, // Lower temperature for more consistent bookkeeping
      max_tokens: 500,
    })

    // Create a readable stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(encoder.encode(content))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('Booking chat error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
