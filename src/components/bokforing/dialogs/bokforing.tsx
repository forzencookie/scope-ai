"use client"

import {
    Check,
    ChevronRight,
    Loader2,
    Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import type { AISuggestion } from "@/types"
import type { BookableEntity, BookingData, BookingStep } from "./booking-types"
import { useBookingDialogLogic } from "./use-booking-dialog-logic"
import { BookingStepDetails } from "./booking-step-details"
import { BookingStepBooking } from "./booking-step-booking"
import { BookingStepConfirm } from "./booking-step-confirm"

// Re-export types for backwards compatibility
export type { BookableEntity, BookingData } from "./booking-types"

interface BookingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    entity: BookableEntity | null
    aiSuggestion?: AISuggestion | null
    onBook: (booking: BookingData) => Promise<void>
}

// Step indicator component
function StepIndicator({ step }: { step: BookingStep }) {
    const steps: { id: BookingStep; label: string }[] = [
        { id: 'details', label: 'Detaljer' },
        { id: 'booking', label: 'Bokföring' },
        { id: 'confirm', label: 'Bekräfta' },
    ]
    
    const currentIndex = steps.findIndex(s => s.id === step)
    
    return (
        <div className="flex items-center gap-2 py-2">
            {steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                    <div className={cn(
                        "flex items-center gap-1.5 text-sm",
                        s.id === step ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                        <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center text-xs",
                            i <= currentIndex ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>{i + 1}</div>
                        {s.label}
                    </div>
                    {i < steps.length - 1 && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            ))}
        </div>
    )
}

export function BookingDialog({
    open,
    onOpenChange,
    entity,
    aiSuggestion,
    onBook,
}: BookingDialogProps) {
    const logic = useBookingDialogLogic({
        entity,
        aiSuggestion,
        onBook,
        onOpenChange,
        open,
    })

    const {
        step,
        setStep,
        uploadedFile,
        uploadPreview,
        category,
        setCategory,
        debitAccount,
        setDebitAccount,
        creditAccount,
        setCreditAccount,
        description,
        setDescription,
        isLoading,
        bookingMode,
        hasAiSuggestion,
        handleOpenChange,
        handleBook,
        handleFileUpload,
        clearFile,
    } = logic

    if (!entity) return null

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Bokför {entity.type === 'invoice' ? 'faktura' : entity.type === 'receipt' ? 'kvitto' : 'transaktion'}
                    </DialogTitle>
                    <DialogDescription>
                        Granska och bokför {entity.type === 'invoice' ? 'fakturan' : entity.type === 'receipt' ? 'kvittot' : 'transaktionen'} med AI-hjälp eller manuellt
                    </DialogDescription>
                </DialogHeader>

                <StepIndicator step={step} />

                {/* Step 1: Entity Details */}
                {step === 'details' && (
                    <BookingStepDetails
                        entity={entity}
                        uploadedFile={uploadedFile}
                        uploadPreview={uploadPreview}
                        onFileUpload={handleFileUpload}
                        onClearFile={clearFile}
                    />
                )}

                {/* Step 2: Booking details */}
                {step === 'booking' && (
                    <BookingStepBooking
                        entity={entity}
                        hasAiSuggestion={hasAiSuggestion}
                        category={category}
                        setCategory={setCategory}
                        debitAccount={debitAccount}
                        setDebitAccount={setDebitAccount}
                        creditAccount={creditAccount}
                        setCreditAccount={setCreditAccount}
                        description={description}
                        setDescription={setDescription}
                    />
                )}

                {/* Step 3: Confirmation */}
                {step === 'confirm' && (
                    <BookingStepConfirm
                        entity={entity}
                        category={category}
                        debitAccount={debitAccount}
                        creditAccount={creditAccount}
                        bookingMode={bookingMode}
                        uploadedFile={uploadedFile}
                    />
                )}

                <DialogFooter className="gap-2">
                    {step === 'details' && (
                        <>
                            <Button variant="outline" className="min-w-24" onClick={() => handleOpenChange(false)}>
                                Avbryt
                            </Button>
                            <Button className="min-w-24" onClick={() => setStep('booking')}>
                                Fortsätt
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </>
                    )}

                    {step === 'booking' && (
                        <>
                            <Button variant="outline" className="min-w-24" onClick={() => setStep('details')}>
                                Tillbaka
                            </Button>
                            <Button
                                className="min-w-24"
                                onClick={() => setStep('confirm')}
                                disabled={bookingMode === 'manual' && !category}
                            >
                                Fortsätt
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </>
                    )}

                    {step === 'confirm' && (
                        <>
                            <Button variant="outline" onClick={() => setStep('booking')}>
                                Tillbaka
                            </Button>
                            <Button
                                onClick={handleBook}
                                disabled={isLoading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Bokför...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Bekräfta bokföring
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
