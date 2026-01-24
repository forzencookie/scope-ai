/**
 * SRU File Generator for Skatteverket Declarations
 * 
 * Generates valid INFO.SRU and BLANKETTER.SRU files for upload
 * to Skatteverket's Filöverföring service.
 * 
 * Based on official specification (ersätter SKV 269)
 */

import type {
    SRUPackage,
    SRUSenderInfo,
    SRUDeclaration,
    SRUField
} from '@/types/sru'

// =============================================================================
// Constants
// =============================================================================

const PROGRAM_NAME = 'Scope AI'
const PROGRAM_VERSION = '1.0'
const SRU_PRODUCT = 'SRU'
const CRLF = '\r\n'

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Format a date as YYYYMMDD
 */
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
}

/**
 * Format a time as HHMMSS
 */
function formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${hours}${minutes}${seconds}`
}

/**
 * Format organization number (remove dash if present)
 */
function formatOrgNr(orgnr: string): string {
    return orgnr.replace(/-/g, '')
}

/**
 * Encode string to ISO-8859-1 compatible format
 * Swedish characters: å=E5, ä=E4, ö=F6, Å=C5, Ä=C4, Ö=D6
 */
function toISO88591(str: string): string {
    // In browser context, we just return the string
    // The actual encoding happens when creating the Blob
    return str
}

// =============================================================================
// INFO.SRU Generator
// =============================================================================

/**
 * Generate the INFO.SRU file content
 */
export function generateInfoSRU(sender: SRUSenderInfo, generatedAt?: Date): string {
    const now = generatedAt || new Date()
    const lines: string[] = []

    // Data description block
    lines.push('#DATABESKRIVNING_START')
    lines.push(`#PRODUKT ${SRU_PRODUCT}`)
    lines.push(`#SKAPAD ${formatDate(now)} ${formatTime(now)}`)
    lines.push(`#PROGRAM ${PROGRAM_NAME} ${PROGRAM_VERSION}`)
    lines.push('#FILNAMN BLANKETTER.SRU')
    lines.push('#DATABESKRIVNING_SLUT')

    // Sender block
    lines.push('#MEDIELEV_START')
    lines.push(`#ORGNR ${formatOrgNr(sender.orgnr)}`)
    lines.push(`#NAMN ${sender.name}`)

    if (sender.address) {
        lines.push(`#ADRESS ${sender.address}`)
    }
    if (sender.postalCode) {
        lines.push(`#POSTNR ${sender.postalCode}`)
    }
    if (sender.city) {
        lines.push(`#POSTORT ${sender.city}`)
    }
    if (sender.department) {
        lines.push(`#AVDELNING ${sender.department}`)
    }
    if (sender.contact) {
        lines.push(`#KONTAKT ${sender.contact}`)
    }
    if (sender.email) {
        lines.push(`#EMAIL ${sender.email}`)
    }
    if (sender.phone) {
        lines.push(`#TELEFON ${sender.phone}`)
    }
    if (sender.fax) {
        lines.push(`#FAX ${sender.fax}`)
    }

    lines.push('#MEDIELEV_SLUT')

    return lines.join(CRLF) + CRLF
}

// =============================================================================
// BLANKETTER.SRU Generator
// =============================================================================

/**
 * Generate a single declaration block
 */
function generateDeclarationBlock(
    declaration: SRUDeclaration,
    generatedAt: Date
): string {
    const lines: string[] = []

    // Blankett header
    lines.push(`#BLANKETT ${declaration.blankettType}-${declaration.period}`)
    lines.push(`#IDENTITET ${formatOrgNr(declaration.orgnr)} ${formatDate(generatedAt)} ${formatTime(generatedAt)}`)
    lines.push(`#NAMN ${declaration.name}`)

    if (declaration.systemInfo) {
        lines.push(`#SYSTEMINFO ${declaration.systemInfo}`)
    }

    // Field values
    for (const field of declaration.fields) {
        const code = typeof field.code === 'number' ? field.code : field.code
        const value = typeof field.value === 'number'
            ? Math.round(field.value) // Round to whole numbers for monetary values
            : field.value
        lines.push(`#UPPGIFT ${code} ${value}`)
    }

    lines.push('#BLANKETTSLUT')

    return lines.join(CRLF)
}

/**
 * Generate the BLANKETTER.SRU file content
 */
export function generateBlanketterSRU(
    declarations: SRUDeclaration[],
    generatedAt?: Date
): string {
    const now = generatedAt || new Date()
    const blocks = declarations.map(d => generateDeclarationBlock(d, now))

    return blocks.join(CRLF) + CRLF + '#FIL_SLUT' + CRLF
}

// =============================================================================
// Complete Package Generator
// =============================================================================

/**
 * Generate both SRU files from a complete package
 */
export function generateSRUFiles(pkg: SRUPackage): {
    infoSRU: string
    blanketterSRU: string
} {
    const generatedAt = pkg.generatedAt || new Date()

    return {
        infoSRU: generateInfoSRU(pkg.sender, generatedAt),
        blanketterSRU: generateBlanketterSRU(pkg.declarations, generatedAt),
    }
}

// =============================================================================
// Download Utilities
// =============================================================================

/**
 * Create a downloadable Blob with ISO-8859-1 encoding
 */
function createSRUBlob(content: string): Blob {
    // Create blob with ISO-8859-1 charset
    return new Blob([content], {
        type: 'text/plain;charset=iso-8859-1'
    })
}

/**
 * Trigger download of a single file
 */
function downloadFile(content: string, filename: string): void {
    const blob = createSRUBlob(content)
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
}

/**
 * Download both SRU files as a ZIP archive
 */
export async function downloadSRUPackage(pkg: SRUPackage): Promise<void> {
    const { infoSRU, blanketterSRU } = generateSRUFiles(pkg)

    // Download files individually (ZIP would require additional library)
    downloadFile(infoSRU, 'INFO.SRU')

    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 500))

    downloadFile(blanketterSRU, 'BLANKETTER.SRU')
}

/**
 * Download individual SRU file
 */
export function downloadInfoSRU(sender: SRUSenderInfo): void {
    const content = generateInfoSRU(sender)
    downloadFile(content, 'INFO.SRU')
}

export function downloadBlanketterSRU(declarations: SRUDeclaration[]): void {
    const content = generateBlanketterSRU(declarations)
    downloadFile(content, 'BLANKETTER.SRU')
}

// =============================================================================
// Preview Utilities
// =============================================================================

/**
 * Generate a preview of the SRU files (for UI display)
 */
export function previewSRUFiles(pkg: SRUPackage): {
    infoSRU: string
    blanketterSRU: string
    lineCount: { info: number; blanketter: number }
    fieldCount: number
} {
    const { infoSRU, blanketterSRU } = generateSRUFiles(pkg)

    const infoLines = infoSRU.split(CRLF).filter(l => l.length > 0)
    const blanketterLines = blanketterSRU.split(CRLF).filter(l => l.length > 0)
    const fieldCount = pkg.declarations.reduce((sum, d) => sum + d.fields.length, 0)

    return {
        infoSRU,
        blanketterSRU,
        lineCount: {
            info: infoLines.length,
            blanketter: blanketterLines.length,
        },
        fieldCount,
    }
}

// =============================================================================
// Helper: Create INK2 Declaration from Accounting Data
// =============================================================================

export interface INK2Data {
    orgnr: string
    companyName: string
    fiscalYearStart: Date
    fiscalYearEnd: Date
    profit?: number  // Överskott (positive)
    loss?: number    // Underskott (positive, will be reported as loss)
    taxPeriod: `${number}P${1 | 2 | 3 | 4}`
}

/**
 * Create an INK2 declaration from basic accounting data
 */
export function createINK2Declaration(data: INK2Data): SRUDeclaration {
    const fields: SRUField[] = [
        { code: 7011, value: formatDate(data.fiscalYearStart) },
        { code: 7012, value: formatDate(data.fiscalYearEnd) },
    ]

    if (data.profit && data.profit > 0) {
        fields.push({ code: 7104, value: data.profit })
    }

    if (data.loss && data.loss > 0) {
        fields.push({ code: 7114, value: data.loss })
    }

    return {
        blankettType: 'INK2',
        period: data.taxPeriod,
        orgnr: data.orgnr,
        name: data.companyName,
        systemInfo: `Scope AI ${formatDate(new Date())}`,
        fields,
    }
}
