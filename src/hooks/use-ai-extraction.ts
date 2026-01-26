"use client"

import * as React from "react"

type AiState = "idle" | "processing" | "preview" | "error"

interface UseAiExtractionOptions<T> {
    /** API endpoint for extraction */
    apiEndpoint: string
    /** Transform API response to form state */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transformResponse: (data: any) => Partial<T>
    /** Initial form state */
    initialState: T
}

interface UseAiExtractionReturn<T> {
    /** Current AI processing state */
    aiState: AiState
    /** Error message if any */
    errorMessage: string | null
    /** Current form state */
    formState: T
    /** Update form state */
    setFormState: React.Dispatch<React.SetStateAction<T>>
    /** Process file with AI */
    processWithAI: (file: File) => Promise<void>
    /** Reset to idle state */
    reset: () => void
    /** Retry processing with current file */
    retry: () => Promise<void>
    /** Accept AI extraction and callback */
    accept: () => T
    /** Switch to manual edit mode */
    switchToManual: () => void
    /** Current file being processed */
    currentFile: File | null
}

/**
 * Hook for managing AI extraction state and processing.
 * Consolidates the AI processing logic used across upload dialogs.
 */
export function useAiExtraction<T>({
    apiEndpoint,
    transformResponse,
    initialState,
}: UseAiExtractionOptions<T>): UseAiExtractionReturn<T> {
    const [aiState, setAiState] = React.useState<AiState>("idle")
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
    const [formState, setFormState] = React.useState<T>(initialState)
    const [currentFile, setCurrentFile] = React.useState<File | null>(null)

    const processWithAI = React.useCallback(
        async (file: File) => {
            setCurrentFile(file)
            setAiState("processing")
            setErrorMessage(null)

            try {
                const formData = new FormData()
                formData.append("file", file)

                const response = await fetch(apiEndpoint, {
                    method: "POST",
                    body: formData,
                })

                const result = await response.json()

                if (result.success && result.data) {
                    const transformed = transformResponse(result.data)
                    setFormState((prev) => ({ ...prev, ...transformed }))
                    setAiState("preview")

                    if (result.warning) {
                        setErrorMessage(result.warning)
                    }
                } else {
                    throw new Error(result.error || "Failed to extract data")
                }
            } catch (error) {
                console.error("AI extraction error:", error)
                setErrorMessage(
                    "Kunde inte tolka dokumentet. Försök igen eller använd manuell inmatning."
                )
                setAiState("error")
            }
        },
        [apiEndpoint, transformResponse]
    )

    const reset = React.useCallback(() => {
        setAiState("idle")
        setErrorMessage(null)
        setFormState(initialState)
        setCurrentFile(null)
    }, [initialState])

    const retry = React.useCallback(async () => {
        if (currentFile) {
            await processWithAI(currentFile)
        }
    }, [currentFile, processWithAI])

    const accept = React.useCallback(() => {
        return formState
    }, [formState])

    const switchToManual = React.useCallback(() => {
        setAiState("idle")
    }, [])

    return {
        aiState,
        errorMessage,
        formState,
        setFormState,
        processWithAI,
        reset,
        retry,
        accept,
        switchToManual,
        currentFile,
    }
}
