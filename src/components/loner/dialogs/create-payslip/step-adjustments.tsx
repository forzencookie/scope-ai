"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatMessage } from "./use-create-payslip-logic"

interface StepAdjustmentsProps {
    selectedEmp: { name: string }
    chatMessages: ChatMessage[]
    chatInput: string
    setChatInput: (v: string) => void
    onSendMessage: () => void
    onNext: () => void
    onBack: () => void
}

export function StepAdjustments({
    selectedEmp,
    chatMessages,
    chatInput,
    setChatInput,
    onSendMessage,
    onNext,
    onBack
}: StepAdjustmentsProps) {
    return (
        <div className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 h-[300px] flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center flex-shrink-0">
                                <Bot className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-sm max-w-[85%] border shadow-sm">
                                <p>Hej! Finns det något speciellt som påverkar {selectedEmp.name}s lön denna månad?</p>
                                <p className="text-muted-foreground mt-1 text-xs">T.ex. &quot;3 sjukdagar&quot;, &quot;10 timmar övertid&quot;</p>
                            </div>
                        </div>

                        {chatMessages.map((msg, i) => (
                            <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "")}>
                                <div className={cn(
                                    "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0",
                                    msg.role === "ai" ? "bg-purple-100 dark:bg-purple-900/60" : "bg-blue-100 dark:bg-blue-900/60"
                                )}>
                                    {msg.role === "ai" ? <Bot className="h-4 w-4 text-purple-600" /> : <User className="h-4 w-4 text-blue-600" />}
                                </div>
                                <div className={cn(
                                    "rounded-lg p-3 text-sm max-w-[85%] border shadow-sm",
                                    msg.role === "ai" ? "bg-white dark:bg-zinc-800" : "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                
                <div className="relative mt-4">
                    <Input
                        placeholder="Skriv ett meddelande..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                        className="pr-10"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-primary"
                        onClick={onSendMessage}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onBack}>
                    Tillbaka
                </Button>
                <Button className="flex-1" onClick={onNext}>
                    Nästa: Granska
                </Button>
            </div>
        </div>
    )
}
