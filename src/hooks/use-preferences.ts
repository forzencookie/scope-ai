"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./use-auth"

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

export function usePreferences() {
    const { user } = useAuth()
    const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch preferences on mount
    useEffect(() => {
        if (!user) {
            setIsLoading(false)
            return
        }

        const fetchPreferences = async () => {
            try {
                setIsLoading(true)
                const res = await fetch('/api/user/preferences')
                if (!res.ok) throw new Error('Failed to fetch preferences')
                
                const data = await res.json()
                if (data.preferences) {
                    setPreferences({ ...defaultPreferences, ...data.preferences })
                }
            } catch (err) {
                console.error('Error fetching preferences:', err)
                setError('Could not load preferences')
            } finally {
                setIsLoading(false)
            }
        }

        fetchPreferences()
    }, [user])

    // Update a single preference
    const updatePreference = useCallback(async <K extends keyof UserPreferences>(
        key: K,
        value: UserPreferences[K]
    ): Promise<boolean> => {
        // Optimistic update
        setPreferences(prev => ({ ...prev, [key]: value }))
        
        try {
            setIsSaving(true)
            const res = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            })

            if (!res.ok) throw new Error('Failed to update preference')
            
            const data = await res.json()
            if (data.preferences) {
                setPreferences({ ...defaultPreferences, ...data.preferences })
            }
            return true
        } catch (err) {
            console.error('Error updating preference:', err)
            // Revert on error
            setPreferences(prev => ({ ...prev, [key]: preferences[key] }))
            setError('Could not save preference')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [preferences])

    // Update multiple preferences at once
    const updatePreferences = useCallback(async (
        updates: Partial<UserPreferences>
    ): Promise<boolean> => {
        // Optimistic update
        setPreferences(prev => ({ ...prev, ...updates }))
        
        try {
            setIsSaving(true)
            const res = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (!res.ok) throw new Error('Failed to update preferences')
            
            const data = await res.json()
            if (data.preferences) {
                setPreferences({ ...defaultPreferences, ...data.preferences })
            }
            return true
        } catch (err) {
            console.error('Error updating preferences:', err)
            setError('Could not save preferences')
            return false
        } finally {
            setIsSaving(false)
        }
    }, [])

    return {
        preferences,
        isLoading,
        isSaving,
        error,
        updatePreference,
        updatePreferences,
    }
}
