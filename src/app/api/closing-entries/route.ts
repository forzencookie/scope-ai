/**
 * Closing Entries API
 * 
 * GET: Preview closing entries for a fiscal year (dry run)
 * POST: Execute closing entries (creates verifications)
 * 
 * Query params:
 *   year: fiscal year (required)
 *   companyType: 'AB' | 'EF' (default: 'AB')
 */

import { NextRequest, NextResponse } from 'next/server'
import { closingEntryService } from '@/services/closing-entry-service'

export async function GET(req: NextRequest) {
    try {
        const year = parseInt(req.nextUrl.searchParams.get('year') || '')
        const companyType = (req.nextUrl.searchParams.get('companyType') || 'AB') as 'AB' | 'EF'

        if (!year || year < 2000 || year > 2100) {
            return NextResponse.json({ error: 'Ogiltigt räkenskapsår' }, { status: 400 })
        }

        const preview = await closingEntryService.previewClosingEntries(year, companyType)

        return NextResponse.json(preview)
    } catch (error) {
        console.error('Failed to preview closing entries:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Något gick fel' },
            { status: 500 }
        )
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const year = parseInt(body.year)
        const companyType = (body.companyType || 'AB') as 'AB' | 'EF'

        if (!year || year < 2000 || year > 2100) {
            return NextResponse.json({ error: 'Ogiltigt räkenskapsår' }, { status: 400 })
        }

        const result = await closingEntryService.executeClosingEntries(year, companyType)

        return NextResponse.json({
            success: true,
            ...result,
            message: `Bokslutsposter skapade för ${year}. Årets resultat: ${result.netResult.toLocaleString('sv-SE')} kr.`,
        })
    } catch (error) {
        console.error('Failed to execute closing entries:', error)
        const message = error instanceof Error ? error.message : 'Något gick fel'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
