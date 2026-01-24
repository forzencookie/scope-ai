// @ts-nocheck
/**
 * VAT XML Export for Skatteverket
 * 
 * Generates XML files compatible with Skatteverket's digital filing system.
 * Based on the official momsdeklaration format.
 */

import { VatReport } from "@/services/processors/vat-processor"

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
 * Convert period string to Skatteverket period format
 * "Q4 2024" -> "202410" (YYYYMM for first month of quarter)
 */
function periodToSkatteverketFormat(period: string): string {
    const [q, year] = period.split(" ")
    const quarter = parseInt(q.replace("Q", ""))
    const month = String((quarter - 1) * 3 + 1).padStart(2, "0")
    return `${year}${month}`
}

/**
 * Format date to ISO format for XML
 */
function formatDateISO(dateStr: string): string {
    // Input might be "2024-02-12" or "12 feb 2025"
    if (dateStr.includes("-")) return dateStr

    // Parse Swedish date format
    const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04",
        maj: "05", jun: "06", jul: "07", aug: "08",
        sep: "09", okt: "10", nov: "11", dec: "12"
    }
    const parts = dateStr.split(" ")
    if (parts.length === 3) {
        const [day, month, year] = parts
        const m = months[month.toLowerCase()] || "01"
        return `${year}-${m}-${day.padStart(2, "0")}`
    }
    return dateStr
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

/**
 * Generate a ruta element only if value is non-zero
 */
function rutaElement(ruta: string, value: number): string {
    if (value === 0) return ""
    return `    <Ruta${ruta}>${Math.round(value)}</Ruta${ruta}>\n`
}

/**
 * Export VAT report to Skatteverket XML format
 */
export function exportVatReportToXML(report: VatReport, company: CompanyInfo): string {
    const today = new Date().toISOString().split("T")[0]
    const periodCode = periodToSkatteverketFormat(report.period)

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Momsdeklaration xmlns="urn:skatteverket:se:moms:deklaration">
  <Header>
    <Organisationsnummer>${escapeXml(company.organisationsnummer)}</Organisationsnummer>
    <Momsregistreringsnummer>${escapeXml(company.momsregistreringsnummer)}</Momsregistreringsnummer>
    <Foretagsnamn>${escapeXml(company.foretagsnamn)}</Foretagsnamn>
    <Gatuadress>${escapeXml(company.gatuadress)}</Gatuadress>
    <Postnummer>${escapeXml(company.postnummer)}</Postnummer>
    <Postort>${escapeXml(company.postort)}</Postort>
    <Period>${periodCode}</Period>
    <Deklarationsdatum>${today}</Deklarationsdatum>
  </Header>
  <Deklarationsinnehall>
`

    // Section A: Momspliktig försäljning
    xml += rutaElement("05", report.ruta05)
    xml += rutaElement("06", report.ruta06)
    xml += rutaElement("07", report.ruta07)
    xml += rutaElement("08", report.ruta08)

    // Section B: Utgående moms
    xml += rutaElement("10", report.ruta10)
    xml += rutaElement("11", report.ruta11)
    xml += rutaElement("12", report.ruta12)

    // Section C: Omvänd skattskyldighet
    xml += rutaElement("20", report.ruta20)
    xml += rutaElement("21", report.ruta21)
    xml += rutaElement("22", report.ruta22)
    xml += rutaElement("23", report.ruta23)
    xml += rutaElement("24", report.ruta24)

    // Section D: Utgående moms på omvänd skattskyldighet
    xml += rutaElement("30", report.ruta30)
    xml += rutaElement("31", report.ruta31)
    xml += rutaElement("32", report.ruta32)

    // Section E: Undantagen försäljning
    xml += rutaElement("35", report.ruta35)
    xml += rutaElement("36", report.ruta36)
    xml += rutaElement("37", report.ruta37)
    xml += rutaElement("38", report.ruta38)
    xml += rutaElement("39", report.ruta39)
    xml += rutaElement("40", report.ruta40)
    xml += rutaElement("41", report.ruta41)
    xml += rutaElement("42", report.ruta42)

    // Section F: Ingående moms
    xml += rutaElement("48", report.ruta48)

    // Section G: Resultat (always include)
    xml += `    <Ruta49>${Math.round(report.ruta49)}</Ruta49>\n`

    // Section H: Import
    xml += rutaElement("50", report.ruta50)
    xml += rutaElement("60", report.ruta60)
    xml += rutaElement("61", report.ruta61)
    xml += rutaElement("62", report.ruta62)

    xml += `  </Deklarationsinnehall>
</Momsdeklaration>`

    return xml
}

/**
 * Download VAT report as XML file
 */
export function downloadVatXML(report: VatReport, company: CompanyInfo): void {
    const xml = exportVatReportToXML(report, company)
    const blob = new Blob([xml], { type: "application/xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `momsdeklaration_${report.period.replace(" ", "_")}.xml`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Default company info for demo/testing
 */
export const defaultCompanyInfo: CompanyInfo = {
    organisationsnummer: "556123-4567",
    momsregistreringsnummer: "SE556123456701",
    foretagsnamn: "Demo AB",
    gatuadress: "Exempelgatan 1",
    postnummer: "123 45",
    postort: "Stockholm",
}
