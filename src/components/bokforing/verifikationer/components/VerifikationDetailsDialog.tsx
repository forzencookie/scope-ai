"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import {
    Download,
    FileText,
    Calendar,
    Landmark,
    CreditCard,
    Receipt,
    Image as ImageIcon,
    Upload,
    Trash2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
} from "lucide-react"
import { Verification } from "../types"
import { PageOverlay } from "@/components/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn, formatCurrency } from "@/lib/utils"
import { verificationService } from "@/services/accounting/verification-service"
import type { VerificationAttachment } from "@/types"

interface VerifikationDetailsOverlayProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    verification: Verification | null
    onDownload: () => void
}

/**
 * VerifikationDetailsOverlay — Immersive detail view for a verification.
 * Shows real journal entries (debit/credit) and attached underlag (BFL 5:6).
 */
export function VerifikationDetailsDialog({
    open,
    onOpenChange,
    verification,
    onDownload,
}: VerifikationDetailsOverlayProps) {
    const [attachments, setAttachments] = useState<VerificationAttachment[]>([])
    const [loadingAttachments, setLoadingAttachments] = useState(false)

    // Fetch attachments when overlay opens
    useEffect(() => {
        if (!open || !verification) {
            setAttachments([])
            return
        }

        let cancelled = false
        setLoadingAttachments(true)

        verificationService
            .getAttachmentsForVerification(String(verification.id))
            .then((data) => {
                if (!cancelled) setAttachments(data)
            })
            .catch(() => {
                if (!cancelled) setAttachments([])
            })
            .finally(() => {
                if (!cancelled) setLoadingAttachments(false)
            })

        return () => { cancelled = true }
    }, [open, verification])

    if (!verification) return null

    const entries = verification.entries || []
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0)
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0)
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
    const hasAttachments = attachments.length > 0

    const scoobyPrompt = `Jag vill titta närmare på eller ändra verifikation ${verification.verificationNumber} från ${verification.date}.`

    const handleUploadUnderlag = () => {
        // Create a hidden file input and trigger it
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/jpeg,image/png,application/pdf"
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            try {
                const attachment = await verificationService.addAttachment(
                    String(verification.id),
                    file,
                    { sourceType: "manual" }
                )
                setAttachments((prev) => [attachment, ...prev])
            } catch (error) {
                console.error('Failed to upload attachment:', error)
            }
        }
        input.click()
    }

    const handleDeleteAttachment = async (attachmentId: string) => {
        try {
            await verificationService.deleteAttachment(attachmentId)
            setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
        } catch (error) {
            console.error('Failed to delete attachment:', error)
        }
    }

    return (
        <PageOverlay
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={`Verifikation ${verification.verificationNumber}`}
            subtitle={verification.description}
            scoobyPrompt={scoobyPrompt}
            status={
                <div className="flex gap-2">
                    {isBalanced ? (
                        <AppStatusBadge status="Bokförd" size="sm" />
                    ) : (
                        <AppStatusBadge status="Obalanserad" size="sm" />
                    )}
                    <AppStatusBadge
                        status={hasAttachments ? "Underlag finns" : "Underlag saknas"}
                        size="sm"
                    />
                </div>
            }
            actions={
                <Button variant="outline" size="sm" onClick={onDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Ladda ner (PDF)
                </Button>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Journal Entries Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Bokföringsposter
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {entries.length > 0 ? (
                                <div className="rounded-lg border overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                <th className="px-4 py-2 text-left font-medium">Konto</th>
                                                <th className="px-4 py-2 text-left font-medium">Beskrivning</th>
                                                <th className="px-4 py-2 text-right font-medium">Debit</th>
                                                <th className="px-4 py-2 text-right font-medium">Kredit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {entries.map((entry, idx) => (
                                                <tr key={idx} className="hover:bg-muted/20">
                                                    <td className="px-4 py-3 font-mono">{entry.account}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {entry.description || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-muted/30 font-bold border-t">
                                                <td colSpan={2} className="px-4 py-2 flex items-center gap-2">
                                                    Totalt
                                                    {isBalanced ? (
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right tabular-nums">
                                                    {formatCurrency(totalDebit)}
                                                </td>
                                                <td className="px-4 py-2 text-right tabular-nums">
                                                    {formatCurrency(totalCredit)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    Inga konteringsrader hittades.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Underlag & Attachments */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                Underlag & Bilagor
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUploadUnderlag}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Ladda upp
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loadingAttachments ? (
                                <div className="py-8 text-center text-muted-foreground text-sm">
                                    Laddar underlag...
                                </div>
                            ) : hasAttachments ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {attachments.map((att) => (
                                        <AttachmentCard
                                            key={att.id}
                                            attachment={att}
                                            onDelete={() => handleDeleteAttachment(att.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed">
                                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Inga underlag bifogade till denna verifikation.
                                    </p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-4"
                                        onClick={handleUploadUnderlag}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Ladda upp underlag
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                                Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Bokföringsdatum
                                </div>
                                <p className="text-sm font-semibold">{verification.date}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Landmark className="h-3.5 w-3.5" />
                                    Primärt konto
                                </div>
                                <p className="text-sm font-semibold">
                                    {verification.konto} — {verification.kontoName}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    Totalbelopp
                                </div>
                                <p className={cn(
                                    "text-lg font-bold",
                                    totalDebit > 0 ? "text-foreground" : ""
                                )}>
                                    {formatCurrency(totalDebit)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="h-3.5 w-3.5" />
                                    Konteringsrader
                                </div>
                                <p className="text-sm font-semibold">{entries.length} st</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">
                                Historik
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-primary/20" />
                                <div className="flex gap-3 relative">
                                    <div className="h-3.5 w-3.5 rounded-full bg-primary mt-1 shrink-0 ring-4 ring-background" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold">Verifikation skapad</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {verification.date} &middot; Scooby
                                        </p>
                                    </div>
                                </div>
                                {hasAttachments && (
                                    <div className="flex gap-3 relative">
                                        <div className="h-3.5 w-3.5 rounded-full bg-primary/30 mt-1 shrink-0 ring-4 ring-background" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold">Underlag bifogat</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {attachments[0]?.uploadedAt?.split("T")[0] || verification.date} &middot; System
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageOverlay>
    )
}

// =============================================================================
// Attachment Card sub-component
// =============================================================================

function AttachmentCard({
    attachment,
    onDelete,
}: {
    attachment: VerificationAttachment
    onDelete: () => void
}) {
    const isImage = attachment.fileType.startsWith("image/")
    const isPdf = attachment.fileType === "application/pdf"

    return (
        <div className="group relative rounded-lg border bg-card overflow-hidden">
            {/* Preview area */}
            {isImage ? (
                <div className="aspect-[4/3] bg-muted relative">
                    <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-full h-full object-cover"
                    />
                    <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
                    >
                        <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                </div>
            ) : (
                <a
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-[4/3] bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                >
                    {isPdf ? (
                        <FileText className="h-12 w-12 text-red-500/60" />
                    ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground/60" />
                    )}
                </a>
            )}

            {/* File info */}
            <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                        {attachment.uploadedAt?.split("T")[0] || "—"}
                        {attachment.sourceType && ` · ${attachment.sourceType}`}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
