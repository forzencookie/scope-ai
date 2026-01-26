/**
 * Skatteverket API
 * 
 * This endpoint receives documents from the app (AGI, Moms, K10, etc.)
 * and validates them with AI.
 * 
 * POST /api/skatteverket
 * 
 * Body: {
 *   documentType: 'agi' | 'moms' | 'k10' | 'inkomstdeklaration' | 'preliminarskatt'
 *   data: { ... document data ... }
 * }
 */

import { NextRequest, NextResponse } from "next/server"

// Types
type DocumentType = 'agi' | 'moms' | 'k10' | 'inkomstdeklaration' | 'preliminarskatt'

interface ValidationError {
  field: string
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
}

interface AIReviewResult {
  passed: boolean
  confidence: number
  errors: ValidationError[]
  warnings: ValidationError[]
  suggestions: string[]
  processingTime: number
}

interface SubmissionResponse {
  success: boolean
  submissionId: string
  referenceNumber: string
  status: 'accepted' | 'rejected' | 'needs-correction'
  message: string
  aiReview: AIReviewResult
  paymentInfo?: {
    amount: number
    dueDate: string
    bankgiro: string
    ocr: string
  }
  nextDeadline?: string
}

// Document configurations
const DOCUMENT_CONFIGS: Record<DocumentType, {
  name: string
  requiredFields: string[]
}> = {
  agi: {
    name: 'Arbetsgivardeklaration (AGI)',
    requiredFields: ['period', 'employees', 'totalSalary', 'tax', 'contributions'],
  },
  moms: {
    name: 'Momsdeklaration',
    requiredFields: ['period', 'outputVat', 'inputVat', 'vatToPay'],
  },
  k10: {
    name: 'K10-blankett',
    requiredFields: ['year', 'gransbelopp', 'utdelning'],
  },
  inkomstdeklaration: {
    name: 'Inkomstdeklaration',
    requiredFields: ['year', 'revenue', 'expenses', 'profit'],
  },
  preliminarskatt: {
    name: 'Preliminärskatt',
    requiredFields: ['period', 'amount'],
  },
}

// AI Validation functions
function validateAGI(data: Record<string, unknown>): AIReviewResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const suggestions: string[] = []

  // Check required fields
  if (!data.period) {
    errors.push({ field: 'period', code: 'MISSING_PERIOD', message: 'Period saknas', severity: 'error' })
  }

  const totalSalary = Number(data.totalSalary) || 0
  const tax = Number(data.tax) || 0
  const contributions = Number(data.contributions) || 0
  const employees = Number(data.employees) || 0

  if (totalSalary <= 0) {
    errors.push({ field: 'totalSalary', code: 'INVALID_SALARY', message: 'Total bruttolön måste vara större än 0', severity: 'error' })
  }

  // Validate tax rate (should be around 24-30% of salary)
  if (totalSalary > 0) {
    const taxRate = tax / totalSalary
    if (taxRate < 0.20 || taxRate > 0.35) {
      warnings.push({
        field: 'tax',
        code: 'UNUSUAL_TAX_RATE',
        message: `Skatteavdrag på ${Math.round(taxRate * 100)}% verkar ovanligt (förväntat 24-30%)`,
        severity: 'warning'
      })
    }
  }

  // Validate employer contributions (should be ~31.42%)
  if (totalSalary > 0) {
    const contributionRate = contributions / totalSalary
    if (Math.abs(contributionRate - 0.3142) > 0.02) {
      warnings.push({
        field: 'contributions',
        code: 'INCORRECT_CONTRIBUTION_RATE',
        message: `Arbetsgivaravgifter på ${Math.round(contributionRate * 100)}% avviker från 31,42%`,
        severity: 'warning'
      })
      suggestions.push('Kontrollera att arbetsgivaravgifterna är korrekt beräknade (31,42% av bruttolön)')
    }
  }

  // Check if salary per employee is reasonable
  if (employees > 0 && totalSalary > 0) {
    const avgSalary = totalSalary / employees
    if (avgSalary < 15000) {
      warnings.push({
        field: 'totalSalary',
        code: 'LOW_AVERAGE_SALARY',
        message: `Genomsnittslön ${avgSalary.toLocaleString('sv-SE')} kr/person verkar låg`,
        severity: 'warning'
      })
    }
    if (avgSalary > 150000) {
      warnings.push({
        field: 'totalSalary',
        code: 'HIGH_AVERAGE_SALARY',
        message: `Genomsnittslön ${avgSalary.toLocaleString('sv-SE')} kr/person verkar hög`,
        severity: 'warning'
      })
    }
  }

  const passed = errors.length === 0
  const confidence = Math.max(0.5, 1 - (errors.length * 0.2) - (warnings.length * 0.05))

  return { passed, confidence, errors, warnings, suggestions, processingTime: Math.random() * 1500 + 500 }
}

function validateMoms(data: Record<string, unknown>): AIReviewResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const suggestions: string[] = []

  const outputVat = Number(data.outputVat) || 0
  const inputVat = Number(data.inputVat) || 0
  const vatToPay = Number(data.vatToPay) || 0

  // Check VAT calculation
  const expectedVatToPay = outputVat - inputVat
  if (Math.abs(vatToPay - expectedVatToPay) > 1) {
    errors.push({
      field: 'vatToPay',
      code: 'INCORRECT_VAT_CALCULATION',
      message: `Moms att betala ska vara ${expectedVatToPay.toLocaleString('sv-SE')} kr (utgående ${outputVat.toLocaleString('sv-SE')} - ingående ${inputVat.toLocaleString('sv-SE')})`,
      severity: 'error'
    })
  }

  // Check if input VAT is suspiciously high
  if (inputVat > outputVat * 1.5 && outputVat > 0) {
    warnings.push({
      field: 'inputVat',
      code: 'HIGH_INPUT_VAT',
      message: 'Ingående moms är betydligt högre än utgående - dubbelkolla avdragen',
      severity: 'warning'
    })
  }

  const passed = errors.length === 0
  const confidence = Math.max(0.5, 1 - (errors.length * 0.2) - (warnings.length * 0.05))

  return { passed, confidence, errors, warnings, suggestions, processingTime: Math.random() * 1500 + 500 }
}

function validateK10(data: Record<string, unknown>): AIReviewResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const suggestions: string[] = []

  const gransbelopp = Number(data.gransbelopp) || 0
  const utdelning = Number(data.utdelning) || 0

  if (gransbelopp <= 0) {
    errors.push({ field: 'gransbelopp', code: 'MISSING_GRANSBELOPP', message: 'Gränsbelopp måste anges', severity: 'error' })
  }

  // Check if utdelning exceeds gränsbelopp (would be taxed as income)
  if (utdelning > gransbelopp) {
    warnings.push({
      field: 'utdelning',
      code: 'EXCEEDS_GRANSBELOPP',
      message: `Utdelning ${utdelning.toLocaleString('sv-SE')} kr överstiger gränsbelopp ${gransbelopp.toLocaleString('sv-SE')} kr - överskott beskattas som inkomst av tjänst`,
      severity: 'warning'
    })
    suggestions.push('Överväg att spara utdelningsutrymme till nästa år för lägre skatt')
  }

  const passed = errors.length === 0
  const confidence = Math.max(0.5, 1 - (errors.length * 0.2) - (warnings.length * 0.05))

  return { passed, confidence, errors, warnings, suggestions, processingTime: Math.random() * 1500 + 500 }
}

function validateInkomstdeklaration(data: Record<string, unknown>): AIReviewResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const suggestions: string[] = []

  const revenue = Number(data.revenue) || 0
  const expenses = Number(data.expenses) || 0
  const profit = Number(data.profit) || 0

  // Check profit calculation
  const expectedProfit = revenue - expenses
  if (Math.abs(profit - expectedProfit) > 1) {
    errors.push({
      field: 'profit',
      code: 'INCORRECT_PROFIT_CALCULATION',
      message: `Resultat ska vara ${expectedProfit.toLocaleString('sv-SE')} kr (intäkter ${revenue.toLocaleString('sv-SE')} - kostnader ${expenses.toLocaleString('sv-SE')})`,
      severity: 'error'
    })
  }

  // Check for suspiciously high expense ratio
  if (revenue > 0 && expenses / revenue > 0.95) {
    warnings.push({
      field: 'expenses',
      code: 'HIGH_EXPENSE_RATIO',
      message: 'Kostnader utgör över 95% av intäkterna - kan väcka frågor vid granskning',
      severity: 'warning'
    })
  }

  const passed = errors.length === 0
  const confidence = Math.max(0.5, 1 - (errors.length * 0.2) - (warnings.length * 0.05))

  return { passed, confidence, errors, warnings, suggestions, processingTime: Math.random() * 2000 + 1000 }
}

function validateGeneric(data: Record<string, unknown>, requiredFields: string[]): AIReviewResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  const suggestions: string[] = []

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push({
        field,
        code: 'MISSING_FIELD',
        message: `Fältet "${field}" saknas eller är tomt`,
        severity: 'error'
      })
    }
  }

  const passed = errors.length === 0
  const confidence = Math.max(0.5, 1 - (errors.length * 0.2))

  return { passed, confidence, errors, warnings, suggestions, processingTime: Math.random() * 1000 + 500 }
}

function runAIValidation(documentType: DocumentType, data: Record<string, unknown>): AIReviewResult {
  switch (documentType) {
    case 'agi':
      return validateAGI(data)
    case 'moms':
      return validateMoms(data)
    case 'k10':
      return validateK10(data)
    case 'inkomstdeklaration':
      return validateInkomstdeklaration(data)
    default:
      const config = DOCUMENT_CONFIGS[documentType]
      return validateGeneric(data, config?.requiredFields || [])
  }
}

// Helper functions
function generateReferenceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `SKV-${date}-${random}`
}

function generateOCR(): string {
  return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')
}

function getPaymentDueDate(): string {
  const now = new Date()
  const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 12)
  return dueDate.toISOString().slice(0, 10)
}

function calculatePaymentAmount(documentType: DocumentType, data: Record<string, unknown>): number {
  switch (documentType) {
    case 'agi':
      return (Number(data.tax) || 0) + (Number(data.contributions) || 0)
    case 'moms':
      return Number(data.vatToPay) || 0
    case 'preliminarskatt':
      return Number(data.amount) || 0
    default:
      return 0
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentType, data } = body

    // Validate document type
    if (!documentType || !DOCUMENT_CONFIGS[documentType as DocumentType]) {
      return NextResponse.json({
        success: false,
        error: 'Invalid document type',
        validTypes: Object.keys(DOCUMENT_CONFIGS),
      }, { status: 400 })
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid data object',
      }, { status: 400 })
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    // Run AI validation
    const aiReview = runAIValidation(documentType as DocumentType, data)

    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const referenceNumber = generateReferenceNumber()

    // Determine if payment info is needed
    const hasPayment = ['agi', 'moms', 'preliminarskatt'].includes(documentType)
    const paymentAmount = calculatePaymentAmount(documentType as DocumentType, data)

    // Build response
    const response: SubmissionResponse = {
      success: aiReview.passed,
      submissionId,
      referenceNumber,
      status: aiReview.passed ? 'accepted' : (aiReview.errors.length > 0 ? 'rejected' : 'needs-correction'),
      message: aiReview.passed
        ? `Din ${DOCUMENT_CONFIGS[documentType as DocumentType].name} har mottagits och godkänts.`
        : `Din ${DOCUMENT_CONFIGS[documentType as DocumentType].name} innehåller fel som måste korrigeras.`,
      aiReview,
      paymentInfo: hasPayment && aiReview.passed && paymentAmount > 0 ? {
        amount: paymentAmount,
        dueDate: getPaymentDueDate(),
        bankgiro: '5050-1055',
        ocr: generateOCR(),
      } : undefined,
      nextDeadline: hasPayment ? getPaymentDueDate() : undefined,
    }

    // Store submission for the simulator UI to display
    // Note: In production, this would go to a database
    // For now, we'll return the full response and let the client handle storage

    return NextResponse.json(response)

  } catch (error) {
    console.error('Skatteverket simulator error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
}

// GET handler to check API status
export async function GET() {
  return NextResponse.json({
    service: 'Skatteverket Simulator',
    status: 'online',
    supportedDocuments: Object.entries(DOCUMENT_CONFIGS).map(([type, config]) => ({
      type,
      name: config.name,
      requiredFields: config.requiredFields,
    })),
    usage: {
      method: 'POST',
      body: {
        documentType: 'agi | moms | k10 | inkomstdeklaration | preliminarskatt',
        data: '{ ... document fields ... }'
      }
    }
  })
}
