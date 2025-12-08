import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `Du är en hjälpsam AI-assistent för bokföring och ekonomi, specialiserad på svenska aktiebolag (AB). Du hjälper användare med:

- Bokföring och redovisning
- Momsdeklarationer och skattefrågor
- Lönehantering, AGI och arbetsgivaravgifter
- Årsredovisning och rapporter
- Företagsstatistik och analys
- Fakturering och transaktioner
- 3:12-regler och utdelning

Svara alltid på svenska om inte användaren skriver på engelska. Var koncis men informativ. Använd markdown för formatering när det passar (listor, fetstil, etc).`

export async function POST(request: NextRequest) {
    try {
        const { messages } = await request.json()

        if (!process.env.OPENAI_API_KEY) {
            return new Response('OpenAI API key not configured', { status: 500 })
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages
            ],
            temperature: 0.7,
            max_tokens: 1000,
            stream: true,
        })

        // Create a readable stream
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of response) {
                    const text = chunk.choices[0]?.delta?.content || ''
                    if (text) {
                        controller.enqueue(encoder.encode(text))
                    }
                }
                controller.close()
            },
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        })
    } catch (error) {
        console.error('Chat API error:', error)
        return new Response('Failed to get AI response', { status: 500 })
    }
}
