import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/database/auth'
import {
  pendingBookingService,
  type PendingBookingSourceType,
  type PendingBookingStatus,
} from '@/services/pending-booking-service'
import type { VerificationEntry } from '@/services/verification-service'

/**
 * GET /api/pending-bookings
 *
 * Fetch pending bookings for the current user.
 * Optional query params: source_type, status
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext()

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sourceType = searchParams.get('source_type') as PendingBookingSourceType | null
    const status = searchParams.get('status') as PendingBookingStatus | null

    const [bookings, pendingCount] = await Promise.all([
      pendingBookingService.getPendingBookings({
        sourceType: sourceType || undefined,
        status: status || undefined,
      }),
      pendingBookingService.getPendingCount(),
    ])

    return NextResponse.json({
      bookings,
      pendingCount,
    })
  } catch (error) {
    console.error('[API] GET /api/pending-bookings error:', error)
    return NextResponse.json({ error: 'Failed to fetch pending bookings' }, { status: 500 })
  }
}

/**
 * POST /api/pending-bookings
 *
 * Actions:
 * - { action: 'create', ...params } — Create a new pending booking
 * - { action: 'book', id, finalEntries? } — Book a single item
 * - { action: 'book-batch', ids } — Batch book multiple items
 * - { action: 'dismiss', ids } — Dismiss selected items
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext()

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const {
          sourceType,
          sourceId,
          description,
          entries,
          series,
          date,
          metadata,
        } = body as {
          sourceType: PendingBookingSourceType
          sourceId: string
          description: string
          entries: VerificationEntry[]
          series?: string
          date: string
          metadata?: Record<string, unknown>
          action: string
        }

        if (!sourceType || !sourceId || !description || !entries || !date) {
          return NextResponse.json(
            { error: 'Missing required fields: sourceType, sourceId, description, entries, date' },
            { status: 400 }
          )
        }

        const pending = await pendingBookingService.createPendingBooking({
          sourceType,
          sourceId,
          description,
          entries,
          series,
          date,
          metadata,
        })

        return NextResponse.json({ success: true, pendingBooking: pending })
      }

      case 'book': {
        const { id, finalEntries } = body as {
          id: string
          finalEntries?: VerificationEntry[]
          action: string
        }

        if (!id) {
          return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 })
        }

        const result = await pendingBookingService.bookPendingItem(id, finalEntries)

        return NextResponse.json({ success: true, ...result })
      }

      case 'book-batch': {
        const { ids } = body as { ids: string[]; action: string }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ error: 'Missing required field: ids (non-empty array)' }, { status: 400 })
        }

        const result = await pendingBookingService.bookPendingItems(ids)

        return NextResponse.json({ success: true, ...result })
      }

      case 'dismiss': {
        const { ids } = body as { ids: string[]; action: string }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ error: 'Missing required field: ids (non-empty array)' }, { status: 400 })
        }

        await pendingBookingService.dismissPendingBookings(ids)

        return NextResponse.json({ success: true, dismissed: ids.length })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: create, book, book-batch, dismiss` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[API] POST /api/pending-bookings error:', error)
    const message = error instanceof Error ? error.message : 'Failed to process pending booking action'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
