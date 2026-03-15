"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { translations, type Translations } from "@/lib/translations"

// ============================================================================
// Types
// ============================================================================

export type TextMode = "enkel" | "avancerad"

// Create a typed text object from translations
type TranslatedTexts = {
  [K in keyof Translations]: {
    [S in keyof Translations[K]]: string
  }
}

interface TextModeContextType {
  mode: TextMode
  setMode: (mode: TextMode) => void
  isEnkel: boolean
  isAvancerad: boolean
  /** Typed object with all translations - use text.category.key */
  text: TranslatedTexts
  /** Legacy function for string-based keys */
  t: (category: keyof Translations, key: string) => string
}

// ============================================================================
// Context
// ============================================================================

const TextModeContext = createContext<TextModeContextType | undefined>(undefined)

// ============================================================================
// Helper to build text object
// ============================================================================

function buildTextObject(mode: TextMode): TranslatedTexts {
  const result: Record<string, Record<string, string>> = {}
  
  for (const category of Object.keys(translations) as (keyof Translations)[]) {
    const categoryObj = translations[category]
    const translatedCategory: Record<string, string> = {}
    
    for (const key of Object.keys(categoryObj)) {
      const translation = categoryObj[key as keyof typeof categoryObj] as { enkel: string; avancerad: string }
      translatedCategory[key] = translation[mode]
    }
    
    result[category] = translatedCategory
  }
  
  return result as TranslatedTexts
}

// ============================================================================
// Provider
// ============================================================================

interface TextModeProviderProps {
  children: React.ReactNode
  defaultMode?: TextMode
}

export function TextModeProvider({ 
  children, 
  defaultMode = "avancerad" 
}: TextModeProviderProps) {
  const [mode, setModeState] = useState<TextMode>(defaultMode)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("text-mode")
    if (stored === "enkel" || stored === "avancerad") {
      setModeState(stored)
    }
  }, [])

  // Save to localStorage when mode changes
  const setMode = useCallback((newMode: TextMode) => {
    setModeState(newMode)
    localStorage.setItem("text-mode", newMode)
  }, [])

  // Build the typed text object based on current mode
  const text = useMemo(() => buildTextObject(mode), [mode])

  // Legacy t() function for string-based lookups
  const t = useCallback((category: keyof Translations, key: string): string => {
    const categoryObj = translations[category]
    if (!categoryObj) {
      console.warn(`Missing translation category: ${category}`)
      return key
    }
    
    const translation = categoryObj[key as keyof typeof categoryObj] as { enkel: string; avancerad: string } | undefined
    if (!translation) {
      console.warn(`Missing translation: ${category}.${key}`)
      return key
    }
    
    return translation[mode]
  }, [mode])

  const value: TextModeContextType = useMemo(() => ({
    mode,
    setMode,
    isEnkel: mode === "enkel",
    isAvancerad: mode === "avancerad",
    text,
    t,
  }), [mode, setMode, text, t])

  // Prevent hydration mismatch by rendering default until mounted
  if (!mounted) {
    const defaultText = buildTextObject(defaultMode)
    
    return (
      <TextModeContext.Provider value={{
        mode: defaultMode,
        setMode: () => {},
        isEnkel: defaultMode === "enkel",
        isAvancerad: defaultMode === "avancerad",
        text: defaultText,
        t: (category, key) => {
          const categoryObj = translations[category]
          const translation = categoryObj?.[key as keyof typeof categoryObj] as { enkel: string; avancerad: string } | undefined
          return translation?.[defaultMode] ?? key
        },
      }}>
        {children}
      </TextModeContext.Provider>
    )
  }

  return (
    <TextModeContext.Provider value={value}>
      {children}
    </TextModeContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useTextMode() {
  const context = useContext(TextModeContext)
  if (context === undefined) {
    throw new Error("useTextMode must be used within a TextModeProvider")
  }
  return context
}

// ============================================================================
// Helper component for inline translations (optional)
// ============================================================================

interface TProps {
  category: keyof Translations
  k: string
}

export function T({ category, k }: TProps) {
  const { t } = useTextMode()
  return <>{t(category, k)}</>
}
