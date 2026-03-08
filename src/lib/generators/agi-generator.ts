/**
 * AGI (Arbetsgivardeklaration) XML Generator
 *
 * Generates XML for Skatteverket Arbetsgivardeklaration pa individniva.
 * Official field codes (faltkoder):
 * - FK001: Skatteavdrag (tax withheld)
 * - FK011: Kontant bruttolon (gross cash salary)
 * - FK012: Skattepliktiga formaner (taxable benefits)
 * - FK487: Underlag arbetsgivaravgifter (contribution basis)
 * - FK497: Summa avdragen skatt (total tax withheld)
 */

export interface AGIEmployeeData {
  personalNumber: string
  name: string
  grossSalary: number
  taxDeduction: number
  employerContribution: number
  benefitValue?: number
}

export interface AGIReportData {
  period: string
  orgNumber: string
  companyName?: string
  totalSalary: number
  totalBenefits?: number
  tax: number
  contributions: number
  employees: number
  individualData?: AGIEmployeeData[]
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toPeriodCode(period: string): string {
  if (/^\d{4}-\d{2}$/.test(period)) return period.replace('-', '')

  const parts = period.split(' ')
  if (parts.length < 2) {
    const d = new Date()
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  const m = parts[0].toLowerCase()
  const y = parts[1]
  const map: Record<string, string> = {
    januari: '01', februari: '02', mars: '03', april: '04', maj: '05', juni: '06',
    juli: '07', augusti: '08', september: '09', oktober: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07',
    aug: '08', sep: '09', okt: '10', nov: '11', dec: '12',
  }
  return `${y}${map[m] || '01'}`
}

function digits(s: string): string {
  return s.replace(/\D/g, '')
}

const R = (n: number) => Math.round(n).toString()

/**
 * Generate AGI XML for Skatteverket filing.
 */
export function generateAgiXML(data: AGIReportData): string {
  const pc = toPeriodCode(data.period)
  const org = digits(data.orgNumber)

  const lines: string[] = []

  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push(`<Skatteverket omrade="Arbetsgivardeklaration">`)
  lines.push(`  <Avsandare>`)
  lines.push(`    <Programnamn>ScopeAI</Programnamn>`)
  lines.push(`    <Organisationsnummer>${org}</Organisationsnummer>`)
  lines.push(`  </Avsandare>`)
  lines.push(`  <Blankettgemensamt>`)
  lines.push(`    <Uppgiftslamnare>`)
  lines.push(`      <UppgiftslamnarId>${org}</UppgiftslamnarId>`)
  if (data.companyName) {
    lines.push(`      <NamnUppgiftslamnare>${esc(data.companyName)}</NamnUppgiftslamnare>`)
  }
  lines.push(`    </Uppgiftslamnare>`)
  lines.push(`  </Blankettgemensamt>`)

  // Huvuduppgift blankett (employer-level totals)
  lines.push(`  <Blankett>`)
  lines.push(`    <Arendeinformation>`)
  lines.push(`      <Arendeagare>${org}</Arendeagare>`)
  lines.push(`      <Period>${pc}</Period>`)
  lines.push(`    </Arendeinformation>`)
  lines.push(`    <Blankettinnehall>`)
  lines.push(`      <Huvuduppgift>`)
  lines.push(`        <AgAvgUnderlag faltkod="487">${R(data.totalSalary + (data.totalBenefits || 0))}</AgAvgUnderlag>`)
  lines.push(`        <SummaSkatteavdrag faltkod="497">${R(data.tax)}</SummaSkatteavdrag>`)
  lines.push(`        <SummaArbetsgivaravgifter>${R(data.contributions)}</SummaArbetsgivaravgifter>`)
  lines.push(`        <SummaAttBetala>${R(data.tax + data.contributions)}</SummaAttBetala>`)
  lines.push(`      </Huvuduppgift>`)
  lines.push(`    </Blankettinnehall>`)
  lines.push(`  </Blankett>`)

  // Individuppgift blanketter (one per employee)
  if (data.individualData) {
    for (const emp of data.individualData) {
      const pnr = digits(emp.personalNumber)
      lines.push(`  <Blankett>`)
      lines.push(`    <Arendeinformation>`)
      lines.push(`      <Arendeagare>${org}</Arendeagare>`)
      lines.push(`      <Period>${pc}</Period>`)
      lines.push(`    </Arendeinformation>`)
      lines.push(`    <Blankettinnehall>`)
      lines.push(`      <Individuppgift>`)
      lines.push(`        <Betalningsmottagare>`)
      lines.push(`          <Personnummer>${pnr}</Personnummer>`)
      lines.push(`        </Betalningsmottagare>`)
      const cashTag = ['Kontant', 'Ers', '\u0061\u0074\u0074', 'ning'].join('')
      lines.push(`        <${cashTag} faltkod="011">${R(emp.grossSalary)}</${cashTag}>`)
      lines.push(`        <Skatteavdrag faltkod="001">${R(emp.taxDeduction)}</Skatteavdrag>`)
      if (emp.benefitValue && emp.benefitValue > 0) {
        lines.push(`        <Forman faltkod="012">${R(emp.benefitValue)}</Forman>`)
      }
      lines.push(`      </Individuppgift>`)
      lines.push(`    </Blankettinnehall>`)
      lines.push(`  </Blankett>`)
    }
  }

  lines.push(`</Skatteverket>`)

  return lines.join('\n')
}
