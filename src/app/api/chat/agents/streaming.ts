/**
 * Streaming helpers for Agent Chat API
 */

import type { AgentDomain } from '@/lib/agents/types'

const textEncoder = new TextEncoder()

export function streamText(controller: ReadableStreamDefaultController, text: string) {
    if (!text) return
    controller.enqueue(textEncoder.encode(`T:${JSON.stringify(text)}\n`))
}

export function streamData(controller: ReadableStreamDefaultController, data: unknown) {
    controller.enqueue(textEncoder.encode(`D:${JSON.stringify(data)}\n`))
}

export function streamAgent(controller: ReadableStreamDefaultController, agentInfo: {
    activeAgent: AgentDomain
    agentName: string
    routing?: string
}) {
    controller.enqueue(textEncoder.encode(`A:${JSON.stringify(agentInfo)}\n`))
}

export function streamError(controller: ReadableStreamDefaultController, error: string) {
    controller.enqueue(textEncoder.encode(`E:${JSON.stringify({ error })}\n`))
}

/**
 * Chunk text into smaller pieces for streaming effect.
 */
export function chunkText(text: string, wordsPerChunk: number): string[] {
    const words = text.split(' ')
    const chunks: string[] = []
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(i, i + wordsPerChunk).join(' ')
        chunks.push(chunk + ' ')
    }
    
    return chunks
}
