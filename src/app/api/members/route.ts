/**
 * Members API
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from "@/lib/database/auth-server"

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
    const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('name', { ascending: true })

    if (error) throw error

    // Transform snake_case to camelCase for frontend
    const members = (data || []).map((m: Record<string, unknown>) => ({
        id: m.id,
        memberNumber: m.member_number,
        name: m.name,
        email: m.email,
        phone: m.phone,
        joinDate: m.join_date,
        status: m.status,
        membershipType: m.membership_type,
        lastPaidYear: m.last_paid_year,
        roles: m.roles
    }));

    return NextResponse.json({
        members,
        userId,
        companyId,
    })
})

export const POST = withAuth(async (request, { supabase, companyId }) => {
    const json = await request.json()

    // Transform camelCase to snake_case
    const dbPayload = {
        member_number: json.memberNumber,
        name: json.name,
        email: json.email,
        phone: json.phone,
        join_date: json.joinDate,
        status: json.status,
        membership_type: json.membershipType,
        last_paid_year: json.lastPaidYear,
        roles: json.roles,
        company_id: companyId,
    }

    const { data, error } = await supabase
        .from('members')
        .insert(dbPayload)
        .select()
        .single()

    if (error) throw error

    return NextResponse.json({ member: data })
})
