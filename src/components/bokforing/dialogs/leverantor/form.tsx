"use client"

import * as React from "react"
import {
    Calendar,
    Building2,
    Banknote,
    Tag,
    Hash,
    CreditCard,
    MapPin,
    Globe,
} from "lucide-react"
import { FormField, FormFieldRow } from "@/components/ui/form-field"
import { CATEGORY_OPTIONS } from "../shared/constants"
import { ContractSection, FileUploadSection } from "../shared/form-fields"
import { type SupplierInvoiceFormState } from "./use-form"

interface SupplierInvoiceFormProps {
    formState: SupplierInvoiceFormState
    imagePreview: string | null
    onFieldChange: (field: keyof SupplierInvoiceFormState, value: string) => void
    onFilesSelected: (files: File[]) => void
    onRemoveFile: () => void
}

export function SupplierInvoiceForm({
    formState,
    imagePreview,
    onFieldChange,
    onFilesSelected,
    onRemoveFile,
}: SupplierInvoiceFormProps) {
    return (
        <>
            <FileUploadSection
                file={formState.file}
                fileName={formState.fileName}
                imagePreview={imagePreview}
                onFilesSelected={onFilesSelected}
                onRemove={onRemoveFile}
            />

            {/* Form Fields */}
            <div className="grid gap-4">
                <FormField
                    type="text"
                    label="Leverantör"
                    icon={Building2}
                    value={formState.supplier}
                    onChange={(v) => onFieldChange('supplier', v)}
                    placeholder="T.ex. Leverantör AB"
                />

                <FormFieldRow>
                    <FormField
                        type="text"
                        label="Org-nummer"
                        icon={Hash}
                        value={formState.supplierOrgNr}
                        onChange={(v) => onFieldChange('supplierOrgNr', v)}
                        placeholder="556123-4567"
                    />
                    <FormField
                        type="text"
                        label="Adress"
                        icon={MapPin}
                        value={formState.supplierAddress}
                        onChange={(v) => onFieldChange('supplierAddress', v)}
                        placeholder="Storgatan 1, Stockholm"
                    />
                </FormFieldRow>

                <FormFieldRow>
                    <FormField
                        type="text"
                        label="Fakturanummer"
                        icon={Hash}
                        value={formState.invoiceNumber}
                        onChange={(v) => onFieldChange('invoiceNumber', v)}
                    />
                    <FormField
                        type="text"
                        label="OCR-nummer"
                        icon={CreditCard}
                        value={formState.ocr}
                        onChange={(v) => onFieldChange('ocr', v)}
                    />
                </FormFieldRow>

                <FormFieldRow>
                    <FormField
                        type="date"
                        label="Fakturadatum"
                        icon={Calendar}
                        value={formState.date}
                        onChange={(v) => {
                            onFieldChange('date', v)
                            if (v && !formState.dueDate) {
                                const date = new Date(v)
                                date.setDate(date.getDate() + 30)
                                onFieldChange('dueDate', date.toISOString().split('T')[0])
                            }
                        }}
                    />
                    <FormField
                        type="date"
                        label="Förfallodatum"
                        icon={Calendar}
                        value={formState.dueDate}
                        onChange={(v) => onFieldChange('dueDate', v)}
                    />
                </FormFieldRow>

                <FormFieldRow>
                    <FormField
                        type="text"
                        label="Totalbelopp"
                        icon={Banknote}
                        value={formState.amount}
                        onChange={(v) => onFieldChange('amount', v)}
                        placeholder="0 kr"
                    />
                    <FormField
                        type="text"
                        label="Momsbelopp"
                        icon={Banknote}
                        value={formState.vatAmount}
                        onChange={(v) => onFieldChange('vatAmount', v)}
                        placeholder="0 kr"
                    />
                </FormFieldRow>

                <FormFieldRow>
                    <FormField
                        type="select"
                        label="Kategori"
                        icon={Tag}
                        value={formState.category}
                        onChange={(v) => onFieldChange('category', v)}
                        options={[...CATEGORY_OPTIONS]}
                    />
                    <FormField
                        type="select"
                        label="Valuta"
                        icon={Globe}
                        value={formState.currency}
                        onChange={(v) => onFieldChange('currency', v)}
                        options={[
                            { value: "SEK", label: "SEK" },
                            { value: "EUR", label: "EUR" },
                            { value: "USD", label: "USD" },
                            { value: "GBP", label: "GBP" },
                            { value: "NOK", label: "NOK" },
                            { value: "DKK", label: "DKK" },
                        ]}
                    />
                </FormFieldRow>

                <ContractSection />
            </div>
        </>
    )
}
