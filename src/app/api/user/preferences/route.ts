import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/database/supabase-server"

export interface UserPreferences {
    // Notifications
    notify_new_invoices: boolean
    notify_payment_reminders: boolean
    notify_monthly_reports: boolean
    notify_important_dates: boolean
    notify_mobile: boolean
    
    // Appearance
    theme: 'light' | 'dark' | 'system'
    density: 'compact' | 'normal' | 'comfortable'
    compact_sidebar: boolean
    
    // Language
    language: string
    currency: string
    date_format: string
    first_day_of_week: number
    text_mode: 'enkel' | 'avancerad'
    
    // Email
    daily_summary: boolean
    marketing_emails: boolean
    
    // Accessibility
    reduce_motion: boolean
    high_contrast: boolean
    larger_text: boolean
}

const defaultPreferences: UserPreferences = {
    notify_new_invoices: true,
    notify_payment_reminders: true,
    notify_monthly_reports: false,
    notify_important_dates: false,
    notify_mobile: false,
    theme: 'system',
    density: 'normal',
    compact_sidebar: false,
    language: 'sv',
    currency: 'SEK',
    date_format: 'YYYY-MM-DD',
    first_day_of_week: 1,
    text_mode: 'enkel',
    daily_summary: false,
    marketing_emails: false,
    reduce_motion: false,
    high_contrast: false,
    larger_text: false,
}

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient()
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { data: preferences, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error("Error fetching preferences:", error)
            return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 })
        }

        // If no preferences exist, return defaults
        if (!preferences) {
            return NextResponse.json({ preferences: defaultPreferences })
        }

        return NextResponse.json({ preferences })
    } catch (err) {
        console.error("Error in GET /api/user/preferences:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createServerSupabaseClient()
        
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const updates = await request.json()

        // Validate the updates
        const validKeys = Object.keys(defaultPreferences)
        const sanitizedUpdates: Partial<UserPreferences> = {}
        
        for (const key of Object.keys(updates)) {
            if (validKeys.includes(key)) {
                sanitizedUpdates[key as keyof UserPreferences] = updates[key]
            }
        }

        // Check if preferences exist
        const { data: existing } = await supabase
            .from('user_preferences')
            .select('id')
            .eq('user_id', user.id)
            .single()

        let result
        if (existing) {
            // Update existing
            result = await supabase
                .from('user_preferences')
                .update(sanitizedUpdates)
                .eq('user_id', user.id)
                .select()
                .single()
        } else {
            // Insert new
            result = await supabase
                .from('user_preferences')
                .insert({ user_id: user.id, ...sanitizedUpdates })
                .select()
                .single()
        }

        if (result.error) {
            console.error("Error updating preferences:", result.error)
            return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
        }

        return NextResponse.json({ preferences: result.data })
    } catch (err) {
        console.error("Error in PUT /api/user/preferences:", err)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
