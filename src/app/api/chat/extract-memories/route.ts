/**
 * Post-Conversation Memory Extraction API
 *
 * POST /api/chat/extract-memories
 * Body: { conversationId: string, companyId: string }
 *
 * Analyzes a completed conversation and extracts user-specific facts
 * (decisions, preferences, pending considerations) into the user_memory table.
 *
 * Called after a conversation ends or when the user starts a new conversation.
 */

import { NextRequest } from 'next/server'
import { getAuthContext, verifyAuth, ApiResponse } from '@/lib/database/auth'
import { userMemoryService } from '@/services/user-memory-service'

// =============================================================================
// Extraction Prompt
// =============================================================================

const EXTRACTION_PROMPT = `Du är en minnesextraherare för en svensk bokföringsapp. Analysera konversationen nedan och extrahera viktiga fakta om användaren/företaget.

Extrahera BARA saker som är värda att komma ihåg för framtida konversationer:

1. **Beslut** (category: "decision") — Åtgärder som tagits
   Exempel: "Tog utdelning på 120 000 kr i december 2025", "Valde att inte anställa utan fortsätter med konsulter"

2. **Preferenser** (category: "preference") — Användarens stil/önskemål
   Exempel: "Föredrar korta svar utan tekniska detaljer", "Vill alltid se momsbelopp separat"

3. **Pågående** (category: "pending") — Saker under övervägande
   Exempel: "Funderar på att anställa en utvecklare Q2 2026", "Överväger att byta bokföringsmetod"

Svara ENBART med JSON-array. Om inget är värt att minnas, svara med tom array [].
Varje objekt: { "content": "...", "category": "decision|preference|pending", "confidence": 0.0-1.0 }

Viktigt:
- Extrahera INTE trivia, hälsningsfraser, eller tekniska frågor om appen
- Extrahera INTE saker som AI:n redan vet från databasen (saldon, antal transaktioner etc)
- Fokusera på ANVÄNDARENS specifika situation och beslut
- confidence 1.0 = explicit uttalat, 0.7 = starkt antydd, 0.5 = svagt antydd`

// =============================================================================
// Handler
// =============================================================================

export async function POST(request: NextRequest) {
    try {
        const ctx = await getAuthContext()
        if (!ctx) {
            return ApiResponse.unauthorized('Authentication required')
        }
        const { supabase, userId } = ctx

        const { conversationId, companyId } = await request.json()
        if (!conversationId || !companyId) {
            return ApiResponse.badRequest('conversationId and companyId are required')
        }

        // Verify conversation ownership
        const { data: conv } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conversationId)
            .eq('user_id', userId)
            .single()

        if (!conv) {
            return ApiResponse.notFound('Conversation not found')
        }

        // Get conversation messages
        const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
        if (!messages || messages.length < 2) {
            // Too short to extract anything meaningful
            return Response.json({ extracted: 0, memories: [] })
        }

        // Build a condensed transcript (skip tool calls/results for efficiency)
        const transcript = messages
            .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
            .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Användare' : 'Scooby'}: ${(m.content || '').slice(0, 500)}`)
            .join('\n\n')

        // Skip if transcript is too short
        if (transcript.length < 100) {
            return Response.json({ extracted: 0, memories: [] })
        }

        // Call OpenAI for extraction (use fast model, non-streaming)
        const { default: OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            temperature: 0.3,
            messages: [
                { role: 'system', content: EXTRACTION_PROMPT },
                { role: 'user', content: `Konversation:\n\n${transcript.slice(0, 8000)}` },
            ],
            response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0]?.message?.content
        if (!raw) {
            return Response.json({ extracted: 0, memories: [] })
        }

        // Parse extracted memories
        let extracted: Array<{ content: string; category: string; confidence: number }>
        try {
            const parsed = JSON.parse(raw)
            // Handle both { memories: [...] } and direct [...] formats
            extracted = Array.isArray(parsed) ? parsed : (parsed.memories || parsed.items || [])
        } catch {
            console.error('[ExtractMemories] Failed to parse response:', raw)
            return Response.json({ extracted: 0, memories: [] })
        }

        // Validate and save each memory
        const validCategories = ['decision', 'preference', 'pending']
        const saved: Array<{ id: string; content: string; category: string }> = []

        for (const item of extracted) {
            if (!item.content || !validCategories.includes(item.category)) continue
            if (item.confidence < 0.5) continue // Skip low-confidence extractions

            const memory = await userMemoryService.addMemory({
                companyId,
                content: item.content,
                category: item.category as 'decision' | 'preference' | 'pending',
                confidence: item.confidence,
                sourceConversationId: conversationId,
                expiresInDays: item.category === 'pending' ? 30 : undefined,
            })

            if (memory) {
                saved.push({ id: memory.id, content: memory.content, category: memory.category })
            }
        }

        return Response.json({
            extracted: saved.length,
            memories: saved,
        })
    } catch (error) {
        console.error('[ExtractMemories] Error:', error)
        return ApiResponse.serverError('Failed to extract memories')
    }
}
