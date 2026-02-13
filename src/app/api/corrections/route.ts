/**
 * Verification Corrections API
 * 
 * POST: Create a correction (reversal + optional new entries)
 * 
 * Body:
 *   verificationId: string (required) — the verification to correct
 *   correctedEntries: VerificationEntry[] (optional) — new correct entries
 *   description: string (optional) — description for the correction
 */

import { NextRequest, NextResponse } from 'next/server'
import { correctionService } from '@/services/correction-service'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { verificationId, correctedEntries, description } = body

        if (!verificationId) {
            return NextResponse.json({ error: 'verificationId krävs' }, { status: 400 })
        }

        const result = await correctionService.executeCorrection(
            verificationId,
            correctedEntries,
            description
        )

        return NextResponse.json({
            success: true,
            ...result,
            message: 'Rättelseverifikat har skapats.',
        })
    } catch (error) {
        console.error('Failed to create correction:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Något gick fel' },
            { status: 500 }
        )
    }
}
