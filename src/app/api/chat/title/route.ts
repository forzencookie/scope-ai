import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'

function getOpenAIClient() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })
}

export async function POST(req: NextRequest) {
    // Verify authentication
    const auth = await verifyAuth(req)
    if (!auth) {
        return ApiResponse.unauthorized('Authentication required')
    }

    try {
        const { messages } = await req.json()

        // Take first user message for context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstUserMessage = messages.find((m: any) => m.role === 'user')
        if (!firstUserMessage) {
            return NextResponse.json({ title: "Ny konversation" })
        }

        const openai = getOpenAIClient()
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "Generate a short, concise, descriptive title (max 4-5 words) for this conversation based on the user's input. Do not use quotes. Language: Swedish. If the input is unclear or nonsense, return 'Ny konversation'. NEVER return 'Otydlig'."
                },
                {
                    role: "user",
                    content: firstUserMessage.content
                }
            ],
            max_tokens: 30,
        })

        const title = completion.choices[0].message.content?.trim() || "Ny konversation"
        // Remove surrounding quotes if present
        let cleanTitle = title.replace(/^["']|["']$/g, '')

        if (cleanTitle.toLowerCase().includes('otydlig') || cleanTitle.toLowerCase() === 'unclear') {
            cleanTitle = "Ny konversation"
        }

        return NextResponse.json({ title: cleanTitle })
    } catch (error) {
        console.error('Title generation failed:', error)
        return NextResponse.json({ title: null }, { status: 500 })
    }
}
