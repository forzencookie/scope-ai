/**
 * Audio Transcription API using OpenAI Whisper
 *
 * Converts speech to text with high accuracy.
 * Automatically filters filler words and hesitations.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/database/auth'
import OpenAI from 'openai'

function getOpenAIClient() {
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })
}

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const auth = await verifyAuth(request)
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const audioFile = formData.get('audio') as File

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
        }

        // Transcribe using Whisper
        const openai = getOpenAIClient()
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'sv', // Swedish
            response_format: 'text',
            // Whisper automatically handles filler words, but we can add a prompt
            // to encourage cleaner output
            prompt: 'Transkribera detta tydligt utan fyllnadsord som eh, öh, um.',
        })

        return NextResponse.json({
            text: transcription,
            success: true
        })

    } catch (error: unknown) {
        console.error('Transcription error:', error)
        const message = error instanceof Error ? error.message : 'Transcription failed'
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
