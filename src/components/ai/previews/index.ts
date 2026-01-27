/**
 * AI Preview Components - Index
 * 
 * Re-exports all preview components for easy importing
 */

// Base components
export {
    DocumentPreview,
    DocumentSection,
    DocumentTable,
    DocumentSummaryRow,
    type DocumentPreviewProps
} from "./document-preview"

export {
    FormPreview,
    FormSection,
    FormFieldRow,
    FormTotalRow,
    type FormPreviewProps,
    type FormStatus,
    type FormFieldValidation
} from "./form-preview"

// Document previews
export { PayslipPreview, type PayslipPreviewProps } from "./documents/payslip-preview"
export { BoardMinutesPreview, type BoardMinutesPreviewProps, type BoardMinutesData } from "./documents/board-minutes-preview"
export { FinancialReportPreview, type FinancialReportPreviewProps, type FinancialReportData } from "./documents/financial-report-preview"
export { ShareRegisterPreview, type ShareRegisterPreviewProps, type ShareRegisterData, type Shareholder } from "./documents/share-register-preview"
export { AnnualReportPreview, type AnnualReportPreviewProps, type AnnualReportData } from "./documents/annual-report-preview"
export { AgmPreparationPreview, type AgmPreparationPreviewProps, type AgmPreparationData } from "./documents/agm-preparation-preview"

// Form previews
export { VATFormPreview, type VATFormPreviewProps, type VATDeclarationData } from "./forms/vat-form-preview"
export { AGIFormPreview, type AGIFormPreviewProps, type AGIData } from "./forms/agi-form-preview"
export { TaxDeclarationPreview, type TaxDeclarationPreviewProps, type TaxDeclarationData } from "./forms/tax-declaration-preview"
export { K10FormPreview, type K10FormPreviewProps, type K10Data } from "./forms/k10-form-preview"
