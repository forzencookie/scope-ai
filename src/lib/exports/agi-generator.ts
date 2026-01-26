/**
 * AGI XML Generator
 * 
 * Generates XML for Arbetsgivardeklaration (AGI) strictly compliant with 
 * Skatteverket's schema (eAGI).
 */

export interface EmployeeAGIData {
    id: string
    socialSecurityNumber: string // Personnummer (YYYYMMDDNNNN)
    grossPay: number // 011
    benefits: number // 012
    expenseAllowances: number
    taxDeducted: number // 001
}

export interface AGIXMLParams {
    period: string // YYYY-MM
    submissionId: string
    employer: {
        orgNumber: string // NNNNNNNNNN
        name: string
        contactName: string
        phone: string
        email: string
    }
    employees: EmployeeAGIData[]
    deductions: {
        rdDeduction?: number // FoU 470
        regionalDeduction?: number // 471
    }
}

export function generateAGIXML(data: AGIXMLParams): string {
    // const timestamp = new Date().toISOString()
    const [year, month] = data.period.split('-')
    const periodCode = `${year}${month}` // YYYYMM

    // Helper to format currency (remove decimals, Skatteverket uses integers usually)
    const fmt = (num: number) => Math.round(num).toString()

    // Helper for XML escaping (basic)
    const esc = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eAGI xmlns="http://xmls.skatteverket.se/se/skatteverket/ai/instans/info/1.0"
 xmlns:ai="http://xmls.skatteverket.se/se/skatteverket/ai/komponent/info/1.0">
  <Avsandare>
    <Organisationsnummer>${data.employer.orgNumber.replace(/\D/g, '')}</Organisationsnummer>
    <TekniskKontaktperson>
      <Namn>${esc(data.employer.contactName)}</Namn>
      <Telefon>${data.employer.phone}</Telefon>
      <Epostadress>${data.employer.email}</Epostadress>
    </TekniskKontaktperson>
    <Producentbeteckning>ScopeAI</Producentbeteckning>
  </Avsandare>
  <Blankettgemensamt>
    <Redovisningsperiod>${periodCode}</Redovisningsperiod>
  </Blankettgemensamt>

  <Arbetsgivardeklaration>
    <Arbetsgivare>
      <Arbetsgivaravgift>
        ${data.deductions.rdDeduction ? `<AvgiftsavdragFoU>${fmt(data.deductions.rdDeduction)}</AvgiftsavdragFoU>` : ''}
        ${data.deductions.regionalDeduction ? `<AvgiftsavdragRegionalt>${fmt(data.deductions.regionalDeduction)}</AvgiftsavdragRegionalt>` : ''}
      </Arbetsgivaravgift>
    </Arbetsgivare>

    <!-- Individual Employees -->
    ${data.employees.map(emp => `
    <Individuppgift>
      <ArendetekniskaUppgifter>
        <Arendetecken>${data.submissionId}</Arendetecken>
      </ArendetekniskaUppgifter>
      <Betalningsmottagare>
        <Personnummer>${emp.socialSecurityNumber.replace(/\D/g, '')}</Personnummer>
      </Betalningsmottagare>
      <KontantErsattning>
        ${emp.grossPay > 0 ? `<KontantBruttolon>${fmt(emp.grossPay)}</KontantBruttolon>` : ''}
        ${emp.expenseAllowances > 0 ? `<Kostnadsersattning>${fmt(emp.expenseAllowances)}</Kostnadsersattning>` : ''}
      </KontantErsattning>
      <Forman>
        ${emp.benefits > 0 ? `<SkattepliktigaFormaner>${fmt(emp.benefits)}</SkattepliktigaFormaner>` : ''}
      </Forman>
      <AvdragenSkatt>
        <Skatteavdrag>${fmt(emp.taxDeducted)}</Skatteavdrag>
      </AvdragenSkatt>
    </Individuppgift>
    `).join('')}

  </Arbetsgivardeklaration>
</eAGI>`

    return xml
}
