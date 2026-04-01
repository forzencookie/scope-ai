"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, User, Terminal, CheckCircle2, Loader2, FileCode2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
    const [displayed, setDisplayed] = useState("")

    useEffect(() => {
        let i = 0
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed(text.slice(0, i + 1))
                i++
            } else {
                clearInterval(timer)
            }
        }, speed)
        return () => clearInterval(timer)
    }, [text, speed])

    return <span>{displayed}</span>
}

function ToolCallSimulation({ name, args, result, active }: { name: string, args: string, result?: string, active?: boolean }) {
    const [open, setOpen] = useState(false)

    return (
        <div className="my-3 border border-border/50 rounded-lg overflow-hidden bg-muted/20 text-sm max-w-[500px]">
            <button 
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors"
                disabled={active && !result}
            >
                <div className="flex items-center gap-2">
                    {active ? (
                        <Loader2 className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                    ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                    <span className="font-mono text-xs text-muted-foreground">{name}</span>
                    <span className="text-xs text-muted-foreground/60 truncate max-w-[150px]">{args}</span>
                </div>
                {result && (open ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />)}
            </button>
            {open && result && (
                <div className="p-3 bg-black/5 dark:bg-black/20 border-t border-border/50 font-mono text-[10px] text-muted-foreground whitespace-pre-wrap overflow-x-auto max-h-[200px]">
                    {result}
                </div>
            )}
        </div>
    )
}

function StreamingChatUi() {
    const userMessage = "Hur hanterar vi semesterlönegrundande frånvaro för föräldraledighet enligt vårt avtal?"
    
    // The simulated markdown text
    const streamContent1 = "Letar i kodbasen för att förstå hur vi hanterar semesterlönegrundande frånvaro...\n\n"
    
    const streamContent2 = "Baserat på `src/lib/payroll-rules.ts` så är föräldraledighet semesterlönegrundande under **de första 120 dagarna** (eller 180 dagar för ensamstående föräldrar) per barn.\n\nReglerna säger:\n1. Du tjänar in semesterdagar precis som om du arbetade under denna period.\n2. För att veta det exakta beloppet behöver vi rulla en lönekörning där jag hämtar `user_id` och beräknar utifrån månadslönen.\n\nSka jag köra en simulering för den aktuella månaden åt dig?"

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl">
            {/* User message */}
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0 self-end">
                    <User className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white shadow-sm inline-block max-w-[85%] text-[15px] leading-relaxed">
                    {userMessage}
                </div>
            </div>

            {/* AI Response Active */}
            <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0 shadow-sm mt-1">
                    <Sparkles className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                    <div className="text-sm font-semibold mb-1 opacity-60">Scooby</div>
                    
                    <div className="text-[15px] leading-relaxed text-foreground">
                        <TypewriterText text={streamContent1} speed={15} />

                        {/* Simulated Tool calls stream */}
                        <div className="my-2 space-y-2">
                            <ToolCallSimulation 
                                name="grep_search" 
                                args='"semesterlönegrundande" in src/lib'
                                result={`[Match] src/lib/payroll-rules.ts:42\nexport const VACATION_ACCRUAL_DAYS_PARENTAL_LEAVE = 120; // 180 if single`}
                                active={false}
                            />
                            {/* <ToolCallSimulation 
                                name="view_file" 
                                args='src/lib/payroll-rules.ts'
                                active={true}
                            /> */}
                        </div>

                        <TypewriterText text={streamContent2} speed={30} />
                        
                        <span className="inline-block w-2 h-4 bg-indigo-500 align-middle animate-pulse ml-1 rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StreamStatesDocumentation() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
            <div className="p-5 rounded-xl border bg-card shadow-sm">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-slate-400" />
                    Text Streaming (Standard)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Vanlig text strömmar tecken för tecken. Markdown renderas löpande (vi bör använda <code>react-markdown</code>). UI:t är en blinkande cursor {`"|"`} på slutet tills streamen stängs.
                </p>
                <div className="p-3 bg-muted rounded-md text-xs font-mono text-muted-foreground">
                    <span className="text-foreground">Självklart!</span><span className="text-indigo-400 animate-pulse">|</span>
                </div>
            </div>

            <div className="p-5 rounded-xl border bg-card shadow-sm">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-orange-400" />
                    Tool Call Streaming (Tools)
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    När AI:n bestämmer sig för att köra ett verktyg (söka i kodbasen, hämta databas-schema) visas en loader-komponent istället för rå JSON. Användaren kan expandera för att se resultatet i en terminal-lik vy.
                </p>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs p-2 rounded bg-muted/40 border border-border/50">
                        <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />
                        <span className="font-mono text-muted-foreground">run_query("SELECT * FROM users")</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function AIStreamingTestPage() {
    // Add key to force re-mount and re-play stream animation
    const [key, setKey] = useState(0)

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="border-b border-border/40 bg-muted/20">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <Link
                        href="/test-ui"
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Alla test-sidor
                    </Link>
                    
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold tracking-tight">AI Streaming UI</h1>
                            <p className="text-sm text-muted-foreground">Visuella koncept för hur vi bygger hanteringen av AI Streaming, Vercel AI SDK Tool Calls och kodbas-läsning.</p>
                        </div>
                        <button 
                            onClick={() => setKey(k => k + 1)}
                            className="text-xs bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-md font-medium transition-colors"
                        >
                            Spela upp igen
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-10">
                <StreamingChatUi key={key} />
                <StreamStatesDocumentation />
            </div>
        </div>
    )
}
