import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    // Transform snake_case to camelCase for frontend if needed, 
    // but better to align frontend types or use a transform map.
    // For speed, let's assume we map it here or frontend adapts.
    // Let's map it here to match frontend types.
    const members = data.map((m: any) => ({
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

    return NextResponse.json({ members })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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
        roles: json.roles
    }

    const { data, error } = await supabase
      .from('members')
      .insert(dbPayload)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ member: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
