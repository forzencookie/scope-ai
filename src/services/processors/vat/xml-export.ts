/**
 * VAT XML Export for Skatteverket
 *
 * Generates eSKDUpload XML files conforming to Skatteverket's official DTD:
 * <!DOCTYPE eSKDUpload PUBLIC "-//Skatteverket, Sweden//DTD Skatteverket eSKDUpload-DTD Version 6.0//SV"
 *   "https://www1.skatteverket.se/demoeskd/eSKDUpload_6p0.dtd">
 *
 * XML element names sourced from Skatteverket's official SKV 4700 form specification.
 * Reference: https://learn.microsoft.com/sv-se/dynamics365/finance/localizations/emea-swe-vat-declaration-sweden
 */

import type { VatReport } from './types'

/**
 * Official Skatteverket XML element names for each ruta.
 * These are the DTD-defined tag names used in eSKDUpload files.
 */
const RUTA_TO_XML_ELEMENT: Record<string, string> = {
  // Section A: Momspliktig försäljning
  ruta05: 'ForsMomsEjAnnan',
  ruta06: 'UttagMoms',
  ruta07: 'UlagMargbesk',
  ruta08: 'HyrinkomstFriv',
  // Section B: Utgående moms
  ruta10: 'MomsUtgHog',
  ruta11: 'MomsUtgMedel',
  ruta12: 'MomsUtgLag',
  // Section C: Momspliktiga inköp
  ruta20: 'InkopVaruAnnatEg',
  ruta21: 'InkopTjanstAnnatEg',
  ruta22: 'InkopTjanstUtomEg',
  ruta23: 'InkopVaruSverige',
  ruta24: 'InkopTjanstSverige',
  // Section D: Utgående moms på inköp
  ruta30: 'MomsInkopUtgHog',
  ruta31: 'MomsInkopUtgMedel',
  ruta32: 'MomsInkopUtgLag',
  // Section E: Momsfri försäljning
  ruta35: 'ForsVaruAnnatEg',
  ruta36: 'ForsVaruUtomEg',
  ruta37: 'InkopVaruMellan3p',
  ruta38: 'ForsVaruMellan3p',
  ruta39: 'ForsTjSkskAnnatEg',
  ruta40: 'ForsTjOvrUtomEg',
  ruta41: 'ForsKopareSkskSverige',
  ruta42: 'ForsOvrigt',
  // Section F: Ingående moms
  ruta48: 'MomsIngAvdr',
  // Section H: Import
  ruta50: 'MomsUlagImport',
  ruta60: 'MomsImportUtgHog',
  ruta61: 'MomsImportUtgMedel',
  ruta62: 'MomsImportUtgLag',
}

/** Order of rutor in the XML file (per DTD specification) */
const RUTA_ORDER = [
  'ruta05', 'ruta06', 'ruta07', 'ruta08',
  'ruta10', 'ruta11', 'ruta12',
  'ruta20', 'ruta21', 'ruta22', 'ruta23', 'ruta24',
  'ruta30', 'ruta31', 'ruta32',
  'ruta35', 'ruta36', 'ruta37', 'ruta38', 'ruta39', 'ruta40', 'ruta41', 'ruta42',
  'ruta48',
  'ruta50', 'ruta60', 'ruta61', 'ruta62',
] as const

/**
 * Convert period string to Skatteverket period format.
 * "Q4 2024" → "202410" (YYYYMM for the first month of the quarter)
 */
function periodToSkatteverketFormat(period: string): string {
  const [q, year] = period.split(' ')
  const quarter = parseInt(q.replace('Q', ''))
  const month = String((quarter - 1) * 3 + 1).padStart(2, '0')
  return `${year}${month}`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generates a simplified eSKD XML with only the most common rutor.
 * Use generateFullVatXML for the complete Skatteverket-compliant version.
 *
 * @deprecated Use generateFullVatXML instead for Skatteverket submission.
 */
export function generateVatXML(report: VatReport, orgNumber: string = '556000-0000'): string {
  return generateFullVatXML(report, orgNumber)
}

/**
 * Generate a complete VAT declaration XML file conforming to Skatteverket's
 * eSKDUpload DTD Version 6.0.
 *
 * All rutor with non-zero values are included. Ruta 49 (MomsBetworked/result)
 * is excluded from the file — Skatteverket calculates it server-side.
 */
export function generateFullVatXML(
  report: VatReport,
  orgNumber: string = '556000-0000',
  companyName?: string,
): string {
  const periodCode = periodToSkatteverketFormat(report.period)
  const today = new Date().toISOString().split('T')[0]

  // Build ruta elements — only include non-zero values
  const rutaLines: string[] = []
  for (const field of RUTA_ORDER) {
    const value = report[field as keyof VatReport] as number
    if (value === 0) continue
    const xmlTag = RUTA_TO_XML_ELEMENT[field]
    if (!xmlTag) continue
    rutaLines.push(`      <${xmlTag}>${Math.round(value)}</${xmlTag}>`)
  }

  const escapedOrg = escapeXml(orgNumber)
  const escapedName = companyName ? escapeXml(companyName) : ''

  return `<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE eSKDUpload PUBLIC "-//Skatteverket, Sweden//DTD Skatteverket eSKDUpload-DTD Version 6.0//SV" "https://www1.skatteverket.se/demoeskd/eSKDUpload_6p0.dtd">
<eSKDUpload Version="6.0">
  <OrgNr>${escapedOrg}</OrgNr>
  <Moms>
    <Period>${periodCode}</Period>
    <Uppgift>
${rutaLines.join('\n')}
    </Uppgift>
  </Moms>
</eSKDUpload>`
}
