"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { UploadCloud } from "lucide-react"
import { UploadDropzone, FilePreview } from "@/components/ui/upload-dropzone"
import { FormField, FormFieldRow } from "@/components/ui/form-field"
import { CONTRACT_TYPE_OPTIONS, NOTICE_PERIOD_OPTIONS } from "./constants"

/**
 * ContractSection - Reusable contract/subscription section for invoice forms
 */
interface ContractSectionProps {
    contractType?: string
    noticePeriod?: string
    onContractTypeChange?: (value: string) => void
    onNoticePeriodChange?: (value: string) => void
}

export function ContractSection({
    contractType = "tillsvidare",
    noticePeriod = "3",
    onContractTypeChange,
    onNoticePeriodChange,
}: ContractSectionProps) {
    return (
        <div className="pt-4 border-t">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Avtal &amp; Abonnemang</Label>
                        <p className="text-xs text-muted-foreground">
                            Koppla denna faktura till ett avtal för bättre koll på uppsägningstider.
                        </p>
                    </div>
                </div>

                <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
                    <FormFieldRow>
                        <FormField
                            type="select"
                            label="Typ av avtal"
                            value={contractType}
                            onChange={onContractTypeChange ?? (() => {})}
                            options={[...CONTRACT_TYPE_OPTIONS]}
                        />
                        <FormField
                            type="select"
                            label="Uppsägningstid"
                            value={noticePeriod}
                            onChange={onNoticePeriodChange ?? (() => {})}
                            options={[...NOTICE_PERIOD_OPTIONS]}
                        />
                    </FormFieldRow>

                    <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Avtalsdokument (PDF)</Label>
                        <Button variant="outline" size="sm" className="h-8 gap-2 w-full justify-start text-muted-foreground font-normal">
                            <UploadCloud className="h-3.5 w-3.5" />
                            Ladda upp avtal...
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * FileUploadSection - Reusable file upload area with preview
 */
interface FileUploadSectionProps {
    file: File | null
    fileName?: string
    imagePreview: string | null
    onFilesSelected: (files: File[]) => void
    onRemove: () => void
    accept?: string
    title?: string
    description?: string
}

export function FileUploadSection({
    file,
    fileName,
    imagePreview,
    onFilesSelected,
    onRemove,
    accept = ".pdf,.jpg,.jpeg,.png",
    title = "Ladda upp faktura",
    description = "Bifoga PDF eller bild på fakturan",
}: FileUploadSectionProps) {
    if (!file && !fileName) {
        return (
            <UploadDropzone
                onFilesSelected={onFilesSelected}
                accept={accept}
                title={title}
                description={description}
            />
        )
    }

    return (
        <div className="space-y-2">
            {imagePreview && (
                <div className="relative rounded-lg overflow-hidden border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-32 object-contain"
                    />
                </div>
            )}
            <FilePreview
                file={file}
                fileName={fileName}
                onRemove={onRemove}
            />
        </div>
    )
}

export { FormField, FormFieldRow }
