"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronDown, ChevronRight, Download, Calendar, FileText, CheckCircle2, Clock, Users, X, Pen } from "lucide-react"
import { cn } from "@/lib/utils"

type MeetingStatus = "planerad" | "genomford" | "overdue"
type MeetingCategory = "bolagsstamma" | "styrelsemote"

const STATUS_META: Record<MeetingStatus, { label: string; dot: string; color: string; badge: string }> = {
    planerad: { label: "Planerad", dot: "bg-blue-500", color: "text-blue-600 dark:text-blue-400", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
    genomford: { label: "Genomförd", dot: "bg-emerald-500", color: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" },
    overdue: { label: "Försenad", dot: "bg-red-500 animate-pulse", color: "text-red-600 dark:text-red-400", badge: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" },
}

const CAT_LABEL: Record<MeetingCategory, string> = {
    bolagsstamma: "Bolagsstämma",
    styrelsemote: "Styrelsemöte",
}

const CAT_COLORS: Record<MeetingCategory, { active: string; iconBg: string; iconColor: string }> = {
    bolagsstamma: { active: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700", iconBg: "bg-violet-100 dark:bg-violet-900/50", iconColor: "text-violet-600 dark:text-violet-400" },
    styrelsemote: { active: "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700", iconBg: "bg-sky-100 dark:bg-sky-900/50", iconColor: "text-sky-600 dark:text-sky-400" },
}

interface Decision { id: string; title: string; type: string }

interface Meeting {
    id: string; year: number; date: string; category: MeetingCategory
    status: MeetingStatus; decisions: Decision[]
    hasProtokoll: boolean; hasKallelse: boolean
}

const MEETINGS: Meeting[] = [
    {
        id: "m1", year: 2025, date: "2025-06-12", category: "bolagsstamma", status: "genomford",
        decisions: [
            { id: "d1", title: "Fastställande av årsredovisning 2024", type: "arsredovisning" },
            { id: "d2", title: "Utdelning 50 000 kr per aktie", type: "utdelning" },
            { id: "d3", title: "Val av styrelse: Erik Lindström ordförande", type: "styrelse" },
        ],
        hasProtokoll: true, hasKallelse: true,
    },
    {
        id: "m2", year: 2025, date: "2025-02-20", category: "styrelsemote", status: "genomford",
        decisions: [
            { id: "d4", title: "Godkännande av budget 2025", type: "budget" },
            { id: "d5", title: "Nyemission 1 000 aktier till kurs 500 kr", type: "nyemission" },
        ],
        hasProtokoll: true, hasKallelse: false,
    },
    {
        id: "m3", year: 2026, date: "2026-06-30", category: "bolagsstamma", status: "overdue",
        decisions: [],
        hasProtokoll: false, hasKallelse: false,
    },
    {
        id: "m4", year: 2024, date: "2024-05-30", category: "bolagsstamma", status: "genomford",
        decisions: [
            { id: "d6", title: "Fastställande av årsredovisning 2023", type: "arsredovisning" },
            { id: "d7", title: "Ingen utdelning beslutad", type: "utdelning" },
        ],
        hasProtokoll: true, hasKallelse: true,
    },
]

type DocView = { meetingId: string; type: "protokoll" | "kallelse" } | null

export default function TestBolagsstammaPage() {
    const [catFilter, setCatFilter] = useState<MeetingCategory | null>(null)
    const [expanded, setExpanded] = useState<string | null>("m3")
    const [docView, setDocView] = useState<DocView>(null)

    const filtered = useMemo(() => {
        return [...MEETINGS].filter(m => !catFilter || m.category === catFilter)
            .sort((a, b) => b.date.localeCompare(a.date))
    }, [catFilter])

    const stats = [
        { label: "Totalt möten", value: MEETINGS.length, icon: Users, gradient: "from-violet-50/60 to-zinc-50 dark:from-violet-950/30 dark:to-zinc-950/40", iconBg: "bg-violet-50 dark:bg-violet-950", iconColor: "text-violet-600 dark:text-violet-400" },
        { label: "Genomförda", value: MEETINGS.filter(m => m.status === "genomford").length, icon: CheckCircle2, gradient: "from-emerald-50/60 to-zinc-50 dark:from-emerald-950/30 dark:to-zinc-950/40", iconBg: "bg-emerald-50 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400" },
        { label: "Protokoll saknas", value: MEETINGS.filter(m => !m.hasProtokoll).length, icon: Clock, gradient: "from-amber-50/60 to-zinc-50 dark:from-amber-950/30 dark:to-zinc-950/40", iconBg: "bg-amber-50 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400" },
    ]

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
                <Link href="/test-ui" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" />Alla test-sidor
                </Link>

                <div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full mb-2">
                        Ägare & Styrning · AB
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight">Möten & Beslut</h1>
                    <p className="text-sm text-muted-foreground mt-1">Bolagsstämmor och styrelsemöten med protokoll och kallelser.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {stats.map(s => {
                        const Icon = s.icon
                        return (
                            <div key={s.label} className={cn("flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-br overflow-hidden", s.gradient)}>
                                <div className={cn("h-9 w-9 shrink-0 rounded-xl flex items-center justify-center", s.iconBg)}>
                                    <Icon className={cn("h-4 w-4", s.iconColor)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground truncate">{s.label}</p>
                                    <p className="text-xl font-bold tabular-nums">{s.value}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Category filter */}
                <div className="flex gap-2">
                    {([null, "bolagsstamma", "styrelsemote"] as const).map(c => {
                        const isActive = catFilter === c
                        const activeStyle = c ? CAT_COLORS[c].active : "bg-foreground/5 text-foreground border-foreground/20"
                        return (
                            <button
                                key={String(c)}
                                onClick={() => setCatFilter(c)}
                                className={cn(
                                    "h-8 px-3.5 rounded-full text-xs font-medium transition-all border",
                                    isActive
                                        ? activeStyle
                                        : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                                )}
                            >
                                {c === null ? `Alla (${MEETINGS.length})` : `${CAT_LABEL[c]} (${MEETINGS.filter(m => m.category === c).length})`}
                            </button>
                        )
                    })}
                </div>

                {/* Meetings list */}
                <div className="space-y-1.5">
                    {filtered.map((m) => {
                        const isExpanded = expanded === m.id
                        const catColor = CAT_COLORS[m.category]
                        return (
                            <div key={m.id} className={cn(
                                "rounded-xl overflow-hidden border transition-all",
                                isExpanded ? "border-border/50 shadow-sm" : "border-transparent"
                            )}>
                                <button
                                    onClick={() => setExpanded(isExpanded ? null : m.id)}
                                    className={cn("w-full flex items-center gap-4 py-4 transition-all px-3 text-left group", !isExpanded && "hover:bg-muted/30")}
                                >
                                    <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold uppercase", catColor.iconBg, catColor.iconColor)}>
                                        {new Date(m.date).toLocaleString("sv-SE", { month: "short" }).replace(".", "").slice(0, 3)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{CAT_LABEL[m.category]} {m.year}</p>
                                            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", STATUS_META[m.status].badge)}>
                                                {STATUS_META[m.status].label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {m.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                                                    m.hasKallelse ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" : "bg-muted/50 text-muted-foreground/40"
                                                )}>
                                                    Kallelse
                                                </span>
                                                <span className={cn(
                                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                                                    m.hasProtokoll ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" : "bg-muted/50 text-muted-foreground/40"
                                                )}>
                                                    Protokoll
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                        <span className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full">{m.decisions.length} beslut</span>
                                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </div>
                                </button>

                                {isExpanded && (<>
                                    <div className="px-3">
                                        <div className="border-t border-border/30 ml-[2.75rem] mr-6" />
                                    </div>
                                    <div className="px-4 py-4 space-y-4">
                                        {m.decisions.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Beslut</p>
                                                {m.decisions.map((d, di) => (
                                                    <div key={d.id} className="flex items-center gap-3 text-sm">
                                                        <span className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {di + 1}
                                                        </span>
                                                        {d.title}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {m.status === "overdue" && (
                                            <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-2 border border-dashed border-border/50">
                                                Inga beslut ännu — fråga Scooby för att förbereda stämman.
                                            </p>
                                        )}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                disabled={!m.hasKallelse}
                                                onClick={() => setDocView({ meetingId: m.id, type: "kallelse" })}
                                                className="h-7 px-3 rounded-lg border border-border/60 text-[10px] font-medium flex items-center gap-1.5 disabled:opacity-30 hover:bg-muted/30 transition-all"
                                            >
                                                <FileText className="h-3 w-3" />Kallelse
                                            </button>
                                            <button
                                                disabled={!m.hasProtokoll}
                                                onClick={() => setDocView({ meetingId: m.id, type: "protokoll" })}
                                                className="h-7 px-3 rounded-lg border border-border/60 text-[10px] font-medium flex items-center gap-1.5 disabled:opacity-30 hover:bg-muted/30 transition-all"
                                            >
                                                <FileText className="h-3 w-3" />Protokoll
                                            </button>
                                        </div>
                                    </div>
                                </>)}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Document overlay */}
            {docView && (() => {
                const meeting = MEETINGS.find(m => m.id === docView.meetingId)
                if (!meeting) return null
                const isProtokoll = docView.type === "protokoll"

                return (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setDocView(null)}>
                        <div className="bg-background border border-border rounded-2xl max-w-lg w-full m-4 shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 pt-5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", CAT_COLORS[meeting.category].iconBg)}>
                                        <FileText className={cn("h-4 w-4", CAT_COLORS[meeting.category].iconColor)} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{isProtokoll ? "Protokoll" : "Kallelse"}</p>
                                        <p className="text-[10px] text-muted-foreground">{CAT_LABEL[meeting.category]} {meeting.year}</p>
                                    </div>
                                </div>
                                <button onClick={() => setDocView(null)} className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {/* Document body */}
                            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                                {/* Company header */}
                                <div className="text-center space-y-1 pb-4 border-b border-dashed border-border/40">
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Scope Consulting AB</p>
                                    <p className="text-[10px] text-muted-foreground">Org.nr 559XXX-XXXX</p>
                                    <p className="text-base font-bold mt-2">
                                        {isProtokoll ? "Protokoll fört vid" : "Kallelse till"} {CAT_LABEL[meeting.category].toLowerCase()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{meeting.date}</p>
                                </div>

                                {isProtokoll ? (
                                    <>
                                        {/* Meeting details */}
                                        <div className="space-y-0">
                                            {[
                                                { label: "Tid", value: meeting.date + ", kl. 10:00" },
                                                { label: "Plats", value: "Bolagets kontor, Stockholm" },
                                                { label: "Närvarande", value: "Erik Lindström (ordförande), Sara Johansson" },
                                                { label: "Protokollförare", value: "Sara Johansson" },
                                            ].map(row => (
                                                <div key={row.label} className="flex justify-between py-2 border-b border-dashed border-border/40 last:border-0">
                                                    <span className="text-xs text-muted-foreground">{row.label}</span>
                                                    <span className="text-xs text-right max-w-[60%]">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Decisions */}
                                        {meeting.decisions.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Beslut</p>
                                                {meeting.decisions.map((d, i) => (
                                                    <div key={d.id} className="space-y-1">
                                                        <p className="text-xs font-semibold">§ {i + 1}. {d.title}</p>
                                                        <p className="text-xs text-muted-foreground pl-4">
                                                            {d.type === "arsredovisning" && "Stämman beslutade att fastställa den framlagda årsredovisningen för räkenskapsåret."}
                                                            {d.type === "utdelning" && "Stämman beslutade i enlighet med styrelsens förslag om vinstdisposition."}
                                                            {d.type === "styrelse" && "Stämman beslutade att välja styrelse enligt ovan för tiden intill nästa årsstämma."}
                                                            {d.type === "budget" && "Styrelsen godkände den presenterade budgeten för verksamhetsåret."}
                                                            {d.type === "nyemission" && "Styrelsen beslutade om nyemission med stöd av bemyndigande från bolagsstämman."}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Signatures */}
                                        <div className="space-y-4 pt-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Underskrifter</p>
                                            <div className="grid grid-cols-2 gap-6">
                                                {["Erik Lindström", "Sara Johansson"].map(name => (
                                                    <div key={name} className="space-y-2">
                                                        <div className="h-10 border-b border-border/60 flex items-end justify-center pb-1">
                                                            <Pen className="h-3 w-3 text-muted-foreground/30" />
                                                        </div>
                                                        <p className="text-[10px] text-center text-muted-foreground">{name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Kallelse content */}
                                        <div className="space-y-1">
                                            <p className="text-xs">
                                                Aktieägarna i Scope Consulting AB kallas härmed till {CAT_LABEL[meeting.category].toLowerCase()}.
                                            </p>
                                        </div>

                                        <div className="space-y-0">
                                            {[
                                                { label: "Datum", value: meeting.date },
                                                { label: "Tid", value: "kl. 10:00" },
                                                { label: "Plats", value: "Bolagets kontor, Stockholm" },
                                            ].map(row => (
                                                <div key={row.label} className="flex justify-between py-2 border-b border-dashed border-border/40 last:border-0">
                                                    <span className="text-xs text-muted-foreground">{row.label}</span>
                                                    <span className="text-xs">{row.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Dagordning */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dagordning</p>
                                            {[
                                                "Stämmans öppnande",
                                                "Val av ordförande vid stämman",
                                                "Upprättande och godkännande av röstlängd",
                                                "Val av justerare",
                                                "Godkännande av dagordning",
                                                ...(meeting.decisions.map((d, i) => d.title)),
                                                "Stämmans avslutande",
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-3 text-xs">
                                                    <span className="text-muted-foreground tabular-nums shrink-0 w-4 text-right">{i + 1}.</span>
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="text-xs text-muted-foreground pt-2 border-t border-dashed border-border/40">
                                            <p>Anmälan om deltagande skall göras senast tre dagar före stämman.</p>
                                            <p className="mt-2 italic">Stockholm, {new Date(new Date(meeting.date).getTime() - 14 * 86400000).toISOString().slice(0, 10)}</p>
                                            <p className="mt-1 font-medium text-foreground">Styrelsen</p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex gap-2 px-6 py-4 border-t border-border/30">
                                <button onClick={() => setDocView(null)} className="flex-1 h-9 rounded-lg border border-border/60 text-xs hover:bg-muted/30 transition-colors">
                                    Stäng
                                </button>
                                <button className="flex-1 h-9 rounded-lg bg-foreground text-background text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity">
                                    <Download className="h-3.5 w-3.5" />
                                    Ladda ner PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })()}
        </div>
    )
}
