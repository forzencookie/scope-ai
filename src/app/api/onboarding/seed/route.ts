import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
    try {
        const body: OnboardingSeedRequest = await request.json()
        const results: Record<string, number> = {}

        // Seed shareholders for AB
        if (body.companyType === 'ab' && body.shareholders && body.shareholders.length > 0) {
            const { data, error } = await supabase
                .from('shareholders')
                .insert(body.shareholders.map(s => ({
                    name: s.name,
                    ssn_org_nr: s.ssn_org_nr,
                    shares_count: s.shares_count,
                    shares_percentage: s.shares_percentage,
                    share_class: s.share_class,
                })))
                .select()

            if (error) {
                console.error('Error inserting shareholders:', error)
                return NextResponse.json({ success: false, error: error.message }, { status: 500 })
            }
            results.shareholders = data?.length || 0
        }

        // Seed partners for HB/KB
        if ((body.companyType === 'hb' || body.companyType === 'kb') && body.partners && body.partners.length > 0) {
            const { data, error } = await supabase
                .from('partners')
                .insert(body.partners.map(p => ({
                    name: p.name,
                    ssn_org_nr: p.ssn_org_nr,
                    partner_type: p.type,
                    capital_contribution: p.capital_contribution,
                    ownership_percentage: p.ownership_percentage,
                })))
                .select()

            if (error) {
                console.error('Error inserting partners:', error)
                return NextResponse.json({ success: false, error: error.message }, { status: 500 })
            }
            results.partners = data?.length || 0
        }

        // Seed members for Ekonomisk Förening
        if (body.companyType === 'ef' && body.members && body.members.length > 0) {
            const { data, error } = await supabase
                .from('members')
                .insert(body.members.map(m => ({
                    name: m.name,
                    email: m.email,
                    member_since: m.member_since,
                    status: m.status,
                    fee_paid: m.fee_paid,
                })))
                .select()

            if (error) {
                console.error('Error inserting members:', error)
                return NextResponse.json({ success: false, error: error.message }, { status: 500 })
            }
            results.members = data?.length || 0
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
