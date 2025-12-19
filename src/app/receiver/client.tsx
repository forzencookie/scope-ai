"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Bot,
    Trash2,
    ChevronDown,
    ChevronRight,
    Banknote,
    Inbox,
    Landmark,
    Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    getStoredSubmissions,
    clearStoredSubmissions,
    type StoredSubmission,
} from "@/services/myndigheter-client"

const STATUS_LABELS: Record<string, string> = {
    'accepted': 'Godkänd',
    'rejected': 'Avvisad',
    'needs-correction': 'Behöver korrigering',
    'pending-review': 'Under granskning',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof Clock }> = {
    'accepted': { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
    'rejected': { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    'needs-correction': { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
    'pending-review': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
}

const DOCUMENT_LABELS: Record<string, string> = {
    // Skatteverket
    'agi': 'Arbetsgivardeklaration (AGI)',
    'moms': 'Momsdeklaration',
    'k10': 'K10-blankett',
    'inkomstdeklaration': 'Inkomstdeklaration',
    'preliminarskatt': 'Preliminärskatt',
    // Bolagsverket
    'arsredovisning': 'Årsredovisning',
    'andring-styrelse': 'Ändring av styrelse',
    'andring-kapital': 'Ändring av aktiekapital',
    'avregistrering': 'Avregistrering',
}

type Agency = 'skatteverket' | 'bolagsverket'

const AGENCY_CONFIG: Record<Agency, {
    title: string
    description: string
    icon: typeof Landmark
    emptyText: string
}> = {
    skatteverket: {
        title: "🏛️ Skatteverket",
        description: "Ärenden skickade till Skatteverket från din app. AI validerar dokumenten automatiskt.",
        icon: Landmark,
        emptyText: "Inga ärenden hos Skatteverket",
    },
    bolagsverket: {
        title: "🏢 Bolagsverket",
        description: "Ärenden skickade till Bolagsverket från din app.",
        icon: Building2,
        emptyText: "Inga ärenden hos Bolagsverket",
    }
}

export function MyndigheterClient() {
    const searchParams = useSearchParams()
    const tab = searchParams.get("tab") as Agency || "skatteverket"
    const currentAgency = AGENCY_CONFIG[tab] || AGENCY_CONFIG.skatteverket

    const [submissions, setSubmissions] = useState<StoredSubmission[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        const allSubmissions = getStoredSubmissions()
        setSubmissions(allSubmissions.filter(s => s.agency === tab))
    }, [tab])

    const handleClearAll = () => {
        clearStoredSubmissions()
        setSubmissions([])
        setMessage({ type: 'success', text: 'Alla ärenden har rensats' })
        setTimeout(() => setMessage(null), 3000)
    }

    const AgencyIcon = currentAgency.icon

    return (
        <div className="container max-w-5xl py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">{currentAgency.title}</h1>
                <p className="text-gray-600">
                    {currentAgency.description}
                </p>
                {tab === 'skatteverket' && (
                    <p className="text-sm text-gray-500 mt-2">
                        Gå till <strong>Dashboard → Löner → AGI</strong> och klicka &quot;Skicka till Skatteverket&quot; för att testa.
                    </p>
                )}
            </div>

            {message && (
                <div className={cn(
                    "mb-6 p-4 rounded-lg flex items-center gap-2",
                    message.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}>
                    {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    {message.text}
                </div>
            )}

            {submissions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>{currentAgency.emptyText}</p>
                        <p className="text-sm mt-2">Skicka in handlingar från Dashboard.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AgencyIcon className={cn("h-5 w-5", tab === 'bolagsverket' ? "text-purple-600" : "text-blue-600")} />
                            <h2 className="font-semibold">Inlämnade ärenden</h2>
                            <span className="text-sm text-gray-500">({submissions.length})</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleClearAll}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Rensa alla
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {submissions.map((submission) => {
                            const documentLabel = DOCUMENT_LABELS[submission.documentType] || submission.documentType
                            const status = submission.response?.status || 'pending-review'
                            const statusStyle = STATUS_STYLES[status] || STATUS_STYLES['pending-review']
                            const StatusIcon = statusStyle.icon
                            const isExpanded = expandedId === submission.id

                            return (
                                <Card key={submission.id} className="overflow-hidden">
                                    <div
                                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-gray-400">
                                                {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                            </div>
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center",
                                                tab === 'bolagsverket' ? "bg-purple-100" : "bg-blue-100"
                                            )}>
                                                <AgencyIcon className={cn(
                                                    "h-5 w-5",
                                                    tab === 'bolagsverket' ? "text-purple-600" : "text-blue-600"
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium truncate">{documentLabel}</p>
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                                                        statusStyle.bg,
                                                        statusStyle.text
                                                    )}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {STATUS_LABELS[status] || status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    Ref: {submission.response?.referenceNumber || 'Pending...'} • {new Date(submission.submittedAt).toLocaleString('sv-SE')}
                                                </p>
                                            </div>
                                            {submission.response?.aiReview && (
                                                <div className="text-right hidden sm:block">
                                                    <div className="flex items-center gap-1">
                                                        <Bot className="h-4 w-4 text-purple-500" />
                                                        <span className={cn(
                                                            "text-sm font-medium",
                                                            submission.response.aiReview.confidence > 0.8 ? "text-green-600" :
                                                                submission.response.aiReview.confidence > 0.6 ? "text-yellow-600" : "text-red-600"
                                                        )}>
                                                            {Math.round(submission.response.aiReview.confidence * 100)}%
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">AI-konfidens</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t bg-gray-50 p-4 space-y-4">
                                            {submission.response?.aiReview && (
                                                <div className="space-y-3">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        <Bot className="h-4 w-4 text-purple-500" />
                                                        AI-granskning
                                                    </h4>

                                                    {submission.response.aiReview.errors.length > 0 && (
                                                        <div className="bg-red-50 p-3 rounded-lg space-y-2">
                                                            <p className="text-sm font-medium text-red-700">Fel</p>
                                                            {submission.response.aiReview.errors.map((error, i) => (
                                                                <div key={i} className="text-sm text-red-600">
                                                                    • <strong>{error.field}:</strong> {error.message}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {submission.response.aiReview.warnings.length > 0 && (
                                                        <div className="bg-amber-50 p-3 rounded-lg space-y-2">
                                                            <p className="text-sm font-medium text-amber-700">Varningar</p>
                                                            {submission.response.aiReview.warnings.map((warning, i) => (
                                                                <div key={i} className="text-sm text-amber-600">
                                                                    • <strong>{warning.field}:</strong> {warning.message}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {submission.response.aiReview.passed &&
                                                        submission.response.aiReview.errors.length === 0 && (
                                                            <div className="bg-green-50 p-3 rounded-lg">
                                                                <p className="text-sm text-green-700 flex items-center gap-2">
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Dokumentet godkändes av AI-granskningen
                                                                </p>
                                                            </div>
                                                        )}
                                                </div>
                                            )}

                                            {'paymentInfo' in submission.response && submission.response.paymentInfo && (
                                                <div className="bg-white p-4 rounded-lg border space-y-2">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        <Banknote className="h-4 w-4 text-green-600" />
                                                        Betalningsinformation
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Belopp</p>
                                                            <p className="font-semibold">{submission.response.paymentInfo.amount.toLocaleString('sv-SE')} kr</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Förfallodatum</p>
                                                            <p className="font-semibold">{submission.response.paymentInfo.dueDate}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Bankgiro</p>
                                                            <p className="font-mono">{submission.response.paymentInfo.bankgiro}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">OCR-nummer</p>
                                                            <p className="font-mono">{submission.response.paymentInfo.ocr}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {'fee' in submission.response && submission.response.fee && (
                                                <div className="bg-white p-4 rounded-lg border space-y-2">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        <Banknote className="h-4 w-4 text-purple-600" />
                                                        Avgift
                                                    </h4>
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-gray-500">Belopp</p>
                                                            <p className="font-semibold">{submission.response.fee.amount.toLocaleString('sv-SE')} kr</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500">Förfallodatum</p>
                                                            <p className="font-semibold">{submission.response.fee.dueDate}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-white p-4 rounded-lg border">
                                                <h4 className="font-medium mb-2">Inskickad data</h4>
                                                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                                                    {JSON.stringify(submission.data, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
