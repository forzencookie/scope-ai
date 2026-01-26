"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button, buttonVariants } from "./button"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

// ==========================================
// LoadingButton Component
// ==========================================
// A button that shows loading state and prevents double-clicks
// during async operations. Use this for any button that triggers
// API calls or other async operations.
//
// Usage:
// <LoadingButton loading={isLoading} loadingText="Saving...">
//   Save
// </LoadingButton>
// ==========================================

export interface LoadingButtonProps
    extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
    /** Whether the button is in loading state */
    loading?: boolean
    /** Text to show while loading (optional, defaults to children) */
    loadingText?: string
    /** Position of the loading spinner */
    spinnerPosition?: "left" | "right"
    /** Custom spinner className */
    spinnerClassName?: string
    /** Use Slot pattern (for asChild) */
    asChild?: boolean
}

export function LoadingButton({
    loading = false,
    loadingText,
    spinnerPosition = "left",
    spinnerClassName,
    children,
    disabled,
    className,
    onClick,
    ...props
}: LoadingButtonProps) {
    // Prevent clicks while loading
    const handleClick = React.useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            if (loading) {
                e.preventDefault()
                return
            }
            onClick?.(e)
        },
        [loading, onClick]
    )

    const spinner = (
        <Loader2
            className={cn(
                "h-4 w-4 animate-spin",
                spinnerClassName
            )}
            aria-hidden="true"
        />
    )

    return (
        <Button
            disabled={disabled || loading}
            className={className}
            onClick={handleClick}
            aria-busy={loading}
            {...props}
        >
            {loading && spinnerPosition === "left" && spinner}
            {loading ? (loadingText ?? children) : children}
            {loading && spinnerPosition === "right" && spinner}
        </Button>
    )
}

// ==========================================
// useLoadingAction Hook
// ==========================================
// A hook that wraps async actions with loading state
// and prevents double-execution.
//
// Usage:
// const { execute, isLoading } = useLoadingAction(async () => {
//   await saveData()
// })
// <LoadingButton loading={isLoading} onClick={execute}>Save</LoadingButton>
// ==========================================

export interface UseLoadingActionOptions {
    /** Callback when action completes successfully */
    onSuccess?: () => void
    /** Callback when action fails */
    onError?: (error: Error) => void
    /** Minimum loading time in ms (for UX, prevents flash) */
    minLoadingTime?: number
}

export function useLoadingAction<T extends unknown[]>(
    action: (...args: T) => Promise<void> | void,
    options: UseLoadingActionOptions = {}
) {
    const [isLoading, setIsLoading] = React.useState(false)
    const isMounted = React.useRef(true)
    const actionRef = React.useRef(action)

    // Keep action ref up to date
    React.useEffect(() => {
        actionRef.current = action
    }, [action])

    // Track mounted state
    React.useEffect(() => {
        isMounted.current = true
        return () => {
            isMounted.current = false
        }
    }, [])

    const execute = React.useCallback(
        async (...args: T) => {
            // Prevent double execution
            if (isLoading) return

            setIsLoading(true)
            const startTime = Date.now()

            try {
                await actionRef.current(...args)
                
                // Ensure minimum loading time for UX
                if (options.minLoadingTime) {
                    const elapsed = Date.now() - startTime
                    if (elapsed < options.minLoadingTime) {
                        await new Promise(resolve => 
                            setTimeout(resolve, options.minLoadingTime! - elapsed)
                        )
                    }
                }

                if (isMounted.current) {
                    options.onSuccess?.()
                }
            } catch (error) {
                if (isMounted.current) {
                    options.onError?.(error instanceof Error ? error : new Error(String(error)))
                }
                throw error
            } finally {
                if (isMounted.current) {
                    setIsLoading(false)
                }
            }
        },
        [isLoading, options]
    )

    const reset = React.useCallback(() => {
        setIsLoading(false)
    }, [])

    return {
        execute,
        isLoading,
        reset
    }
}

// ==========================================
// useDebounceClick Hook
// ==========================================
// Prevents rapid consecutive clicks on a button
// Different from loading state - this is for instant actions
// that shouldn't fire repeatedly.
//
// Usage:
// const debouncedClick = useDebounceClick(handleClick, 300)
// <Button onClick={debouncedClick}>Click me</Button>
// ==========================================

export function useDebounceClick<T extends unknown[]>(
    callback: (...args: T) => void,
    delay: number = 300
) {
    const lastClickTime = React.useRef(0)
    const callbackRef = React.useRef(callback)

    React.useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    return React.useCallback(
        (...args: T) => {
            const now = Date.now()
            if (now - lastClickTime.current >= delay) {
                lastClickTime.current = now
                callbackRef.current(...args)
            }
        },
        [delay]
    )
}

// ==========================================
// useThrottleClick Hook
// ==========================================
// Throttles clicks to fire at most once per interval
// Useful for buttons that trigger expensive operations
//
// Usage:
// const throttledClick = useThrottleClick(handleClick, 1000)
// <Button onClick={throttledClick}>Click me</Button>
// ==========================================

export function useThrottleClick<T extends unknown[]>(
    callback: (...args: T) => void,
    interval: number = 1000
) {
    const lastCallTime = React.useRef(0)
    const callbackRef = React.useRef(callback)

    React.useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    return React.useCallback(
        (...args: T) => {
            const now = Date.now()
            if (now - lastCallTime.current >= interval) {
                lastCallTime.current = now
                callbackRef.current(...args)
            }
        },
        [interval]
    )
}
