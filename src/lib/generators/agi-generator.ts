
interface AGIReportData {
    period: string // "Januari 2025"
    orgNumber: string // "556000-0000"
    totalSalary: number
    tax: number
    contributions: number
    employees: number
}

/**
 * Generates an XML string for the AGI (Arbetsgivardeklaration).
 * This follows a simplified schema for Skatteverket's "Huvuduppgift".
 * Note: A real production AGI requires "Individuppgift" (KU-data) per employee.
 */
export function generateAgiXML(data: AGIReportData): string {
    const timestamp = new Date().toISOString()
    const periodId = parsePeriod(data.period) // e.g., "2025-01"

    return `<?xml version="1.0" encoding="UTF-8"?>
<Skatteverket xmlns="http://xmls.skatteverket.se/se/skatteverket/ai/instans/info/1.0">
  <Avsandare>
    <Program>Scope AI Accounting</Program>
    <Organisationsnummer>${data.orgNumber}</Organisationsnummer>
  </Avsandare>
  <Arbetsgivardeklaration>
    <Period>${periodId}</Period>
    <SkapaTidpunkt>${timestamp}</SkapaTidpunkt>
    <Huvuduppgifter>
      <AntalAnstallda>${data.employees}</AntalAnstallda>
      <TotalBruttolon>${Math.round(data.totalSalary)}</TotalBruttolon>
      <AvdragenSkatt>${Math.round(data.tax)}</AvdragenSkatt>
      <Arbetsgivaravgifter>${Math.round(data.contributions)}</Arbetsgivaravgifter>
      <SummaAttBetala>${Math.round(data.tax + data.contributions)}</SummaAttBetala>
    </Huvuduppgifter>
  </Arbetsgivardeklaration>
</Skatteverket>`
}

/**
 * Helper to converting "Januari 2025" -> "2025-01"
 */
function parsePeriod(periodName: string): string {
    const parts = periodName.split(" ")
    if (parts.length < 2) return new Date().toISOString().substring(0, 7)

    const monthName = parts[0].toLowerCase()
    const year = parts[1]

    const months: Record<string, string> = {
        "januari": "01", "februari": "02", "mars": "03", "april": "04", "maj": "05", "juni": "06",
        "juli": "07", "augusti": "08", "september": "09", "oktober": "10", "november": "11", "december": "12",
        "jan": "01", "feb": "02", "mar": "03", "apr": "04", "jun": "06", "jul": "07", "aug": "08", "sep": "09", "okt": "10", "nov": "11", "dec": "12"
    }

    return `${year}-${months[monthName] || "01"}`
}
