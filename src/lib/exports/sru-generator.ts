/**
 * SRU Generator
 * 
 * Generates Skatteverket SRU (Standardiserat RäkenskapsUtdrag) files.
 * Format is a text file with specific #-tags.
 */

interface SRUParams {
    period: string
    orgNumber: string
    contactPerson: {
        name: string
        phone: string
        email: string
        address?: string
        postalCode?: string
        city?: string
    }
}

interface PRODParams {
    timestamp: string
    programName: string
    programVersion: string
}

export class SRUGenerator {
    private lines: string[] = []

    constructor(private prod: PRODParams = {
        timestamp: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
        programName: "ScopeAI",
        programVersion: "1.0"
    }) { }

    private addLine(line: string) {
        this.lines.push(line)
    }

    /**
     * Generates databeskrivning (header)
     */
    public generateHeader() {
        this.addLine(`#DATABESKRIVNING_START`)
        this.addLine(`#PRODUKT ${this.prod.programName}`)
        this.addLine(`#PROGRAM ${this.prod.programName} ${this.prod.programVersion}`)
        this.addLine(`#SKAPAD ${this.prod.timestamp}`)
        this.addLine(`#DATABESKRIVNING_SLUT`)
    }

    /**
     * Add Medie-leverantör (who submits the file)
     */
    public addMediaProvider(info: SRUParams['contactPerson']) {
        this.addLine(`#MEDIELEVERANTÖR_START`)
        this.addLine(`#ORGNR ${info.phone}`) // Usually orgnr or personnr
        this.addLine(`#NAMN ${info.name}`)
        this.addLine(`#ADRESS ${info.address || ''}`)
        this.addLine(`#POSTNR ${info.postalCode || ''}`)
        this.addLine(`#POSTORT ${info.city || ''}`)
        this.addLine(`#MEDIELEVERANTÖR_SLUT`)
    }

    /**
     * Add a generic form (Blankett)
     * @param code Form code (e.g. MOMS-2024, INK2-2024)
     * @param fields Key-value pairs of field codes (e.g. 7000) and values
     */
    public addForm(code: string, orgNumber: string, period: string, fields: Record<string, string | number>) {
        this.addLine(`#BLANKETT ${code}`)
        this.addLine(`#IDENTITET ${orgNumber.replace(/\D/g, '')} ${period}`)

        // Add info fields (usually generic for all forms)
        // const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        this.addLine(`#NAMN ${fields['contactName'] || ''}`)

        // Add specific fields
        for (const [key, value] of Object.entries(fields)) {
            // Skip control fields we might add manually
            if (key === 'contactName') continue

            this.addLine(`#UPPGIFT ${key} ${value}`)
        }

        this.addLine(`#BLANKETT_SLUT`)
    }

    public addFileFooter() {
        this.addLine(`#FIL_SLUT`)
    }

    public toString() {
        return this.lines.join('\r\n')
    }
}

/**
 * Generate a complete SRU file content for VAT (Moms)
 */
export function generateVATSru(
    data: {
        orgNumber: string,
        period: string, // YYYYMM
        vatData: Record<string, number>, // e.g. { '10': 25000, '48': 6250 }
        contact: SRUParams['contactPerson']
    }
): string {
    const generator = new SRUGenerator()
    generator.generateHeader()
    generator.addMediaProvider(data.contact)

    // MOMS form code usually changes by year, e.g. SKV4700-2024
    // Using generic for now
    const year = new Date().getFullYear()

    generator.addForm(`SKV4700-${year}`, data.orgNumber, data.period, {
        ...data.vatData,
        contactName: data.contact.name
    })

    generator.addFileFooter()
    return generator.toString()
}

/**
 * Generate a complete SRU file content for Tax (INK2)
 */
export function generateINK2Sru(
    data: {
        orgNumber: string,
        period: string, // YYYYMMDD-YYYYMMDD
        taxData: Record<string, number>,
        contact: SRUParams['contactPerson']
    }
): string {
    const generator = new SRUGenerator()
    generator.generateHeader()
    generator.addMediaProvider(data.contact)

    const year = new Date().getFullYear()

    // Main INK2
    generator.addForm(`INK2-${year}`, data.orgNumber, data.period, {
        ...data.taxData,
        contactName: data.contact.name
    })

    generator.addFileFooter()
    return generator.toString()
}
