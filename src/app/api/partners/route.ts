/**
 * Partners API
 *
 * SECURITY: Requires authentication via getAuthContext()
 */
import { NextResponse } from 'next/server'
import { getAuthContext, ApiResponse } from '@/lib/database/auth'

export async function GET() {
  try {
    const ctx = await getAuthContext()
    if (!ctx) {
      return ApiResponse.unauthorized('Authentication required')
    }

    const { supabase, companyId } = ctx;

    let query = supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: partners, error } = await query;

    if (error) throw error;

    return NextResponse.json({ partners: partners || [] })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) {
      return ApiResponse.unauthorized('Authentication required')
    }

    const { supabase, userId, companyId } = ctx;
    const json = await request.json()

    const { data: partner, error } = await supabase
      .from('partners')
      .insert({
        ...json,
        company_id: json.company_id ?? companyId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ partner })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
