/**
 * Onboarding Seed API
 * 
 * Seeds initial data for company onboarding (shareholders, partners, members)
 * 
 * SECURITY: Requires authentication and user_id is enforced on all inserts
 * Previously used service role key without authentication!
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, ApiResponse } from '@/lib/api-auth'
import { createUserScopedDb } from '@/lib/database/user-scoped-db'

interface ShareholderData {
    name: string
    ssn_org_nr: string
    shares_count: number
    shares_percentage: number
    share_class: 'A' | 'B'
}

interface PartnerData {
    name: string
    ssn_org_nr: string
    type: 'komplementär' | 'kommanditdelägare'
    capital_contribution: number
    ownership_percentage: number
}

interface MemberData {
    name: string
    email: string
    member_since: string
    status: 'active' | 'pending'
    fee_paid: boolean
}

interface OnboardingSeedRequest {
    companyType: string
    // AB data
    shareCapital?: number
    totalShares?: number
    shareClasses?: { A: number; B: number }
    shareholders?: ShareholderData[]
    // HB/KB data
    partners?: PartnerData[]
    // Förening data
    members?: MemberData[]
}

export async function POST(request: NextRequest) {
    // Verify authentication
    const auth = await verifyAuth(request)
    if (!auth) {
        return ApiResponse.unauthorized('Authentication required')
    }

    try {
        const body: OnboardingSeedRequest = await request.json()
        const results: Record<string, number> = {}
        const db = createUserScopedDb(auth.userId)

        // Seed shareholders for AB
        if (body.companyType === 'ab' && body.shareholders && body.shareholders.length > 0) {
            try {
                const shareholders = await Promise.all(
                    body.shareholders.map(s => db.shareholders.create({
                        name: s.name,
                        ssn_org_nr: s.ssn_org_nr,
                        shares_count: s.shares_count,
                        shares_percentage: s.shares_percentage,
                        share_class: s.share_class,
                        user_id: auth.userId,
                    }))
                )
                results.shareholders = shareholders.length
            } catch (error) {
                console.error('Error inserting shareholders:', error)
                return NextResponse.json({ success: false, error: 'Failed to insert shareholders' }, { status: 500 })
            }
        }

        // Seed partners for HB/KB
        if ((body.companyType === 'hb' || body.companyType === 'kb') && body.partners && body.partners.length > 0) {
            try {
                const partners = await Promise.all(
                    body.partners.map(p => db.partners.create({
                        name: p.name,
                        ssn_org_nr: p.ssn_org_nr,
                        partner_type: p.type,
                        capital_contribution: p.capital_contribution,
                        ownership_percentage: p.ownership_percentage,
                        user_id: auth.userId,
                    }))
                )
                results.partners = partners.length
            } catch (error) {
                console.error('Error inserting partners:', error)
                return NextResponse.json({ success: false, error: 'Failed to insert partners' }, { status: 500 })
            }
        }

        // Seed members for Ekonomisk Förening
        if (body.companyType === 'ef' && body.members && body.members.length > 0) {
            try {
                const members = await Promise.all(
                    body.members.map(m => db.members.create({
                        name: m.name,
                        email: m.email,
                        member_since: m.member_since,
                        status: m.status,
                        fee_paid: m.fee_paid,
                        user_id: auth.userId,
                    }))
                )
                results.members = members.length
            } catch (error) {
                console.error('Error inserting members:', error)
                return NextResponse.json({ success: false, error: 'Failed to insert members' }, { status: 500 })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Onboarding data seeded successfully',
            results
        })
    } catch (error) {
        console.error('Onboarding seed error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to seed onboarding data' },
            { status: 500 }
        )
    }
}
