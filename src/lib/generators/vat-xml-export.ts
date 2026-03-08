/**
 * VAT XML Export for Skatteverket (client-side)
 *
 * Generates eSKDUpload XML files conforming to Skatteverket's official DTD Version 6.0.
 * Uses the same Skatteverket element names as the server-side export.
 *
 * Reference: Skatteverket SKV 4700, eSKDUpload DTD 6.0
 */

import { type VatReport, generateFullVatXML } from "@/services/processors/vat"

/**
 * Company information required for VAT declaration
 */
export interface CompanyInfo {
    organisationsnummer: string  // e.g., "556123-4567"
    momsregistreringsnummer: string  // e.g., "SE556123456701"
    foretagsnamn: string
    gatuadress: string
    postnummer: string
    postort: string
}

/**
 * Export VAT report to Skatteverket eSKDUpload XML format.
 * Delegates to the canonical generateFullVatXML function.
 */
export function exportVatReportToXML(report: VatReport, company: CompanyInfo): string {
    return generateFullVatXML(report, company.organisationsnummer, company.foretagsnamn)
}

/**
 * Download VAT report as XML file
 */
export function downloadVatXML(report: VatReport, company: CompanyInfo): void {
    const xml = exportVatReportToXML(report, company)
    const blob = new Blob([xml], { type: "application/xml;charset=iso-8859-1" })
    const url = URL.createObjectURL(blob)

    const periodSlug = report.period.replace(" ", "_")
    const link = document.createElement("a")
    link.href = url
    link.download = `eSKD_Moms_${periodSlug}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Empty company info placeholder — must be filled from company settings before export
 */
export const defaultCompanyInfo: CompanyInfo = {
    organisationsnummer: "",
    momsregistreringsnummer: "",
    foretagsnamn: "",
    gatuadress: "",
    postnummer: "",
    postort: "",
}
