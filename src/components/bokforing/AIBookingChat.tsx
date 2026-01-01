"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Loader2, Check, Bot, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatCurrency } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import type { TransactionWithAI } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ============================================================================
// Account & Category Options
// ============================================================================

const BAS_ACCOUNTS = [
  { value: "1930", label: "1930 - Företagskonto" },
  { value: "2440", label: "2440 - Leverantörsskulder" },
  { value: "3010", label: "3010 - Försäljning varor" },
  { value: "3040", label: "3040 - Försäljning tjänster" },
  { value: "4010", label: "4010 - Inköp varor" },
  { value: "5010", label: "5010 - Lokalhyra" },
  { value: "5410", label: "5410 - Förbrukningsinventarier" },
  { value: "5420", label: "5420 - Programvara" },
  { value: "5600", label: "5600 - Transportmedel" },
  { value: "5800", label: "5800 - Resekostnader" },
  { value: "5810", label: "5810 - Logi" },
  { value: "6071", label: "6071 - Representation (avdragsgill)" },
  { value: "6072", label: "6072 - Representation (ej avdragsgill)" },
  { value: "6110", label: "6110 - Kontorsmaterial" },
  { value: "6212", label: "6212 - Mobiltelefon" },
  { value: "6540", label: "6540 - IT-tjänster" },
  { value: "6570", label: "6570 - Bankkostnader" },
  { value: "6990", label: "6990 - Övriga externa kostnader" },
]

const CATEGORIES = [
  "Intäkter",
  "IT & Programvara",
  "Kontorsmaterial",
  "Representation",
  "Resor",
  "Logi",
  "Lokalhyra",
  "Telefon",
  "Fordon",
  "Försäkringar",
  "Bankkostnader",
  "Övriga kostnader",
]

// ============================================================================
// Types
// ============================================================================

interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  error?: boolean
  isHidden?: boolean
}

export interface BookingData {
  transactionId: string
  useAiSuggestion: boolean
  category: string
  debitAccount: string
  creditAccount: string
  description: string
  attachmentUrl?: string
  attachmentName?: string
}

interface AIBookingChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: TransactionWithAI[]
  onBook: (booking: BookingData) => Promise<void>
}

// ============================================================================
// Interactive Suggestion Card Component
// ============================================================================

interface SuggestionCardProps {
  category: string
  debitAccount: string
  creditAccount: string
  onCategoryChange: (value: string) => void
  onDebitChange: (value: string) => void
  onCreditChange: (value: string) => void
  transactions: TransactionWithAI[]
  isLoading?: boolean
}

function SuggestionCard({
  category,
  debitAccount,
  creditAccount,
  onCategoryChange,
  onDebitChange,
  onCreditChange,
  transactions,
  isLoading = false,
}: SuggestionCardProps) {
  return (
    <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-4">
      {/* Transaction(s) being booked */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {transactions.length === 1 ? "Transaktion" : `${transactions.length} Transaktioner`}
        </div>
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between text-sm py-1.5 px-2 bg-background rounded border">
            <span className="font-medium truncate mr-2">{t.name}</span>
            <span className={cn(
              "font-mono whitespace-nowrap",
              parseAmount(t.amount) >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(parseAmount(t.amount))}
            </span>
          </div>
        ))}
      </div>

      {/* Editable booking fields */}
      <div className={cn("grid grid-cols-1 gap-3", isLoading && "opacity-50 pointer-events-none")}>
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Kategori</label>
          <Select value={category} onValueChange={onCategoryChange} disabled={isLoading}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder={isLoading ? "Analyserar..." : "Välj kategori"} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Accounts - side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Debetkonto</label>
            <Select value={debitAccount} onValueChange={onDebitChange} disabled={isLoading}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder={isLoading ? "..." : "Välj konto"} />
              </SelectTrigger>
              <SelectContent>
                {BAS_ACCOUNTS.map((acc) => (
                  <SelectItem key={acc.value} value={acc.value}>{acc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Kreditkonto</label>
            <Select value={creditAccount} onValueChange={onCreditChange} disabled={isLoading}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder={isLoading ? "..." : "Välj konto"} />
              </SelectTrigger>
              <SelectContent>
                {BAS_ACCOUNTS.map((acc) => (
                  <SelectItem key={acc.value} value={acc.value}>{acc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function AIBookingChat({
  open,
  onOpenChange,
  transactions,
  onBook,
}: AIBookingChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [aiResponseComplete, setAiResponseComplete] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Editable suggestion state
  const [category, setCategory] = useState("")
  const [debitAccount, setDebitAccount] = useState("")
  const [creditAccount, setCreditAccount] = useState("")
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // When dialog opens with transactions, get AI suggestion immediately
  useEffect(() => {
    if (open && transactions.length > 0 && messages.length === 0) {
      getInitialSuggestion()
    }
  }, [open, transactions])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setMessages([])
      setInputValue("")
      setCategory("")
      setDebitAccount("")
      setCreditAccount("")
      setIsLoading(false)
      setAiResponseComplete(false)
      setIsExpanded(false)
    }
  }, [open])

  // Build transaction summary for AI - include ALL relevant details
  const buildTransactionSummary = () => {
    if (transactions.length === 1) {
      const t = transactions[0]
      const amount = parseAmount(t.amount)
      const isIncome = amount >= 0
      return `**Transaktion att bokföra:**
- Namn/Beskrivning: ${t.name}
- Belopp: ${formatCurrency(amount)} (${isIncome ? 'INKOMST - positivt belopp' : 'UTGIFT - negativt belopp'})
- Rått belopp: ${amount}
- Datum: ${t.date}
${t.account ? `- Bankkonto: ${t.account}` : ''}
${t.category ? `- Nuvarande kategori: ${t.category}` : ''}
${t.status ? `- Status: ${t.status}` : ''}`
    } else {
      const lines = transactions.map((t) => {
        const amount = parseAmount(t.amount)
        const isIncome = amount >= 0
        return `- ${t.name}: ${formatCurrency(amount)} (${isIncome ? 'INKOMST' : 'UTGIFT'})`
      }).join('\n')
      
      const totalIncome = transactions.filter(t => parseAmount(t.amount) >= 0).length
      const totalExpenses = transactions.filter(t => parseAmount(t.amount) < 0).length
      
      return `**${transactions.length} transaktioner att bokföra:**
${lines}

Sammanfattning: ${totalIncome} inkomster, ${totalExpenses} utgifter`
    }
  }

  // Get initial AI suggestion
  const getInitialSuggestion = async () => {
    if (transactions.length === 0) return

    setIsLoading(true)
    setAiResponseComplete(false)

    const transactionSummary = buildTransactionSummary()
    const hiddenPrompt = `Analysera och föreslå bokföring: ${transactionSummary}`

    const assistantMessageId = crypto.randomUUID()
    
    setMessages([
      { id: crypto.randomUUID(), role: "user", content: hiddenPrompt, isHidden: true },
      { id: assistantMessageId, role: "assistant", content: "" }
    ])

    try {
      console.log("Sending booking request to AI...")
      const response = await fetch("/api/chat/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: transactions[0],
          transactions: transactions,
          messages: [{ role: "user", content: hiddenPrompt }]
        }),
      })

      console.log("Response status:", response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error:", errorText)
        throw new Error(`Failed to get response: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let fullContent = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          fullContent += text

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
            )
          )
        }

        // Parse and set the editable fields
        const suggestion = parseBookingSuggestion(fullContent)
        if (suggestion) {
          setCategory(suggestion.category)
          setDebitAccount(suggestion.debitAccount)
          setCreditAccount(suggestion.creditAccount)
        }
        setAiResponseComplete(true)
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: "Ett fel uppstod. Försök igen.", error: true }
            : msg
        )
      )
      setAiResponseComplete(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Send follow-up message
  const sendMessage = useCallback(async () => {
    const content = inputValue.trim()
    if (!content || isLoading || transactions.length === 0) return

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
      const conversationHistory = messages
        .filter(m => m.content)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch("/api/chat/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: transactions[0],
          transactions: transactions,
          messages: [
            ...conversationHistory,
            { role: "user", content }
          ]
        }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        let fullContent = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const text = decoder.decode(value, { stream: true })
          fullContent += text

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
            )
          )
        }

        // Update fields if AI provides new suggestion
        const suggestion = parseBookingSuggestion(fullContent)
        if (suggestion) {
          setCategory(suggestion.category)
          setDebitAccount(suggestion.debitAccount)
          setCreditAccount(suggestion.creditAccount)
        }
      }
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
  }, [inputValue, isLoading, messages, transactions])

  // Handle confirm booking
  const handleConfirmBooking = async () => {
    if (transactions.length === 0 || !category || !debitAccount || !creditAccount) return

    setIsBooking(true)
    try {
      for (const transaction of transactions) {
        await onBook({
          transactionId: transaction.id,
          useAiSuggestion: true,
          category,
          debitAccount,
          creditAccount,
          description: "",
        })
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Booking failed:", error)
    } finally {
      setIsBooking(false)
    }
  }

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const canConfirm = category && debitAccount && creditAccount && aiResponseComplete

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        expandable
        onExpandedChange={setIsExpanded}
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          isExpanded 
            ? "md:max-h-[90vh] md:max-w-[90vw]" 
            : "sm:max-w-[600px] h-[700px]"
        )}
      >
        <DialogHeader className="px-4 py-3 border-b bg-purple-50/50 dark:bg-purple-900/10 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Bot className="h-5 w-5 text-purple-600" />
            AI Bokföring
            {transactions.length > 0 && (
              <span className="text-muted-foreground font-normal">
                — {transactions.length === 1 ? transactions[0].name : `${transactions.length} transaktioner`}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Transaction Card - always at top, separate from chat */}
        {transactions.length > 0 && (
          <div className="px-4 pt-4 shrink-0">
            <SuggestionCard
              category={category}
              debitAccount={debitAccount}
              creditAccount={creditAccount}
              onCategoryChange={setCategory}
              onDebitChange={setDebitAccount}
              onCreditChange={setCreditAccount}
              transactions={transactions}
              isLoading={isLoading && !aiResponseComplete}
            />
          </div>
        )}

        {/* AI Explanation Area */}
        <div className={cn(
          "flex-1 overflow-y-auto p-4 space-y-4",
          isExpanded ? "min-h-[300px]" : ""
        )}>
          {/* AI Messages - no background, natural text */}
          {messages
            .filter(m => !m.isHidden)
            .map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" ? (
                  <div className={cn(
                    "prose prose-sm dark:prose-invert max-w-none text-foreground",
                    message.error && "text-destructive"
                  )}>
                    <ReactMarkdown>{message.content || "Tittar på transaktionen..."}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-lg px-4 py-2 bg-primary text-primary-foreground">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
              </div>
            ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Section - Confirm Button + Chat Input */}
        <div className="border-t bg-muted/20">
          {/* Confirm Button */}
          <div className="px-4 py-3 border-b">
            <Button
              className="w-full bg-green-600 hover:bg-green-700 gap-2"
              onClick={handleConfirmBooking}
              disabled={!canConfirm || isBooking}
            >
              {isBooking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isBooking ? "Bokför..." : "Godkänn bokföring"}
            </Button>
          </div>

          {/* Chat Input - always visible */}
          <div className="p-4">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Fråga AI eller be om ändringar..."
                className="min-h-[44px] max-h-[100px] resize-none"
                rows={1}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              T.ex. &quot;Varför 6072?&quot; eller &quot;Ändra till logi&quot;
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function parseAmount(amount: string | number): number {
  if (typeof amount === 'number') return amount
  const cleaned = amount.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

function parseBookingSuggestion(content: string): { category: string; debitAccount: string; creditAccount: string } | null {
  try {
    const categoryMatch = content.match(/\*?\*?Kategori:?\*?\*?\s*([^\n*]+)/i)
    const debitMatch = content.match(/\*?\*?Debetkonto:?\*?\*?\s*(\d{4})/i)
    const creditMatch = content.match(/\*?\*?Kreditkonto:?\*?\*?\s*(\d{4})/i)

    if (debitMatch && creditMatch) {
      return {
        category: categoryMatch?.[1]?.trim() || "Övriga kostnader",
        debitAccount: debitMatch[1],
        creditAccount: creditMatch[1],
      }
    }
    return null
  } catch {
    return null
  }
}
