/**
 * Onboarding Status API
 * 
 * GET: Check if user needs to see onboarding
 * PATCH: Update onboarding status (complete or skip)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get profile with onboarding status
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('onboarding_completed_at, onboarding_skipped, created_at')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('[Onboarding] Failed to fetch profile:', error)
            return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 })
        }

        // Determine if user should see onboarding
        const needsOnboarding = !profile.onboarding_completed_at && !profile.onboarding_skipped
        
        return NextResponse.json({
            needsOnboarding,
            completedAt: profile.onboarding_completed_at,
            skipped: profile.onboarding_skipped,
            accountCreatedAt: profile.created_at,
        })
    } catch (error) {
        console.error('[Onboarding] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body as { action: 'complete' | 'skip' }

        if (!action || !['complete', 'skip'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Use "complete" or "skip"' }, { status: 400 })
        }

        const updateData = action === 'complete'
            ? { onboarding_completed_at: new Date().toISOString(), onboarding_skipped: false }
            : { onboarding_skipped: true }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)

        if (error) {
            console.error('[Onboarding] Failed to update status:', error)
            return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            action,
            message: action === 'complete' 
                ? 'Onboarding completed successfully' 
                : 'Onboarding skipped'
        })
    } catch (error) {
        console.error('[Onboarding] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
