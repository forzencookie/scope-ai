/**
 * Onboarding Seed API
 * 
 * Seeds initial data for company onboarding (shareholders, partners, members)
 * 
 * SECURITY: Requires authentication and user_id is enforced on all inserts
 * Previously used service role key without authentication!
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, ApiResponse } from "@/lib/database/auth-server"

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
    const ctx = await getAuthContext()
    if (!ctx) {
        return ApiResponse.unauthorized('Authentication required')
    }
    const { supabase, userId, companyId } = ctx

    if (!companyId) {
        return NextResponse.json({ success: false, error: 'No company selected' }, { status: 400 })
    }

    try {
        const body: OnboardingSeedRequest = await request.json()
        const results: Record<string, number> = {}

        // Seed shareholders for AB
        if (body.companyType === 'ab' && body.shareholders && body.shareholders.length > 0) {
            try {
                const shareholderData = body.shareholders.map(s => ({
                    name: s.name,
                    ssn_org_nr: s.ssn_org_nr,
                    shares_count: s.shares_count,
                    shares_percentage: s.shares_percentage,
                    share_class: s.share_class,
                    user_id: userId,
                    company_id: companyId,
                }))
                const { data: shareholders, error } = await supabase
                    .from('shareholders')
                    .insert(shareholderData)
                    .select()
                if (error) throw error
                results.shareholders = shareholders?.length || 0
            } catch (error) {
                console.error('Error inserting shareholders:', error)
                return NextResponse.json({ success: false, error: 'Failed to insert shareholders' }, { status: 500 })
            }
        }

        // Seed partners for HB/KB
        if ((body.companyType === 'hb' || body.companyType === 'kb') && body.partners && body.partners.length > 0) {
            try {
                const partnerData = body.partners.map(p => ({
                    name: p.name,
                    personal_number: p.ssn_org_nr,
                    type: p.type,
                    capital_contribution: p.capital_contribution,
                    ownership_percentage: p.ownership_percentage,
                    user_id: userId,
                    company_id: companyId,
                }))
                const { data: partners, error } = await supabase
                    .from('partners')
                    .insert(partnerData)
                    .select()
                if (error) throw error
                results.partners = partners?.length || 0
            } catch (error) {
                console.error('Error inserting partners:', error)
                return NextResponse.json({ success: false, error: 'Failed to insert partners' }, { status: 500 })
            }
        }

        // Seed members for Ekonomisk Förening
        if (body.companyType === 'ef' && body.members && body.members.length > 0) {
            try {
                const memberData = body.members.map(m => ({
                    name: m.name,
                    email: m.email,
                    join_date: m.member_since ?? new Date().toISOString().split('T')[0],
                    status: m.status ?? 'active',
                    user_id: userId,
                    company_id: companyId,
                }))
                const { data: members, error } = await supabase
                    .from('members')
                    .insert(memberData)
                    .select()
                if (error) throw error
                results.members = members?.length || 0
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
