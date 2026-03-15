/**
 * Members API
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextResponse } from 'next/server'
import { getAuthContext } from '@/lib/database/auth';

export async function GET() {
  try {
    const ctx = await getAuthContext();

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase, userId, companyId } = ctx;

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext();

    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { supabase, companyId } = ctx;
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
