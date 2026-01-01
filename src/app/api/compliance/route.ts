import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/server-db"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'documents' or 'shareholders'

    try {
        if (type === 'shareholders') {
            const shareholders = await db.getShareholders()
            return NextResponse.json({ success: true, data: shareholders })
        }

        const documents = await db.getCorporateDocuments()
        return NextResponse.json({ success: true, data: documents })
    } catch (error) {
        console.error('Compliance API GET error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch compliance data' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type, ...data } = body

        if (type === 'document') {
            const newDoc = await db.addCorporateDocument(data)
            return NextResponse.json({ success: true, data: newDoc })
        }

        if (type === 'shareholder_update') {
            const { id, ...updates } = data
            const updated = await db.updateShareholder(id, updates)
            return NextResponse.json({ success: true, data: updated })
        }

        if (type === 'shareholder_create') {
            // Remove id if present to let DB generate it
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...newShareholder } = data
            const created = await db.addShareholder(newShareholder)
            return NextResponse.json({ success: true, data: created })
        }

        return NextResponse.json(
            { success: false, error: 'Invalid compliance action type' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Compliance API POST error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to process compliance action' },
            { status: 500 }
        )
    }
}
