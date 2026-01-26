"use client"

import {
    FileText,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Edit3,
} from "lucide-react"
import { useTextMode } from "@/providers/text-mode-provider"
import type { BookableEntity } from "./booking-types"

interface BookingStepConfirmProps {
    entity: BookableEntity
    category: string
    debitAccount: string
    creditAccount: string
    bookingMode: 'ai' | 'manual'
    uploadedFile: File | null
}

export function BookingStepConfirm({
    entity,
    category,
    debitAccount,
    creditAccount,
    bookingMode,
    uploadedFile,
}: BookingStepConfirmProps) {
    const { text } = useTextMode()

    return (
        <div className="space-y-6">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Sammanfattning av bokföring
                </h4>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <p className="text-muted-foreground">Motpart</p>
                        <p className="font-medium">{entity.name}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Belopp</p>
                        <p className="font-medium">{entity.amount}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Kategori</p>
                        <p className="font-medium">
                            {category || '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">Bokföringsmetod</p>
                        <p className="font-medium flex items-center gap-1">
                            {bookingMode === 'ai' ? (
                                <>
                                    <Sparkles className="h-3 w-3 text-violet-600" />
                                    AI-rekommendation
                                </>
                            ) : (
                                <>
                                    <Edit3 className="h-3 w-3" />
                                    Manuell
                                </>
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">{text.bookkeeping.debit}</p>
                        <p className="font-medium">
                            {debitAccount || '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">{text.bookkeeping.credit}</p>
                        <p className="font-medium">
                            {creditAccount || '-'}
                        </p>
                    </div>
                </div>

                {uploadedFile && (
                    <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Bifogat underlag</p>
                        <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{uploadedFile.name}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                        Kontrollera uppgifterna
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                        När du bekräftar skapas en verifikation som sparas i bokföringen.
                    </p>
                </div>
            </div>
        </div>
    )
}
