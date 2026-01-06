"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Loader2, RefreshCw } from "lucide-react"
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

const MIN_WIDTH = 360
const MIN_HEIGHT = 480
const DEFAULT_WIDTH = 420
const DEFAULT_HEIGHT = 560

export function AIChatDialog({
  isOpen,
  onClose,
  defaultPosition,
  defaultSize,
}: AIChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Position and size state
  const [position, setPosition] = useState<Position>(
    defaultPosition || { x: 0, y: 80 }
  )
  const [size, setSize] = useState<Size>(
    defaultSize || { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }
  )
  const [isInitialized, setIsInitialized] = useState(false)

  // Refs
  const dialogRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const isResizing = useRef(false)
  const dragOffset = useRef<Position>({ x: 0, y: 0 })
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 })

  // Initialize position on mount
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
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
    e.preventDefault()
  }, [position])

  // Handle resizing
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    }
    e.preventDefault()
    e.stopPropagation()
  }, [size])

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
          conversationId
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()

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

  if (!isOpen) return null

  return (
    <div
      ref={dialogRef}
      className="fixed z-50 flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
    >
      {/* Minimal drag handle - just a subtle line at top */}
      <div
        className="h-6 cursor-move flex items-center justify-center shrink-0"
        onMouseDown={handleMouseDown}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
      </div>

      {/* Close button - subtle, top right */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 size-7 rounded-full opacity-50 hover:opacity-100"
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5">
        {messages.length === 0 ? (
          // Empty state - centered greeting
          <div className="flex flex-col items-center justify-center h-full text-center">
            {/* Decorative orb - shiny, liquid-like */}
            <div className="relative w-24 h-24 mb-6">
              {/* Outer glow */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/40 via-red-400/40 to-pink-400/40 blur-xl animate-pulse" />
              {/* Main orb body */}
              <div
                className="absolute inset-2 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse at 30% 30%, #fff 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255,150,100,0.8) 0%, transparent 50%), linear-gradient(135deg, #ff9966 0%, #ff5e62 50%, #ff69b4 100%)',
                  boxShadow: 'inset 0 -8px 20px rgba(0,0,0,0.15), inset 0 8px 20px rgba(255,255,255,0.5), 0 4px 20px rgba(255,100,100,0.4)',
                }}
              />
              {/* Top highlight/reflection */}
              <div
                className="absolute top-3 left-4 w-6 h-4 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, transparent 70%)',
                }}
              />
              {/* Secondary highlight */}
              <div
                className="absolute top-5 left-6 w-2 h-2 rounded-full bg-white/70"
              />
            </div>
            <p className="text-lg text-muted-foreground max-w-[280px]">
              Din AI-assistent för bokföring och ekonomi
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "user" ? (
                  <div className="rounded-2xl px-4 py-2 bg-primary text-primary-foreground max-w-[85%]">
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
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - clean, no borders */}
      <div className="p-4 shrink-0">
        <div className="relative flex items-end bg-muted/50 rounded-xl">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ett meddelande..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pr-12"
            rows={1}
          />
          {/* Send button inside input */}
          <Button
            size="icon"
            className="absolute right-2 bottom-2 size-8 rounded-full"
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Resize handle - subtle */}
      <div
        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-30 hover:opacity-60"
        onMouseDown={handleResizeMouseDown}
      >
        <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22Z" />
        </svg>
      </div>
    </div>
  )
}
