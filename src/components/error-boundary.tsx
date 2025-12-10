"use client"

import React, { Component, type ReactNode, type ErrorInfo } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// ============================================
// Types
// ============================================

export interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode
  /** Custom fallback UI to render on error */
  fallback?: ReactNode
  /** Callback when an error occurs */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Whether to show the error message in the fallback */
  showErrorMessage?: boolean
  /** Custom reset handler (if not provided, reloads the page) */
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ============================================
// Default Fallback Component
// ============================================

interface DefaultFallbackProps {
  error: Error | null
  showErrorMessage: boolean
  onReset: () => void
}

function DefaultFallback({ error, showErrorMessage, onReset }: DefaultFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-red-100">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Något gick fel
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        Ett oväntat fel uppstod. Försök att ladda om sidan eller kontakta support om problemet kvarstår.
      </p>
      {showErrorMessage && error && (
        <pre className="text-xs text-red-600 bg-red-50 p-2 rounded mb-4 max-w-md overflow-auto">
          {error.message}
        </pre>
      )}
      <Button onClick={onReset} variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Försök igen
      </Button>
    </div>
  )
}

// ============================================
// Error Boundary Component
// ============================================

/**
 * Error boundary component to catch and handle React component errors.
 * Prevents the entire app from crashing when a component throws an error.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary 
 *   onError={(error) => logError(error)}
 *   fallback={<CustomErrorUI />}
 * >
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Store error info for display
    this.setState({ errorInfo })

    // Log error to console
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Call custom reset handler or reload page
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      // Default: reload the current page
      window.location.reload()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render custom fallback or default fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <DefaultFallback
          error={this.state.error}
          showErrorMessage={this.props.showErrorMessage ?? false}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// ============================================
// Wrapper for Functional Components
// ============================================

/**
 * HOC to wrap a component with an error boundary
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <CustomError />,
 *   onError: (error) => console.error(error),
 * })
 * ```
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component"

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  )

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`

  return ComponentWithErrorBoundary
}

// ============================================
// Section Error Boundary (for dashboard sections)
// ============================================

interface SectionErrorBoundaryProps {
  children: ReactNode
  sectionName?: string
}

/**
 * A lightweight error boundary for dashboard sections.
 * Displays a compact error message without disrupting the entire page.
 */
export function SectionErrorBoundary({ children, sectionName }: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center gap-2 p-4 text-sm text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {sectionName ? `Kunde inte ladda ${sectionName}` : "Ett fel uppstod i denna sektion"}
          </span>
        </div>
      }
      showErrorMessage={false}
    >
      {children}
    </ErrorBoundary>
  )
}
