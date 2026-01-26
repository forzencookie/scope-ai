"use client"

import * as React from "react"
import { useCallback, useState } from "react"
import { UploadCloud, File, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// ============================================================================
// UploadDropzone - File upload area pattern
// Replaces: className="border-2 border-dashed border-border rounded-lg p-8 text-center"
// ============================================================================

export interface UploadDropzoneProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'> {
  /** Accepted file types */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Whether multiple files can be uploaded */
  multiple?: boolean
  /** Whether the dropzone is disabled */
  disabled?: boolean
  /** Whether upload is in progress */
  isUploading?: boolean
  /** Callback when files are selected */
  onFilesSelected?: (files: File[]) => void
  /** Callback when files are dropped */
  onDrop?: (files: File[]) => void
  /** Custom icon */
  icon?: React.ReactNode
  /** Title text */
  title?: string
  /** Description text */
  description?: string
  /** Button text */
  buttonText?: string
}

export function UploadDropzone({
  className,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  isUploading = false,
  onFilesSelected,
  onDrop,
  icon,
  title = "Dra och släpp filer här",
  description = "eller klicka för att välja",
  ...props
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      if (maxSize && file.size > maxSize) return false
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim())
        const fileType = file.type
        const fileExt = `.${file.name.split('.').pop()}`
        return acceptedTypes.some(t =>
          t === fileType || t === fileExt || t === '*/*'
        )
      }
      return true
    })

    if (validFiles.length > 0) {
      onDrop?.(multiple ? validFiles : [validFiles[0]])
      onFilesSelected?.(multiple ? validFiles : [validFiles[0]])
    }
  }, [disabled, maxSize, accept, multiple, onDrop, onFilesSelected])

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click()
  }, [disabled])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected?.(files)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }, [onFilesSelected])

  const formatMaxSize = useCallback(() => {
    if (maxSize >= 1024 * 1024) {
      return `${Math.round(maxSize / (1024 * 1024))}MB`
    }
    return `${Math.round(maxSize / 1024)}KB`
  }, [maxSize])

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer flex flex-col items-center justify-center",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      {...props}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
      />

      {isUploading ? (
        <Loader2 className="h-8 w-8 text-muted-foreground mb-2 animate-spin" />
      ) : (
        icon || <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
      )}

      <p className="text-sm text-muted-foreground">
        {title}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {description} • Max {formatMaxSize()}
      </p>
    </div>
  )
}

// ============================================================================
// FilePreview - Preview of uploaded file
// ============================================================================

export interface FilePreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  file?: File | null
  fileName?: string
  fileSize?: number
  onRemove?: () => void
  isUploading?: boolean
  progress?: number
}

export function FilePreview({
  className,
  file,
  fileName,
  fileSize,
  onRemove,
  isUploading = false,
  progress,
  ...props
}: FilePreviewProps) {
  const name = fileName || file?.name || "Fil"
  const size = fileSize || file?.size || 0

  const formatSize = (bytes: number) => {
    if (bytes === 0) return ""
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    return `${Math.round(bytes / 1024)} KB`
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-muted/30",
        className
      )}
      {...props}
    >
      <File className="h-8 w-8 text-muted-foreground shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(size)}
          {isUploading && progress !== undefined && ` • ${progress}%`}
        </p>
        {isUploading && progress !== undefined && (
          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {onRemove && !isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
