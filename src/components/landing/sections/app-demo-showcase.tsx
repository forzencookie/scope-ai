"use client"

import { ScopeAILogo } from "@/components/ui/icons/scope-ai-logo"
import { ArrowRight, Paperclip, AtSign, Mic, ChevronDown, Search, SlidersHorizontal, TrendingDown, CheckCircle2, Plus, Building2, Calendar, Banknote, AlertCircle, UploadCloud, FileText, Tag } from "lucide-react"
import { AppStatusBadge } from "@/components/ui/status-badge"
import type { AppStatus } from "@/lib/status-types"
import { useRef, useEffect, useState } from "react"

export function AppDemoShowcase() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)
    const [ready, setReady] = useState(false)

    const INTERNAL_WIDTH = 1100
    const INTERNAL_HEIGHT = 680

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const styles = getComputedStyle(containerRef.current)
                const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
                const innerWidth = containerRef.current.offsetWidth - paddingX
                const newScale = innerWidth / INTERNAL_WIDTH
                setScale(Math.min(newScale, 1))
                if (!ready) setReady(true)
            }
        }
        updateScale()

        // Use ResizeObserver for stable updates (handles scroll in/out without re-mount flicker)
        const observer = new ResizeObserver(updateScale)
        if (containerRef.current) observer.observe(containerRef.current)

        window.addEventListener("resize", updateScale)
        return () => {
            window.removeEventListener("resize", updateScale)
            observer.disconnect()
        }
    }, [ready])

    return (
        <section className="flex items-center justify-center min-h-screen px-4 w-full py-16">
            <div className="w-full max-w-[440px] md:max-w-[640px] mx-auto">

                {/* Outer glass card — same style as the statement card */}
                <div
                    ref={containerRef}
                    className={`rounded-[2rem] bg-black/30 backdrop-blur-2xl p-3 md:p-4 overflow-hidden transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
                >
                    {/* Inner — the actual app, rendered at full size and scaled down */}
                    <div
                        className="relative overflow-hidden rounded-2xl"
                        style={{ height: INTERNAL_HEIGHT * scale }}
                    >
                        <div
                            className="absolute top-0 left-0 origin-top-left"
                            style={{
                                width: INTERNAL_WIDTH,
                                height: INTERNAL_HEIGHT,
                                transform: `scale(${scale})`,
                            }}
                        >
                            {/* ============================================
                                THE ACTUAL APP LAYOUT (3-part structure)
                                Grey outer → Rounded sidebar left + Rounded main content right
                               ============================================ */}
                            <div className="w-full h-full bg-[#161618] rounded-2xl overflow-hidden flex flex-col">

                                {/* Main body: Sidebar Left + Content Right */}
                                <div className="flex flex-1 min-h-0 p-2 gap-2 overflow-hidden">

                                    {/* LEFT: AI Sidebar — sits on base grey bg */}
                                    <div className="w-[280px] flex flex-col shrink-0">

                                        {/* Sidebar Header — directly on base bg, no own background */}
                                        <div className="flex items-center gap-2 px-3 py-3">
                                            <ScopeAILogo className="w-5 h-5 text-white" />
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-semibold text-white leading-tight">Scope AI</span>
                                                <span className="text-[10px] text-white/40 leading-tight">AI Assistent</span>
                                            </div>
                                            <ChevronDown className="w-3 h-3 text-white/30 ml-auto" />
                                        </div>

                                        {/* Chat Area — the lighter grey rounded panel */}
                                        <div className="flex-1 flex flex-col mx-1 mb-1 bg-[#27272a] rounded-lg overflow-hidden">

                                            {/* Empty Chat State with Mascot */}
                                            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                                                <svg width="48" height="48" viewBox="0 0 16 16" shapeRendering="crispEdges" className="mb-4">
                                                    <rect x="2" y="2" width="2" height="3" className="fill-amber-500" />
                                                    <rect x="12" y="2" width="2" height="3" className="fill-amber-500" />
                                                    <rect x="3" y="4" width="10" height="6" className="fill-amber-300" />
                                                    <rect x="5" y="5" width="6" height="4" className="fill-amber-50" />
                                                    <rect x="5" y="6" width="2" height="2" className="fill-gray-900" />
                                                    <rect x="9" y="6" width="2" height="2" className="fill-gray-900" />
                                                    <rect x="5" y="6" width="1" height="1" className="fill-white" />
                                                    <rect x="9" y="6" width="1" height="1" className="fill-white" />
                                                    <rect x="7" y="8" width="2" height="1" className="fill-gray-900" />
                                                    <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
                                                    <rect x="4" y="10" width="8" height="4" className="fill-amber-300" />
                                                    <rect x="6" y="10" width="4" height="3" className="fill-amber-50" />
                                                    <rect x="12" y="11" width="2" height="2" className="fill-amber-500" />
                                                    <rect x="4" y="14" width="2" height="1" className="fill-amber-500" />
                                                    <rect x="10" y="14" width="2" height="1" className="fill-amber-500" />
                                                </svg>
                                                <p className="text-sm font-medium text-white">God natt!</p>
                                                <p className="text-xs text-white/40 mt-1">Hur kan jag hjälpa dig?</p>
                                            </div>

                                            {/* Chat Input */}
                                            <div className="p-2.5">
                                                <div className="bg-[#1a1a1a]/30 rounded-xl border-2 border-white/10 p-2.5">
                                                    <div className="text-[13px] text-white/25 mb-3">Skriv ett meddelande...</div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Paperclip className="w-3.5 h-3.5 text-white/25" />
                                                            <AtSign className="w-3.5 h-3.5 text-white/25" />
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[13px]">🧠</span>
                                                                <span className="text-[11px] text-blue-400 font-medium">Smart</span>
                                                                <ChevronDown className="w-2.5 h-2.5 text-white/25" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Mic className="w-3.5 h-3.5 text-white/25" />
                                                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                                <ArrowRight className="w-3 h-3 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[9px] text-white/15 text-center mt-1.5">
                                                    Scope AI kan göra misstag. Kontrollera viktig information.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT: Main Content Area — rounded, black bg */}
                                    <div className="bg-[#0c0c0e] rounded-xl flex flex-col overflow-hidden" style={{ width: 'calc(100% - 288px)' }}>

                                        {/* Content Area */}
                                        <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-5">

                                            {/* Tabs Row (Quick Menu) - Inner border spans exactly the content width */}
                                            <div className="flex items-center gap-1 pb-3 mb-5 border-b-2 border-white/5">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:bg-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-purple-500/10 rounded-md px-3 py-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                    <span className="text-[12px] text-purple-400 font-medium">Kvitton</span>
                                                </div>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:bg-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                                </div>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:bg-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                </div>
                                                <div className="flex items-center justify-center w-8 h-8 rounded-md text-white/30 hover:bg-white/5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                </div>
                                                <div className="flex items-center justify-center w-8 h-8 ml-1 rounded-md text-white/30 hover:bg-white/5">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </div>

                                                <div className="ml-auto text-[11px] text-white/30">
                                                    Senaste uppdaterad: 23:00
                                                </div>
                                            </div>

                                            <div className="space-y-4 flex-1 overflow-y-auto pr-1">

                                                {/* Page Header */}
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h2 className="text-xl font-bold text-white">Kvitton logg</h2>
                                                        <p className="text-[13px] text-white/40 mt-0.5">Ladda upp och hantera dina kvitton</p>
                                                    </div>
                                                    <button className="flex items-center gap-1.5 bg-white/90 text-black rounded-lg px-3 py-1.5 text-[12px] font-medium">
                                                        <UploadCloud className="w-3.5 h-3.5" /> Ladda upp
                                                    </button>
                                                </div>

                                                {/* Stats Cards (ReceiptsDashboard) */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                            <FileText className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] text-white/40">Antal kvitton</p>
                                                            <p className="text-xl font-bold text-white">12</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 to-zinc-900/40">
                                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                                                            <TrendingDown className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] text-white/40">Totalt belopp</p>
                                                            <p className="text-xl font-bold text-white">- 48 350,00 kr</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-gradient-to-br from-amber-950/20 to-zinc-900/40 cursor-pointer hover:from-amber-950/40 hover:to-orange-950/40 transition-colors">
                                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-950 flex items-center justify-center">
                                                            <AlertCircle className="h-4 w-4 text-amber-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] text-white/40">Att hantera</p>
                                                            <p className="text-xl font-bold text-white">2</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Separator + Table Area */}
                                                <div>
                                                    <div className="border-b-2 border-white/5" />

                                                    {/* Filter Row */}
                                                    <div className="flex items-center justify-between py-3 mb-2">
                                                        <span className="text-[12px] font-bold text-white/50 tracking-wider uppercase">Alla kvitton</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5">
                                                                <Search className="w-3 h-3 text-white/25" />
                                                                <span className="text-[11px] text-white/25">Sök...</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Table Header */}
                                                    <div className="grid grid-cols-12 items-center bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[11px] font-semibold text-white/50 tracking-wider">
                                                        <div className="col-span-3 flex items-center gap-1.5">
                                                            <Building2 className="w-3.5 h-3.5" />
                                                            LEVERANTÖR
                                                        </div>
                                                        <div className="col-span-2 flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            DATUM
                                                        </div>
                                                        <div className="col-span-2 flex items-center gap-1.5">
                                                            <Tag className="w-3.5 h-3.5" />
                                                            KATEGORI
                                                        </div>
                                                        <div className="col-span-2 flex items-center gap-1.5 justify-end">
                                                            <Banknote className="w-3.5 h-3.5" />
                                                            BELOPP
                                                        </div>
                                                        <div className="col-span-2 flex items-center gap-1.5 justify-center">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            STATUS
                                                        </div>
                                                        <div className="col-span-1 flex items-center justify-end">
                                                            <Paperclip className="w-3.5 h-3.5" />
                                                        </div>
                                                    </div>

                                                    {/* Mock Receipt Rows */}
                                                    <div className="mt-2 space-y-1">
                                                        {/* Row 1 */}
                                                        <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/5 cursor-pointer group hover:bg-white/[0.03] transition-all">
                                                            <div className="col-span-3 text-[14px] font-medium text-white truncate">Clas Ohlson AB</div>
                                                            <div className="col-span-2 text-[13px] text-white/70">24 Feb</div>
                                                            <div className="col-span-2">
                                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">Kontorsmaterial</span>
                                                            </div>
                                                            <div className="col-span-2 text-[14px] font-medium text-white text-right">- 1 249,00 kr</div>
                                                            <div className="col-span-2 flex justify-center">
                                                                <AppStatusBadge status="Matchad" size="sm" />
                                                            </div>
                                                            <div className="col-span-1 flex justify-end">
                                                                <div className="text-white/30 bg-white/5 p-1 rounded-sm">
                                                                    <Paperclip className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 2 */}
                                                        <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/5 cursor-pointer group hover:bg-white/[0.03] transition-all">
                                                            <div className="col-span-3 text-[14px] font-medium text-white truncate">Circle K</div>
                                                            <div className="col-span-2 text-[13px] text-white/70">22 Feb</div>
                                                            <div className="col-span-2">
                                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">Drivmedel</span>
                                                            </div>
                                                            <div className="col-span-2 text-[14px] font-medium text-white text-right">- 892,50 kr</div>
                                                            <div className="col-span-2 flex justify-center">
                                                                <AppStatusBadge status={"Ej matchad" as AppStatus} size="sm" />
                                                            </div>
                                                            <div className="col-span-1 flex justify-end">
                                                                <div className="text-white/30 bg-white/5 p-1 rounded-sm">
                                                                    <Paperclip className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 3 */}
                                                        <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/5 cursor-pointer group hover:bg-white/[0.03] transition-all">
                                                            <div className="col-span-3 text-[14px] font-medium text-white truncate">IKEA AB</div>
                                                            <div className="col-span-2 text-[13px] text-white/70">18 Feb</div>
                                                            <div className="col-span-2">
                                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">Kontorsinredning</span>
                                                            </div>
                                                            <div className="col-span-2 text-[14px] font-medium text-white text-right">- 4 590,00 kr</div>
                                                            <div className="col-span-2 flex justify-center">
                                                                <AppStatusBadge status="Bokförd" size="sm" />
                                                            </div>
                                                            <div className="col-span-1 flex justify-end">
                                                                <div className="text-white/30 bg-white/5 p-1 rounded-sm">
                                                                    <Paperclip className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 4 */}
                                                        <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/5 cursor-pointer group hover:bg-white/[0.03] transition-all">
                                                            <div className="col-span-3 text-[14px] font-medium text-white truncate">Telia Company AB</div>
                                                            <div className="col-span-2 text-[13px] text-white/70">15 Feb</div>
                                                            <div className="col-span-2">
                                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">Telefoni</span>
                                                            </div>
                                                            <div className="col-span-2 text-[14px] font-medium text-white text-right">- 899,00 kr</div>
                                                            <div className="col-span-2 flex justify-center">
                                                                <AppStatusBadge status="Bokförd" size="sm" />
                                                            </div>
                                                            <div className="col-span-1 flex justify-end">
                                                                <div className="text-white/30 bg-white/5 p-1 rounded-sm">
                                                                    <Paperclip className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 5 */}
                                                        <div className="grid grid-cols-12 items-center px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/5 cursor-pointer group hover:bg-white/[0.03] transition-all">
                                                            <div className="col-span-3 text-[14px] font-medium text-white truncate">Webhallen AB</div>
                                                            <div className="col-span-2 text-[13px] text-white/70">10 Feb</div>
                                                            <div className="col-span-2">
                                                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60">IT-utrustning</span>
                                                            </div>
                                                            <div className="col-span-2 text-[14px] font-medium text-white text-right">- 12 450,00 kr</div>
                                                            <div className="col-span-2 flex justify-center">
                                                                <AppStatusBadge status={"Ej matchad" as AppStatus} size="sm" />
                                                            </div>
                                                            <div className="col-span-1 flex justify-end">
                                                                <div className="text-white/30 bg-white/5 p-1 rounded-sm">
                                                                    <Paperclip className="h-3 w-3" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
