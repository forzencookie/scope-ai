"use client"

import * as React from "react"

interface UseFileCaptureOptions {
    /** Callback when file is selected */
    onFileSelected: (file: File) => void | Promise<void>
    /** Accepted file types */
    accept?: string
    /** Enable camera capture (mobile) */
    enableCamera?: boolean
}

interface UseFileCaptureReturn {
    /** Props for hidden camera input element */
    cameraInputProps: React.InputHTMLAttributes<HTMLInputElement>
    /** Current image preview URL (data URL) */
    imagePreview: string | null
    /** Trigger camera capture */
    triggerCamera: () => void
    /** Handle file selection from dropzone or input */
    handleFileSelect: (files: File[]) => Promise<void>
    /** Clear current file and preview */
    clearFile: () => void
    /** Ref for camera input */
    cameraInputRef: React.RefObject<HTMLInputElement | null>
    /** Generate preview for a file */
    generatePreview: (file: File) => void
}

/**
 * Hook for handling file selection and camera capture.
 * Consolidates the repeated file handling logic across upload dialogs.
 */
export function useFileCapture({
    onFileSelected,
    accept = "image/*,.pdf",
    enableCamera = true,
}: UseFileCaptureOptions): UseFileCaptureReturn {
    const cameraInputRef = React.useRef<HTMLInputElement>(null)
    const [imagePreview, setImagePreview] = React.useState<string | null>(null)

    const generatePreview = React.useCallback((file: File) => {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader()
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        } else {
            // For PDFs and other files, no preview
            setImagePreview(null)
        }
    }, [])

    const triggerCamera = React.useCallback(() => {
        cameraInputRef.current?.click()
    }, [])

    const handleFileSelect = React.useCallback(
        async (files: File[]) => {
            if (files.length === 0) return
            const file = files[0]
            generatePreview(file)
            await onFileSelected(file)
        },
        [onFileSelected, generatePreview]
    )

    const handleCameraChange = React.useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (files && files.length > 0) {
                const file = files[0]
                generatePreview(file)
                await onFileSelected(file)
            }
            // Reset input so same file can be selected again
            if (cameraInputRef.current) {
                cameraInputRef.current.value = ""
            }
        },
        [onFileSelected, generatePreview]
    )

    const clearFile = React.useCallback(() => {
        setImagePreview(null)
        if (cameraInputRef.current) {
            cameraInputRef.current.value = ""
        }
    }, [])

    const cameraInputProps: React.InputHTMLAttributes<HTMLInputElement> = {
        type: "file",
        accept: enableCamera ? "image/*" : accept,
        capture: enableCamera ? "environment" : undefined,
        className: "hidden",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onChange: handleCameraChange as any,
    }

    return {
        cameraInputProps,
        imagePreview,
        triggerCamera,
        handleFileSelect,
        clearFile,
        cameraInputRef,
        generatePreview,
    }
}
