"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, User, Sparkles, Database, Code, CheckCircle2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

function ToolCallSimulation({ icon: Icon, name, description, result, active, time }: { icon: React.ComponentType<{ className?: string }>, name: string, description: string, result?: string, active?: boolean, time: string }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="my-3 border border-border/60 rounded-xl overflow-hidden bg-background shadow-sm max-w-lg">
            <button 
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors"
                disabled={active && !result}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg",
                        active ? "bg-indigo-50 text-indigo-500" : "bg-emerald-50 text-emerald-500"
                    )}>
                        {active ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Icon className="h-4 w-4" />
                        )}
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-sm text-foreground">{name}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1 text-left">{description}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground/60">{time}</span>
                    {!active && (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                        </div>
                    )}
                    {result && (open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
                </div>
            </button>
            {open && result && (
                <div className="p-4 bg-muted/30 border-t border-border/50 font-mono text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-[300px]">
                    {result}
                </div>
            )}
        </div>
    )
}

export default function TestToolCallStreamingPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border/40 bg-muted/20">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <Link
                        href="/test-ui/ai-streaming"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        AI Streaming
                    </Link>
                    
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg shrink-0">
                            <Code className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold tracking-tight">Tool Call Simulation</h1>
                            <p className="text-sm text-muted-foreground">Hur AI presenterar bakgrundsarbetet när den söker efter data i databas eller kod.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-6">
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 self-end">
                        <User className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white shadow-sm inline-block max-w-[85%] text-[15px] leading-relaxed">
                        Har vi betalat faktura 10243 från leverantören 'Svea Hosting'? Jag behöver veta innan stängning.
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 shadow-sm mt-1">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-sm font-semibold mb-1 opacity-60">Scooby</div>
                        
                        <div className="text-[15px] leading-relaxed text-foreground">
                            Jag ska omedelbart undersöka leverantörsreskontran åt dig.

                            <div className="my-4">
                                <ToolCallSimulation 
                                    icon={Database}
                                    name="Söker i databas" 
                                    description="SELECT * FROM invoices WHERE supplier = 'Svea Hosting'"
                                    result={'[{"id": 10243, "supplier": "Svea Hosting", "amount": 1499.00, "status": "paid", "paidAt": "2026-03-28T09:12:00Z"}]'}
                                    active={false}
                                    time="0.4s"
                                />
                                <ToolCallSimulation 
                                    icon={Code}
                                    name="Läser bokföringsregler" 
                                    description="Hämtar momsregler för IT-tjänster (Konto 5420)"
                                    result={undefined}
                                    active={true}
                                    time="..."
                                />
                            </div>

                            <span className="inline-block w-2 h-4 bg-indigo-500 align-middle animate-pulse ml-1 rounded-sm" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
