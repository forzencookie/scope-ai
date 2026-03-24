/**
 * Onboarding Status API
 *
 * GET: Check if user needs to see onboarding
 * PATCH: Update onboarding status (complete or skip)
 *
 * Stores onboarding state in user_preferences.preferences JSON column,
 * since profiles table doesn't have onboarding-specific columns.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/database/server'

interface OnboardingPreferences {
    onboarding_completed_at?: string | null
    onboarding_skipped?: boolean
}

function extractOnboarding(preferences: unknown): OnboardingPreferences {
    if (preferences && typeof preferences === 'object' && !Array.isArray(preferences)) {
        const prefs = preferences as Record<string, unknown>
        return {
            onboarding_completed_at: typeof prefs.onboarding_completed_at === 'string' ? prefs.onboarding_completed_at : null,
            onboarding_skipped: typeof prefs.onboarding_skipped === 'boolean' ? prefs.onboarding_skipped : false,
        }
    }
    return { onboarding_completed_at: null, onboarding_skipped: false }
}

export async function GET() {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get profile created_at
        const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', user.id)
            .single()

        // Get onboarding status from user_preferences
        const { data: prefs, error } = await supabase
            .from('user_preferences')
            .select('preferences')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is fine (new user)
            console.error('[Onboarding] Failed to fetch preferences:', error)
            return NextResponse.json({ error: 'Failed to fetch onboarding status' }, { status: 500 })
        }

        const onboarding = extractOnboarding(prefs?.preferences)

        // Determine if user should see onboarding
        const needsOnboarding = !onboarding.onboarding_completed_at && !onboarding.onboarding_skipped

        return NextResponse.json({
            needsOnboarding,
            completedAt: onboarding.onboarding_completed_at,
            skipped: onboarding.onboarding_skipped,
            accountCreatedAt: profile?.created_at,
        })
    } catch (error) {
        console.error('[Onboarding] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { action } = body as { action: 'complete' | 'skip' }

        if (!action || !['complete', 'skip'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Use "complete" or "skip"' }, { status: 400 })
        }

        // Read existing preferences
        const { data: existing } = await supabase
            .from('user_preferences')
            .select('id, preferences')
            .eq('user_id', user.id)
            .single()

        const existingPrefs = (existing?.preferences && typeof existing.preferences === 'object' && !Array.isArray(existing.preferences))
            ? existing.preferences as Record<string, unknown>
            : {}

        const updatedPrefs = action === 'complete'
            ? { ...existingPrefs, onboarding_completed_at: new Date().toISOString(), onboarding_skipped: false }
            : { ...existingPrefs, onboarding_skipped: true }

        if (existing) {
            // Update existing row
            const { error } = await supabase
                .from('user_preferences')
                .update({ preferences: updatedPrefs })
                .eq('id', existing.id)

            if (error) {
                console.error('[Onboarding] Failed to update status:', error)
                return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 })
            }
        } else {
            // Insert new row
            const { error } = await supabase
                .from('user_preferences')
                .insert({ user_id: user.id, preferences: updatedPrefs })

            if (error) {
                console.error('[Onboarding] Failed to insert status:', error)
                return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 })
            }
        }

        return NextResponse.json({
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
