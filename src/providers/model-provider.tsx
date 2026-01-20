"use client"

import * as React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { DEFAULT_MODEL_ID, getModelById, type AIModel } from "@/lib/ai-models"

// ============================================================================
// Types
// ============================================================================

interface ModelContextType {
  modelId: string
  model: AIModel | undefined
  setModelId: (id: string) => void
}

// ============================================================================
// Context
// ============================================================================

const ModelContext = createContext<ModelContextType | undefined>(undefined)

const STORAGE_KEY = "scope-ai-model"

// ============================================================================
// Provider
// ============================================================================

interface ModelProviderProps {
  children: React.ReactNode
  defaultModelId?: string
}

export function ModelProvider({
  children,
  defaultModelId = DEFAULT_MODEL_ID
}: ModelProviderProps) {
  const [modelId, setModelIdState] = useState<string>(defaultModelId)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && getModelById(stored)) {
      setModelIdState(stored)
    }
  }, [])

  // Save to localStorage when model changes
  const setModelId = useCallback((newModelId: string) => {
    // Validate that the model exists
    if (getModelById(newModelId)) {
      setModelIdState(newModelId)
      localStorage.setItem(STORAGE_KEY, newModelId)
    }
  }, [])

  const model = useMemo(() => getModelById(modelId), [modelId])

  const value: ModelContextType = useMemo(() => ({
    modelId,
    model,
    setModelId,
  }), [modelId, model, setModelId])

  // Prevent hydration mismatch by rendering default until mounted
  if (!mounted) {
    return (
      <ModelContext.Provider value={{
        modelId: defaultModelId,
        model: getModelById(defaultModelId),
        setModelId: () => {},
      }}>
        {children}
      </ModelContext.Provider>
    )
  }

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useModel() {
  const context = useContext(ModelContext)
  if (context === undefined) {
    throw new Error("useModel must be used within a ModelProvider")
  }
  return context
}
