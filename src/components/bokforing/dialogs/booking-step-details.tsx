"use client"

import {
    FileText,
    Building2,
    Calendar,
    Banknote,
    CreditCard,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UploadDropzone } from "@/components/ui/upload-dropzone"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import type { AppStatus } from "@/lib/status-types"
import type { BookableEntity } from "./booking-types"

interface BookingStepDetailsProps {
    entity: BookableEntity
    uploadedFile: File | null
    uploadPreview: string | null
    onFileUpload: (files: File[]) => void
    onClearFile: () => void
}

export function BookingStepDetails({
    entity,
    uploadedFile,
    uploadPreview,
    onFileUpload,
    onClearFile,
}: BookingStepDetailsProps) {
    return (
        <div className="space-y-6">
            {/* Info card */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Motpart</p>
                            <p className="font-medium">{entity.name}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Datum</p>
                            <p className="font-medium">{entity.date}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Banknote className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Belopp</p>
                            <p className={cn(
                                "font-medium",
                                entity.amount.startsWith("+")
                                    ? "text-green-600"
                                    : "text-foreground"
                            )}>{entity.amount}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <p className="text-xs text-muted-foreground">Konto</p>
                            <p className="font-medium">{entity.account || '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <AppStatusBadge status={(entity.status as AppStatus) || 'Att bokföra'} />
                    </div>
                </div>
            </div>

            {/* Upload underlag */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Ladda upp underlag (kvitto/faktura)
                </Label>

                {!uploadedFile ? (
                    <UploadDropzone
                        accept=".pdf,.png,.jpg,.jpeg"
                        maxSize={10 * 1024 * 1024}
                        title="Klicka för att ladda upp"
                        description="eller dra och släpp • PDF, PNG, JPG"
                        buttonText="Välj fil"
                        onFilesSelected={onFileUpload}
                    />
                ) : (
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        {uploadPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={uploadPreview}
                                alt="Preview"
                                className="h-16 w-16 object-cover rounded"
                            />
                        ) : (
                            <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="font-medium text-sm">{uploadedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(uploadedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFile}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
