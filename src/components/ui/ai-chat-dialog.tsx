"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { X, Minus, Maximize2, Minimize2, Send, Loader2, RefreshCw, Plus, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  error?: boolean
}

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

interface AIChatDialogProps {
  isOpen: boolean
  onClose: () => void
  defaultPosition?: Position
  defaultSize?: Size
}

const MIN_WIDTH = 320
const MIN_HEIGHT = 400
const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 500

export function AIChatDialog({
  isOpen,
  onClose,
  defaultPosition,
  defaultSize,
}: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // Position and size state - initialized in useEffect to avoid SSR issues
  const [position, setPosition] = useState<Position>(
    defaultPosition || { x: 0, y: 80 }
  )
  const [size, setSize] = useState<Size>(
    defaultSize || { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  )
  const [isInitialized, setIsInitialized] = useState(false)
  const [preMaximizeState, setPreMaximizeState] = useState<{ position: Position; size: Size } | null>(null)

  // Refs
  const dialogRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragOffset = useRef<Position>({ x: 0, y: 0 })
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })

  // Initialize position on mount (client-side only)
  useEffect(() => {
    if (!isInitialized && typeof window !== "undefined") {
      setPosition(defaultPosition || { x: window.innerWidth - DEFAULT_WIDTH - 24, y: 80 })
      setIsInitialized(true)
    }
  }, [defaultPosition, isInitialized])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    e.preventDefault()
  }, [position, isMaximized])

  // Handle resizing
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return
    isResizing.current = true
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    }
    e.preventDefault()
    e.stopPropagation()
  }, [size, isMaximized])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x))
        const newY = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - dragOffset.current.y))
        setPosition({ x: newX, y: newY })
      }
      if (isResizing.current) {
        const deltaX = e.clientX - resizeStart.current.x
        const deltaY = e.clientY - resizeStart.current.y
        const newWidth = Math.max(MIN_WIDTH, resizeStart.current.width + deltaX)
        const newHeight = Math.max(MIN_HEIGHT, resizeStart.current.height + deltaY)
        setSize({ width: newWidth, height: newHeight })
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
      isResizing.current = false
    }

    if (isOpen) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isOpen, size.width])

  // Toggle maximize
  const toggleMaximize = () => {
    if (isMaximized) {
      if (preMaximizeState) {
        setPosition(preMaximizeState.position)
        setSize(preMaximizeState.size)
      }
      setIsMaximized(false)
    } else {
      setPreMaximizeState({ position, size })
      setPosition({ x: 0, y: 0 })
      setSize({ width: window.innerWidth, height: window.innerHeight })
      setIsMaximized(true)
    }
    setIsMinimized(false)
  }

  // Toggle minimize
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    if (isMaximized) {
      setIsMaximized(false)
      if (preMaximizeState) {
        setPosition(preMaximizeState.position)
        setSize(preMaximizeState.size)
      }
    }
  }

  const [conversationId, setConversationId] = useState<string | null>(null)

  // Send message
  const sendMessage = useCallback(async () => {
    const content = inputValue.trim()
    if (!content || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    }

    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId // Send existing ID if we have one
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

      // Update conversation ID if provided
      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: data.content }
            : msg
        )
      )

    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Ett fel uppstod. Försök igen.", error: true }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, messages, conversationId])

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Clear chat
  const clearChat = () => {
    setMessages([])
    setInputValue("")
  }

  if (!isOpen) return null

  return (
    <div
      ref={dialogRef}
      className={cn(
        "fixed z-50 flex flex-col bg-background border border-border rounded-lg shadow-2xl overflow-hidden",
        isMaximized && "rounded-none",
        isMinimized && "h-auto"
      )}
      style={{
        left: isMaximized ? 0 : position.x,
        top: isMaximized ? 0 : position.y,
        width: isMaximized ? "100vw" : size.width,
        height: isMinimized ? "auto" : isMaximized ? "100vh" : size.height,
      }}
    >
      {/* Header - Draggable */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 bg-purple-100/50 dark:bg-purple-900/20 border-b border-border",
          !isMaximized && "cursor-move"
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            AI Assistent
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6 hover:bg-purple-200/50 dark:hover:bg-purple-800/30"
            onClick={clearChat}
            title="Ny chatt"
          >
            <Plus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 hover:bg-purple-200/50 dark:hover:bg-purple-800/30"
            onClick={toggleMinimize}
            title={isMinimized ? "Expandera" : "Minimera"}
          >
            <Minus className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 hover:bg-purple-200/50 dark:hover:bg-purple-800/30"
            onClick={toggleMaximize}
            title={isMaximized ? "Återställ" : "Maximera"}
          >
            {isMaximized ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 hover:bg-red-200/50 dark:hover:bg-red-800/30 hover:text-red-600"
            onClick={onClose}
            title="Stäng"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Content - Hidden when minimized */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <p className="text-sm">Hur kan jag hjälpa dig?</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "user" ? (
                    <div className="rounded-2xl px-3 py-2 bg-primary text-primary-foreground max-w-[85%]">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[85%]">
                      {message.error ? (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                          {message.content}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={sendMessage}
                          >
                            <RefreshCw className="size-3 mr-1" />
                            Försök igen
                          </Button>
                        </div>
                      ) : message.content ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : isLoading ? (
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Skriv ett meddelande..."
                className="min-h-[40px] max-h-[120px] resize-none text-sm"
                rows={1}
              />
              <Button
                size="icon"
                className="shrink-0"
                onClick={sendMessage}
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </div>

          {/* Resize handle */}
          {!isMaximized && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={handleResizeMouseDown}
            >
              <svg
                className="w-4 h-4 text-muted-foreground/50"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  )
}
