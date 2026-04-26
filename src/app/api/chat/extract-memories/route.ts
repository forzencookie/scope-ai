/**
 * Post-Conversation Memory Extraction API
 *
 * POST /api/chat/extract-memories
 * Body: { conversationId: string, companyId: string }
 *
 * Two-phase process:
 * 1. EXTRACT — Analyze conversation, pull out decisions/preferences/pending items
 * 2. CONSOLIDATE — If total memories exceed cap, merge duplicates and prune stale ones
 *
 * This keeps Scooby's working memory fresh and under ~500 tokens.
 * Old memories don't disappear — they get merged into consolidated entries.
 */

import { NextResponse } from 'next/server'
import { withAuth, ApiResponse } from "@/lib/database/auth-server"
import { userMemoryService } from '@/services/common'

// Maximum active memories before consolidation triggers
const MEMORY_CAP = 20

// =============================================================================
// Prompts
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

const CONSOLIDATION_PROMPT = `Du är en minneskonsoliderare för en svensk bokföringsapp. Du har fått en lista med minnen om en användare/företag. Listan har blivit för lång.

Konsolidera dem till max ${MEMORY_CAP} poster genom att:
1. **Slå ihop dubbletter** — om två minnen säger samma sak, behåll den bästa formuleringen
2. **Ta bort inaktuella "pending"** — om ett beslut har tagits om samma sak, ta bort "pending"-posten
3. **Prioritera:** preferenser > beslut > pågående (preferenser formar alla framtida svar)
4. **Behåll datumreferenser** — "december 2025", "Q2 2026" etc. är viktiga

Svara ENBART med JSON-array av konsoliderade minnen.
Varje objekt: { "content": "...", "category": "decision|preference|pending", "confidence": 0.0-1.0 }

Maximal längd per minne: 100 tecken. Var koncis.`

// =============================================================================
// Handler
// =============================================================================

export const POST = withAuth(async (request, { supabase, userId }) => {
    try {
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
            return NextResponse.json({ extracted: 0, memories: [] })
        }

        // Build a condensed transcript (skip tool calls/results for efficiency)
        const transcript = messages
            .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
            .map((m) => `${m.role === 'user' ? 'Användare' : 'Scooby'}: ${(m.content || '').slice(0, 500)}`)
            .join('\n\n')

        // Skip if transcript is too short
        if (transcript.length < 100) {
            return NextResponse.json({ extracted: 0, memories: [] })
        }

        // Call OpenAI for extraction (use fast model, non-streaming)
        const { default: OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const completion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            temperature: 0.3,
            messages: [
                { role: 'system', content: EXTRACTION_PROMPT },
                { role: 'user', content: `Konversation:\n\n${transcript.slice(0, 8000)}` },
            ],
            response_format: { type: 'json_object' },
        })

        const raw = completion.choices[0]?.message?.content
        if (!raw) {
            return NextResponse.json({ extracted: 0, memories: [] })
        }

        // Parse extracted memories
        let extracted: Array<{ content: string; category: string; confidence: number }>
        try {
            const parsed = JSON.parse(raw)
            // Handle both { memories: [...] } and direct [...] formats
            extracted = Array.isArray(parsed) ? parsed : (parsed.memories || parsed.items || [])
        } catch {
            console.error('[ExtractMemories] Failed to parse response:', raw)
            return NextResponse.json({ extracted: 0, memories: [] })
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
                sourceMessageId: conversationId,
            })

            if (memory) {
                saved.push({ id: memory.id, content: memory.content, category: memory.category })
            }
        }

        // =================================================================
        // CONSOLIDATE — if over cap, merge and prune
        // =================================================================

        const allMemories = await userMemoryService.getMemoriesForCompany(companyId)

        let consolidated = false
        if (allMemories.length > MEMORY_CAP) {
            try {
                const memoryList = allMemories.map(m =>
                    `[${m.category}] ${m.content}`
                ).join('\n')

                const consolidationResult = await openai.chat.completions.create({
                    model: 'gpt-5-mini',
                    temperature: 0.2,
                    messages: [
                        { role: 'system', content: CONSOLIDATION_PROMPT },
                        { role: 'user', content: `Nuvarande minnen (${allMemories.length} st):\n\n${memoryList}` },
                    ],
                    response_format: { type: 'json_object' },
                })

                const consolidatedRaw = consolidationResult.choices[0]?.message?.content
                if (consolidatedRaw) {
                    const parsedConsolidated = JSON.parse(consolidatedRaw)
                    const consolidatedItems: Array<{ content: string; category: string; confidence: number }> =
                        Array.isArray(parsedConsolidated)
                            ? parsedConsolidated
                            : (parsedConsolidated.memories || parsedConsolidated.items || [])

                    if (consolidatedItems.length > 0 && consolidatedItems.length <= MEMORY_CAP) {
                        // Supersede all old memories with a single marker
                        // Then insert the consolidated set
                        const markerMemory = await userMemoryService.addMemory({
                            companyId,
                            content: `[CONSOLIDATED ${new Date().toISOString().split('T')[0]}]`,
                            category: 'decision',
                            confidence: 0,
                        })

                        if (markerMemory) {
                            // Supersede all old memories
                            for (const old of allMemories) {
                                await userMemoryService.supersedeMemory(old.id, markerMemory.id)
                            }

                            // Also supersede the marker itself (it's just a placeholder)
                            const firstNew = await userMemoryService.addMemory({
                                companyId,
                                content: consolidatedItems[0].content,
                                category: consolidatedItems[0].category as 'decision' | 'preference' | 'pending',
                                confidence: consolidatedItems[0].confidence,
                            })

                            if (firstNew) {
                                await userMemoryService.supersedeMemory(markerMemory.id, firstNew.id)
                            }

                            // Insert remaining consolidated memories
                            for (let i = 1; i < consolidatedItems.length; i++) {
                                const ci = consolidatedItems[i]
                                if (!ci.content || !validCategories.includes(ci.category)) continue
                                await userMemoryService.addMemory({
                                    companyId,
                                    content: ci.content,
                                    category: ci.category as 'decision' | 'preference' | 'pending',
                                    confidence: ci.confidence,
                                })
                            }

                            consolidated = true
                            console.log(`[ExtractMemories] Consolidated ${allMemories.length} → ${consolidatedItems.length} memories`)
                        }
                    }
                }
            } catch (e) {
                // Consolidation is best-effort — extraction still succeeded
                console.warn('[ExtractMemories] Consolidation failed:', e)
            }
        }

        return NextResponse.json({
            extracted: saved.length,
            memories: saved,
            consolidated,
            totalMemories: consolidated ? MEMORY_CAP : allMemories.length,
        })
    } catch (error) {
        console.error('[ExtractMemories] Error:', error)
        return ApiResponse.serverError('Failed to extract memories')
    }
})
