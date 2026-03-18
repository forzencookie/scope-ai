"use client"

import { Button } from "@/components/ui/button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Download, FileText, Calendar, Landmark, CreditCard, Receipt } from "lucide-react"
import { Verification } from "../types"
import { PageOverlay } from "@/components/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface VerifikationDetailsOverlayProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    verification: Verification | null
    onDownload: () => void
}

/**
 * VerifikationDetailsOverlay - Immersive detail view for a verification.
 * Replaces the old VerifikationDetailsDialog.
 */
export function VerifikationDetailsDialog({
    open,
    onOpenChange,
    verification,
    onDownload,
}: VerifikationDetailsOverlayProps) {
    if (!verification) return null

    const scoobyPrompt = `Jag vill titta närmare på eller ändra verifikation ${verification.verificationNumber} från ${verification.date}.`

    return (
        <PageOverlay
            isOpen={open}
            onClose={() => onOpenChange(false)}
            title={`Verifikation ${verification.verificationNumber}`}
            subtitle={verification.description}
            scoobyPrompt={scoobyPrompt}
            status={
                <div className="flex gap-2">
                    <AppStatusBadge
                        status={verification.hasTransaction ? "Transaktion kopplad" : "Transaktion saknas"}
                        size="sm"
                    />
                    <AppStatusBadge
                        status={verification.hasUnderlag ? "Underlag finns" : "Underlag saknas"}
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Bokföringsposter
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
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
                                        <tr className="hover:bg-muted/20">
                                            <td className="px-4 py-3 font-mono">{verification.konto}</td>
                                            <td className="px-4 py-3">{verification.kontoName}</td>
                                            <td className="px-4 py-3 text-right">
                                                {verification.amount >= 0 ? verification.amount.toLocaleString('sv-SE') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {verification.amount < 0 ? Math.abs(verification.amount).toLocaleString('sv-SE') : '-'}
                                            </td>
                                        </tr>
                                        {/* Mock offset row to show balancing */}
                                        <tr className="hover:bg-muted/20">
                                            <td className="px-4 py-3 font-mono">1930</td>
                                            <td className="px-4 py-3">Företagskonto</td>
                                            <td className="px-4 py-3 text-right">
                                                {verification.amount < 0 ? Math.abs(verification.amount).toLocaleString('sv-SE') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {verification.amount >= 0 ? verification.amount.toLocaleString('sv-SE') : '-'}
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-muted/30 font-bold border-t">
                                            <td colSpan={2} className="px-4 py-2">Totalt</td>
                                            <td className="px-4 py-2 text-right">{Math.abs(verification.amount).toLocaleString('sv-SE')}</td>
                                            <td className="px-4 py-2 text-right">{Math.abs(verification.amount).toLocaleString('sv-SE')}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                Underlag & Kvitto
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {verification.hasUnderlag ? (
                                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border/60">
                                    <div className="text-center">
                                        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground font-medium">Förhandsvisning av underlag</p>
                                        <Button variant="link" size="sm">Öppna i nytt fönster</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-muted/20 rounded-lg border-2 border-dashed">
                                    <p className="text-sm text-muted-foreground italic">Inget underlag kopplat till denna verifikation.</p>
                                    <Button variant="secondary" size="sm" className="mt-4" onClick={() => {}}>
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
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Information</CardTitle>
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
                                    Konto
                                </div>
                                <p className="text-sm font-semibold">{verification.konto} - {verification.kontoName}</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    Belopp
                                </div>
                                <p className={cn(
                                    "text-lg font-bold",
                                    verification.amount >= 0 ? "text-green-600" : ""
                                )}>
                                    {verification.amount.toLocaleString('sv-SE')} kr
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary/60">Historik</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-primary/20" />
                                <div className="flex gap-3 relative">
                                    <div className="h-3.5 w-3.5 rounded-full bg-primary mt-1 shrink-0 ring-4 ring-background" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold">Verifikation skapad</p>
                                        <p className="text-[10px] text-muted-foreground">{verification.date} • Scooby</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 relative">
                                    <div className="h-3.5 w-3.5 rounded-full bg-primary/30 mt-1 shrink-0 ring-4 ring-background" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold">Underlag matchat</p>
                                        <p className="text-[10px] text-muted-foreground">{verification.date} • System</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageOverlay>
    )
}
