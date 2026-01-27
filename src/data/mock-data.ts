/**
 * Comprehensive mock data for all pages
 * Used as fallback when database returns empty results
 */

import { TRANSACTION_STATUSES, RECEIPT_STATUSES, INVOICE_STATUSES } from '@/types'
import type {
  ShareTransaction,
  ShareCapital,
  PartnerWithdrawal,
  MembershipChange,
  BoardMeeting,
  GeneralMeeting,
  SupplierInvoice,
} from '@/types/ownership'

// ===========================================
// TRANSACTIONS (Bokföring > Transaktioner)
// ===========================================
export const mockTransactions = [
  {
    id: 'tx-1',
    name: 'Spotify AB',
    date: '2025-01-15',
    amount: '-99,00 kr',
    amountValue: -99,
    status: TRANSACTION_STATUSES.RECORDED,
    account: 'Företagskonto',
    category: 'Prenumerationer',
    type: 'expense',
  },
  {
    id: 'tx-2',
    name: 'Kund AB - Faktura 2025-001',
    date: '2025-01-14',
    amount: '+45 000,00 kr',
    amountValue: 45000,
    status: TRANSACTION_STATUSES.RECORDED,
    account: 'Företagskonto',
    category: 'Försäljning',
    type: 'income',
  },
  {
    id: 'tx-3',
    name: 'Amazon Web Services',
    date: '2025-01-12',
    amount: '-2 340,00 kr',
    amountValue: -2340,
    status: TRANSACTION_STATUSES.TO_RECORD,
    account: 'Företagskonto',
    category: 'IT-tjänster',
    type: 'expense',
  },
  {
    id: 'tx-4',
    name: 'Kontorsmaterial AB',
    date: '2025-01-10',
    amount: '-1 250,00 kr',
    amountValue: -1250,
    status: TRANSACTION_STATUSES.MISSING_DOCUMENTATION,
    account: 'Företagskonto',
    category: 'Kontorsmaterial',
    type: 'expense',
  },
  {
    id: 'tx-5',
    name: 'Stort Företag AB - Faktura 2024-089',
    date: '2025-01-08',
    amount: '+125 000,00 kr',
    amountValue: 125000,
    status: TRANSACTION_STATUSES.RECORDED,
    account: 'Företagskonto',
    category: 'Konsulttjänster',
    type: 'income',
  },
  {
    id: 'tx-6',
    name: 'Telia Företag',
    date: '2025-01-05',
    amount: '-599,00 kr',
    amountValue: -599,
    status: TRANSACTION_STATUSES.TO_RECORD,
    account: 'Företagskonto',
    category: 'Telefoni',
    type: 'expense',
  },
  {
    id: 'tx-7',
    name: 'Hyresbetalning Januari',
    date: '2025-01-01',
    amount: '-15 000,00 kr',
    amountValue: -15000,
    status: TRANSACTION_STATUSES.RECORDED,
    account: 'Företagskonto',
    category: 'Lokalhyra',
    type: 'expense',
  },
  {
    id: 'tx-8',
    name: 'Försäkringsbolaget',
    date: '2024-12-28',
    amount: '-4 500,00 kr',
    amountValue: -4500,
    status: TRANSACTION_STATUSES.RECORDED,
    account: 'Företagskonto',
    category: 'Försäkringar',
    type: 'expense',
  },
]

export const mockTransactionStats = {
  income: 170000,
  expenses: 23788,
  pending: 3,
  totalCount: 8,
}

// ===========================================
// RECEIPTS (Bokföring > Kvitton)
// ===========================================
export const mockReceipts = [
  {
    id: 'rec-1',
    supplier: 'IKEA',
    date: '2025-01-18',
    amount: '-3 450,00 kr',
    moms: 690,
    category: 'Kontorsmöbler',
    status: RECEIPT_STATUSES.MATCHED,
    attachment: 'ikea-kvitto-2025.pdf',
  },
  {
    id: 'rec-2',
    supplier: 'Clas Ohlson',
    date: '2025-01-15',
    amount: '-899,00 kr',
    moms: 180,
    category: 'Kontorsmaterial',
    status: RECEIPT_STATUSES.MATCHED,
    attachment: 'clas-ohlson-kvitto.pdf',
  },
  {
    id: 'rec-3',
    supplier: 'Circle K',
    date: '2025-01-12',
    amount: '-650,00 kr',
    moms: 130,
    category: 'Drivmedel',
    status: RECEIPT_STATUSES.PENDING,
    attachment: 'tank-kvitto.jpg',
  },
  {
    id: 'rec-4',
    supplier: 'Restaurang Gondolen',
    date: '2025-01-10',
    amount: '-1 200,00 kr',
    moms: 144,
    category: 'Representation',
    status: RECEIPT_STATUSES.PENDING,
    attachment: null,
  },
  {
    id: 'rec-5',
    supplier: 'Apple Store',
    date: '2025-01-08',
    amount: '-15 990,00 kr',
    moms: 3198,
    category: 'IT-utrustning',
    status: RECEIPT_STATUSES.MATCHED,
    attachment: 'apple-receipt.pdf',
  },
  {
    id: 'rec-6',
    supplier: 'Webhallen',
    date: '2025-01-05',
    amount: '-2 499,00 kr',
    moms: 500,
    category: 'IT-utrustning',
    status: RECEIPT_STATUSES.PROCESSED,
    attachment: 'webhallen-order.pdf',
  },
]

export const mockReceiptStats = {
  total: 6,
  matchedCount: 3,
  unmatchedCount: 2,
  totalAmount: 24688,
}

// ===========================================
// INVOICES (Bokföring > Fakturor)
// ===========================================
export const mockInvoices = [
  {
    id: 'inv-1',
    number: '2025-001',
    customer: 'Stort Företag AB',
    date: '2025-01-20',
    dueDate: '2025-02-20',
    amount: 75000,
    status: INVOICE_STATUSES.SENT,
    type: 'customer',
  },
  {
    id: 'inv-2',
    number: '2025-002',
    customer: 'Mellanstor AB',
    date: '2025-01-18',
    dueDate: '2025-02-18',
    amount: 32500,
    status: INVOICE_STATUSES.DRAFT,
    type: 'customer',
  },
  {
    id: 'inv-3',
    number: '2025-003',
    customer: 'Startup Inc',
    date: '2025-01-10',
    dueDate: '2025-02-10',
    amount: 18750,
    status: INVOICE_STATUSES.PAID,
    type: 'customer',
  },
  {
    id: 'inv-4',
    number: 'LF-2025-001',
    customer: 'IT-Leverantören AB',
    date: '2025-01-15',
    dueDate: '2025-02-15',
    amount: 12500,
    status: INVOICE_STATUSES.RECEIVED,
    type: 'supplier',
  },
  {
    id: 'inv-5',
    number: 'LF-2025-002',
    customer: 'Kontorsservice AB',
    date: '2025-01-12',
    dueDate: '2025-01-27',
    amount: 4500,
    status: INVOICE_STATUSES.OVERDUE,
    type: 'supplier',
  },
]

export const mockInvoiceStats = {
  totalOutstanding: 107500,
  overdueCount: 1,
  draftCount: 1,
  paidThisMonth: 18750,
}

// ===========================================
// INVENTARIER (Bokföring > Tillgångar)
// ===========================================
export const mockInventarier = [
  {
    id: 'asset-1',
    namn: 'MacBook Pro 16"',
    kategori: 'Datorer',
    inkopsdatum: '2024-03-15',
    inkopspris: 34990,
    livslangdAr: 3,
  },
  {
    id: 'asset-2',
    namn: 'Skrivbord BEKANT',
    kategori: 'Inventarier',
    inkopsdatum: '2024-01-10',
    inkopspris: 5990,
    livslangdAr: 10,
  },
  {
    id: 'asset-3',
    namn: 'Kontorsstol MARKUS',
    kategori: 'Inventarier',
    inkopsdatum: '2024-01-10',
    inkopspris: 3490,
    livslangdAr: 10,
  },
  {
    id: 'asset-4',
    namn: 'Dell UltraSharp 27"',
    kategori: 'Datorer',
    inkopsdatum: '2024-03-15',
    inkopspris: 7990,
    livslangdAr: 5,
  },
  {
    id: 'asset-5',
    namn: 'iPhone 15 Pro',
    kategori: 'Datorer',
    inkopsdatum: '2024-09-20',
    inkopspris: 15990,
    livslangdAr: 3,
  },
  {
    id: 'asset-6',
    namn: 'Tesla Model 3',
    kategori: 'Fordon',
    inkopsdatum: '2023-06-01',
    inkopspris: 549000,
    livslangdAr: 5,
  },
]

export const mockInventarieStats = {
  totalInkopsvarde: 618450,
  totalCount: 6,
  kategorier: 3,
}

// ===========================================
// PAYROLL (Löner > Lönekörning)
// ===========================================
export const mockEmployees = [
  {
    id: 'emp-1',
    name: 'Anna Andersson',
    role: 'VD',
    email: 'anna@foretaget.se',
    ssn: '198501152345',
    salary: 75000,
    employmentType: 'Tillsvidare',
    startDate: '2020-01-01',
  },
  {
    id: 'emp-2',
    name: 'Erik Eriksson',
    role: 'Utvecklare',
    email: 'erik@foretaget.se',
    ssn: '199003201234',
    salary: 55000,
    employmentType: 'Tillsvidare',
    startDate: '2021-03-15',
  },
  {
    id: 'emp-3',
    name: 'Maria Svensson',
    role: 'Designer',
    email: 'maria@foretaget.se',
    ssn: '199205103456',
    salary: 48000,
    employmentType: 'Tillsvidare',
    startDate: '2022-06-01',
  },
  {
    id: 'emp-4',
    name: 'Johan Lindqvist',
    role: 'Säljare',
    email: 'johan@foretaget.se',
    ssn: '198812254567',
    salary: 42000,
    employmentType: 'Tillsvidare',
    startDate: '2023-01-15',
  },
]

export const mockPayrollRuns = [
  {
    id: 'pr-1',
    period: '2025-01',
    status: 'Utbetald',
    employees: 4,
    totalGross: 220000,
    totalNet: 165000,
    totalTax: 55000,
    paymentDate: '2025-01-25',
  },
  {
    id: 'pr-2',
    period: '2024-12',
    status: 'Utbetald',
    employees: 4,
    totalGross: 220000,
    totalNet: 165000,
    totalTax: 55000,
    paymentDate: '2024-12-23',
  },
  {
    id: 'pr-3',
    period: '2024-11',
    status: 'Utbetald',
    employees: 4,
    totalGross: 220000,
    totalNet: 165000,
    totalTax: 55000,
    paymentDate: '2024-11-25',
  },
]

export const mockPayrollStats = {
  totalGross: 220000,
  totalNet: 165000,
  employeeCount: 4,
  nextPaymentDate: '2025-02-25',
}

// ===========================================
// BENEFITS (Löner > Förmåner)
// ===========================================
export const mockBenefits = [
  {
    id: 'ben-1',
    name: 'Friskvårdsbidrag',
    type: 'wellness',
    maxAmount: 5000,
    usedAmount: 3200,
    employees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson'],
  },
  {
    id: 'ben-2',
    name: 'Tjänstebil',
    type: 'car',
    maxAmount: null,
    usedAmount: null,
    employees: ['Anna Andersson'],
  },
  {
    id: 'ben-3',
    name: 'Pensionsavsättning',
    type: 'pension',
    maxAmount: null,
    usedAmount: 44000,
    employees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson', 'Johan Lindqvist'],
  },
  {
    id: 'ben-4',
    name: 'Sjukvårdsförsäkring',
    type: 'health',
    maxAmount: null,
    usedAmount: 24000,
    employees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson', 'Johan Lindqvist'],
  },
]

// ===========================================
// SHAREHOLDERS (Ägare > Aktiebok)
// ===========================================
export const mockShareholders = [
  {
    id: 'sh-1',
    name: 'Anna Andersson',
    ssn_org_nr: '198501152345',
    shares_count: 600,
    shares_percentage: 60,
    share_class: 'A',
  },
  {
    id: 'sh-2',
    name: 'Erik Eriksson',
    ssn_org_nr: '199003201234',
    shares_count: 250,
    shares_percentage: 25,
    share_class: 'B',
  },
  {
    id: 'sh-3',
    name: 'Investera AB',
    ssn_org_nr: '556789-1234',
    shares_count: 150,
    shares_percentage: 15,
    share_class: 'B',
  },
]

// ===========================================
// PARTNERS (Ägare > Delägare - for HB/KB)
// ===========================================
export const mockPartners = [
  {
    id: 'partner-1',
    name: 'Anna Andersson',
    ssn: '198501152345',
    ownershipPercentage: 50,
    capitalContribution: 100000,
    currentBalance: 145000,
    role: 'Komplementär',
  },
  {
    id: 'partner-2',
    name: 'Erik Eriksson',
    ssn: '199003201234',
    ownershipPercentage: 30,
    capitalContribution: 60000,
    currentBalance: 87000,
    role: 'Kommanditdelägare',
  },
  {
    id: 'partner-3',
    name: 'Maria Svensson',
    ssn: '199205103456',
    ownershipPercentage: 20,
    capitalContribution: 40000,
    currentBalance: 58000,
    role: 'Kommanditdelägare',
  },
]

// ===========================================
// MEMBERS (Ägare > Medlemsregister - for Förening)
// ===========================================
export const mockMembers = [
  {
    id: 'mem-1',
    memberNumber: '001',
    name: 'Anna Andersson',
    email: 'anna@example.com',
    phone: '070-123 45 67',
    membershipType: 'ordinarie',
    joinDate: '2020-01-15',
    status: 'aktiv',
    currentYearFeePaid: true,
    roles: ['ordförande'],
  },
  {
    id: 'mem-2',
    memberNumber: '002',
    name: 'Erik Eriksson',
    email: 'erik@example.com',
    phone: '070-234 56 78',
    membershipType: 'ordinarie',
    joinDate: '2020-03-20',
    status: 'aktiv',
    currentYearFeePaid: true,
    roles: ['kassör'],
  },
  {
    id: 'mem-3',
    memberNumber: '003',
    name: 'Maria Svensson',
    email: 'maria@example.com',
    phone: '070-345 67 89',
    membershipType: 'ordinarie',
    joinDate: '2021-06-01',
    status: 'aktiv',
    currentYearFeePaid: false,
    roles: [],
  },
  {
    id: 'mem-4',
    memberNumber: '004',
    name: 'Johan Lindqvist',
    email: 'johan@example.com',
    phone: '070-456 78 90',
    membershipType: 'stödmedlem',
    joinDate: '2022-09-15',
    status: 'aktiv',
    currentYearFeePaid: false,
    roles: [],
  },
  {
    id: 'mem-5',
    memberNumber: '005',
    name: 'Lisa Larsson',
    email: 'lisa@example.com',
    phone: '070-567 89 01',
    membershipType: 'hedersmedlem',
    joinDate: '2015-01-01',
    status: 'aktiv',
    currentYearFeePaid: true,
    roles: [],
  },
]

// ===========================================
// ANNUAL MEETING (Ägare > Årsmöte)
// ===========================================
export const mockAnnualMeetings = [
  {
    id: 'am-1',
    year: 2025,
    date: '2025-03-15',
    location: 'Föreningslokalen',
    status: 'planerad',
    attendees: [],
    agenda: [
      { id: 'ag-1', number: '1', title: 'Mötets öppnande' },
      { id: 'ag-2', number: '2', title: 'Val av ordförande och sekreterare' },
      { id: 'ag-3', number: '3', title: 'Godkännande av dagordning' },
      { id: 'ag-4', number: '4', title: 'Verksamhetsberättelse 2024' },
      { id: 'ag-5', number: '5', title: 'Ekonomisk rapport' },
      { id: 'ag-6', number: '6', title: 'Ansvarsfrihet för styrelsen' },
      { id: 'ag-7', number: '7', title: 'Val av styrelse' },
      { id: 'ag-8', number: '8', title: 'Övriga frågor' },
    ],
  },
  {
    id: 'am-2',
    year: 2024,
    date: '2024-03-20',
    location: 'Föreningslokalen',
    status: 'protokoll signerat',
    attendees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson', 'Johan Lindqvist', 'Lisa Larsson'],
    agenda: [
      { id: 'ag-10', number: '1', title: 'Mötets öppnande', decision: 'Mötet öppnades av ordförande' },
      { id: 'ag-11', number: '2', title: 'Val av ordförande och sekreterare', decision: 'Anna Andersson valdes till mötesordförande, Erik Eriksson till sekreterare' },
      { id: 'ag-12', number: '3', title: 'Godkännande av dagordning', decision: 'Dagordningen godkändes' },
      { id: 'ag-13', number: '4', title: 'Verksamhetsberättelse 2023', decision: 'Verksamhetsberättelsen godkändes' },
      { id: 'ag-14', number: '5', title: 'Ekonomisk rapport', decision: 'Den ekonomiska rapporten godkändes' },
      { id: 'ag-15', number: '6', title: 'Ansvarsfrihet för styrelsen', decision: 'Styrelsen beviljades ansvarsfrihet' },
      { id: 'ag-16', number: '7', title: 'Val av styrelse', decision: 'Sittande styrelse omvaldes' },
      { id: 'ag-17', number: '8', title: 'Övriga frågor', decision: 'Inga övriga frågor' },
    ],
  },
]

// ===========================================
// DIVIDEND (Ägare > Utdelning)
// ===========================================
export const mockDividends = [
  {
    id: 'div-1',
    year: 2024,
    totalAmount: 100000,
    perShare: 100,
    status: 'Utbetald',
    paymentDate: '2024-05-15',
    recipients: [
      { shareholderId: 'sh-1', amount: 60000 },
      { shareholderId: 'sh-2', amount: 25000 },
      { shareholderId: 'sh-3', amount: 15000 },
    ],
  },
  {
    id: 'div-2',
    year: 2023,
    totalAmount: 75000,
    perShare: 75,
    status: 'Utbetald',
    paymentDate: '2023-05-20',
    recipients: [
      { shareholderId: 'sh-1', amount: 45000 },
      { shareholderId: 'sh-2', amount: 18750 },
      { shareholderId: 'sh-3', amount: 11250 },
    ],
  },
]

// ===========================================
// FINANCIAL REPORTS (Rapporter > Resultat & Balans)
// ===========================================
export const mockFinancialReport = {
  period: '2024',
  resultatrakning: {
    intakter: {
      nettoomsattning: 2450000,
      ovrigaIntakter: 15000,
      summa: 2465000,
    },
    kostnader: {
      varor: 450000,
      personal: 1200000,
      lokaler: 180000,
      ovrigaKostnader: 285000,
      avskrivningar: 75000,
      summa: 2190000,
    },
    resultatForeSkatt: 275000,
    skatt: 56650,
    arsresultat: 218350,
  },
  balansrakning: {
    tillgangar: {
      anlaggningstillgangar: {
        materiella: 450000,
        immateriella: 50000,
        summa: 500000,
      },
      omsattningstillgangar: {
        varulager: 125000,
        kundfordringar: 380000,
        ovrigaFordringar: 45000,
        kassa: 890000,
        summa: 1440000,
      },
      summa: 1940000,
    },
    egetKapitalOchSkulder: {
      egetKapital: {
        aktiekapital: 100000,
        balanserad: 650000,
        arsresultat: 218350,
        summa: 968350,
      },
      skulder: {
        langfristiga: 500000,
        kortfristiga: {
          leverantorsskulder: 245000,
          skatteskulder: 126650,
          ovriga: 100000,
          summa: 471650,
        },
        summa: 971650,
      },
      summa: 1940000,
    },
  },
}

// ===========================================
// TAX REPORTS (Skatt > Moms, AGI, etc.)
// ===========================================
export const mockVatReport = {
  period: '2025-01',
  salesVat: 122500, // Utgående moms
  purchaseVat: 45600, // Ingående moms
  vatToPay: 76900,
  dueDate: '2025-02-12',
  status: 'Ej deklarerad',
}

export const mockAgiReport = {
  period: '2025-01',
  totalGross: 220000,
  employerFees: 69080, // Arbetsgivaravgifter
  taxDeductions: 55000,
  dueDate: '2025-02-12',
  status: 'Ej deklarerad',
}

// ===========================================
// SHARE TRANSACTIONS (Aktiebok)
// ===========================================
export const mockShareTransactions: ShareTransaction[] = [
  {
    id: 'st-1',
    date: '2020-01-15',
    type: 'nyemission',
    toShareholder: 'Anna Andersson',
    shares: 1000,
    pricePerShare: 25,
    totalPrice: 25000,
    shareClass: 'stamaktier',
    notes: 'Bolagsbildning',
  },
  {
    id: 'st-2',
    date: '2021-06-01',
    type: 'försäljning',
    fromShareholder: 'Anna Andersson',
    toShareholder: 'Erik Eriksson',
    shares: 250,
    pricePerShare: 100,
    totalPrice: 25000,
    shareClass: 'stamaktier',
    notes: 'Delägarskap',
  },
]

export const mockShareCapital: ShareCapital = {
  totalShares: 1000,
  shareCapital: 25000,
  quotaValue: 25,
  shareClasses: [
    { class: 'stamaktier', shares: 1000, votesPerShare: 1 },
  ],
}

// ===========================================
// PARTNER WITHDRAWALS (Delägaruttag - HB/KB)
// ===========================================
export const mockPartnerWithdrawals: PartnerWithdrawal[] = [
  {
    id: 'pw-1',
    partnerId: 'p-1',
    partnerName: 'Anna Andersson',
    date: '2024-12-01',
    amount: 25000,
    type: 'uttag',
    description: 'Månadsuttag december',
  },
  {
    id: 'pw-2',
    partnerId: 'p-2',
    partnerName: 'Erik Eriksson',
    date: '2024-12-01',
    amount: 15000,
    type: 'uttag',
    description: 'Månadsuttag december',
  },
  {
    id: 'pw-3',
    partnerId: 'p-1',
    partnerName: 'Anna Andersson',
    date: '2024-11-01',
    amount: 25000,
    type: 'uttag',
    description: 'Månadsuttag november',
  },
]

// ===========================================
// MEMBERSHIP CHANGES (Medlemsregister - Förening)
// ===========================================
export const mockMembershipChanges: MembershipChange[] = [
  {
    id: 'mc-1',
    memberId: 'm-4',
    memberName: 'Johan Johansson',
    date: '2024-12-01',
    changeType: 'gått med',
    details: 'Ny stödmedlem',
  },
  {
    id: 'mc-2',
    memberId: 'm-1',
    memberName: 'Lisa Larsson',
    date: '2024-11-15',
    changeType: 'rollbyte',
    details: 'Utsedd till ordförande',
  },
  {
    id: 'mc-3',
    memberId: 'm-2',
    memberName: 'Per Persson',
    date: '2024-10-01',
    changeType: 'statusändring',
    details: 'Ändrat till hedersmedlem',
  },
]

// ===========================================
// BOARD MEETINGS (Styrelseprotokoll)
// ===========================================
export const mockBoardMeetings: BoardMeeting[] = [
  // 2025 - Upcoming
  {
    id: 'bm-13',
    meetingNumber: 13,
    date: '2025-02-20',
    location: 'Digitalt via Teams',
    type: 'ordinarie',
    attendees: [],
    absentees: [],
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    agendaItems: [
      { id: 'ai-80', number: '1', title: 'Mötets öppnande' },
      { id: 'ai-81', number: '2', title: 'Val av justerare' },
      { id: 'ai-82', number: '3', title: 'Godkännande av dagordning' },
      { id: 'ai-83', number: '4', title: 'Bokslut 2024', description: 'Genomgång och godkännande av årsredovisning' },
      { id: 'ai-84', number: '5', title: 'Resultatdisposition', description: 'Förslag till vinstdisposition' },
      { id: 'ai-85', number: '6', title: 'Övriga frågor' },
      { id: 'ai-86', number: '7', title: 'Mötets avslutande' },
    ],
    status: 'planerad',
  },
  // 2024 - Multiple meetings
  {
    id: 'bm-12',
    meetingNumber: 12,
    date: '2024-12-05',
    location: 'Kontoret, Stockholm',
    type: 'ordinarie',
    attendees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson'],
    absentees: [],
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    agendaItems: [
      { id: 'ai-1', number: '1', title: 'Mötets öppnande', decision: 'Ordförande öppnade mötet' },
      { id: 'ai-2', number: '2', title: 'Val av justerare', decision: 'Maria Svensson valdes till justerare' },
      { id: 'ai-3', number: '3', title: 'Godkännande av dagordning', decision: 'Dagordningen godkändes' },
      { id: 'ai-4', number: '4', title: 'Ekonomisk rapport Q4', description: 'Genomgång av Q4 resultat', decision: 'Styrelsen godkände rapporten' },
      { id: 'ai-5', number: '5', title: 'Budget 2025', description: 'Förslag till budget för 2025', decision: 'Budgeten godkändes med mindre justeringar' },
      { id: 'ai-6', number: '6', title: 'Övriga frågor', decision: 'Inga övriga frågor' },
      { id: 'ai-7', number: '7', title: 'Mötets avslutande', decision: 'Ordförande avslutade mötet' },
    ],
    status: 'protokoll signerat',
  },
  {
    id: 'bm-11',
    meetingNumber: 11,
    date: '2024-09-18',
    location: 'Kontoret, Stockholm',
    type: 'ordinarie',
    attendees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson', 'Johan Lindqvist'],
    absentees: [],
    chairperson: 'Anna Andersson',
    secretary: 'Maria Svensson',
    agendaItems: [
      { id: 'ai-50', number: '1', title: 'Mötets öppnande', decision: 'Ordförande öppnade mötet' },
      { id: 'ai-51', number: '2', title: 'Val av justerare', decision: 'Johan Lindqvist valdes till justerare' },
      { id: 'ai-52', number: '3', title: 'Ekonomisk rapport Q3', description: 'Genomgång av Q3 resultat', decision: 'Styrelsen godkände rapporten' },
      { id: 'ai-53', number: '4', title: 'Personalfrågor', description: 'Diskussion om rekrytering', decision: 'Beslut att utlysa tjänst som projektledare' },
      { id: 'ai-54', number: '5', title: 'Mötets avslutande', decision: 'Ordförande avslutade mötet' },
    ],
    status: 'protokoll signerat',
  },
  {
    id: 'bm-10',
    meetingNumber: 10,
    date: '2024-06-12',
    location: 'Restaurang Gondolen, Stockholm',
    type: 'extra',
    attendees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson'],
    absentees: ['Johan Lindqvist'],
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    agendaItems: [
      { id: 'ai-40', number: '1', title: 'Mötets öppnande', decision: 'Ordförande öppnade mötet' },
      { id: 'ai-41', number: '2', title: 'Investering i ny produkt', description: 'Beslut om investering på 500 000 kr', decision: 'Styrelsen godkände investeringen enhälligt' },
      { id: 'ai-42', number: '3', title: 'Mötets avslutande', decision: 'Ordförande avslutade mötet' },
    ],
    status: 'protokoll signerat',
  },
  {
    id: 'bm-9',
    meetingNumber: 9,
    date: '2024-03-20',
    location: 'Kontoret, Stockholm',
    type: 'ordinarie',
    attendees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson', 'Johan Lindqvist'],
    absentees: [],
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    agendaItems: [
      { id: 'ai-30', number: '1', title: 'Mötets öppnande', decision: 'Ordförande öppnade mötet' },
      { id: 'ai-31', number: '2', title: 'Val av justerare', decision: 'Maria Svensson valdes till justerare' },
      { id: 'ai-32', number: '3', title: 'Årsredovisning 2023', description: 'Genomgång och godkännande', decision: 'Årsredovisningen godkändes' },
      { id: 'ai-33', number: '4', title: 'Förslag till vinstdisposition', decision: 'Styrelsen föreslår utdelning om 50 kr per aktie' },
      { id: 'ai-34', number: '5', title: 'Mötets avslutande', decision: 'Ordförande avslutade mötet' },
    ],
    status: 'protokoll signerat',
  },
  // 2023 - Historical
  {
    id: 'bm-8',
    meetingNumber: 8,
    date: '2023-12-07',
    location: 'Kontoret, Stockholm',
    type: 'ordinarie',
    attendees: ['Anna Andersson', 'Erik Eriksson', 'Maria Svensson'],
    absentees: [],
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    agendaItems: [
      { id: 'ai-20', number: '1', title: 'Mötets öppnande', decision: 'Ordförande öppnade mötet' },
      { id: 'ai-21', number: '2', title: 'Budget 2024', decision: 'Budgeten godkändes' },
      { id: 'ai-22', number: '3', title: 'Strategiplan 2024-2026', decision: 'Strategiplanen godkändes' },
      { id: 'ai-23', number: '4', title: 'Mötets avslutande', decision: 'Ordförande avslutade mötet' },
    ],
    status: 'protokoll signerat',
  },
  {
    id: 'bm-7',
    meetingNumber: 7,
    date: '2023-09-14',
    location: 'Digitalt via Teams',
    type: 'ordinarie',
    attendees: ['Anna Andersson', 'Erik Eriksson'],
    absentees: ['Maria Svensson'],
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    agendaItems: [
      { id: 'ai-15', number: '1', title: 'Mötets öppnande', decision: 'Ordförande öppnade mötet' },
      { id: 'ai-16', number: '2', title: 'Ekonomisk rapport Q3', decision: 'Rapporten godkändes' },
      { id: 'ai-17', number: '3', title: 'Mötets avslutande', decision: 'Ordförande avslutade mötet' },
    ],
    status: 'protokoll signerat',
  },
]

// ===========================================
// GENERAL MEETINGS (Bolagsstämma / Årsmöte)
// ===========================================
export const mockGeneralMeetings: GeneralMeeting[] = [
  {
    id: 'gm-1',
    year: 2024,
    date: '2024-05-15',
    location: 'Kontoret, Stockholm',
    type: 'ordinarie',
    meetingType: 'bolagsstamma',
    attendeesCount: 2,
    sharesRepresented: 1000,
    votesRepresented: 1000,
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    decisions: [
      { id: 'gmd-1', title: 'Fastställande av resultat- och balansräkning', decision: 'Stämman fastställde resultat- och balansräkningen för 2023', type: 'other' },
      {
        id: 'gmd-2',
        title: 'Disposition av vinst',
        decision: 'Stämman beslutade att dela ut 120 000 kr till aktieägarna',
        type: 'dividend',
        amount: 120000,
        booked: false
      },
      { id: 'gmd-3', title: 'Ansvarsfrihet för styrelsen', decision: 'Stämman beviljade styrelsen ansvarsfrihet', type: 'other' },
      { id: 'gmd-4', title: 'Val av styrelse', decision: 'Anna Andersson och Erik Eriksson omvaldes till styrelsen', type: 'board_election' },
      { id: 'gmd-5', title: 'Val av revisor', decision: 'Revisionsbyrån AB omvaldes som revisor', type: 'auditor_election' },
    ],
    status: 'protokoll signerat',
  },
  {
    id: 'gm-2',
    year: 2025,
    date: '2025-05-15',
    location: 'Kontoret, Stockholm',
    type: 'ordinarie',
    meetingType: 'bolagsstamma',
    attendeesCount: 0,
    chairperson: '',
    secretary: '',
    decisions: [],
    status: 'kallad',
  },
]

// ===========================================
// SUPPLIER INVOICES (Leverantörsfakturor)
// ===========================================
export const mockSupplierInvoices: SupplierInvoice[] = [
  {
    id: 'sf-001',
    invoiceNumber: 'F2024-4521',
    supplierName: 'Kontorskompaniet AB',
    supplierOrgNumber: '556123-4567',
    invoiceDate: '2024-10-05',
    dueDate: '2024-11-05',
    amount: 8000,
    vatAmount: 2000,
    totalAmount: 10000,
    currency: 'SEK',
    status: 'betald',
    category: 'Kontorsmaterial',
    accountNumber: '5410',
  },
  {
    id: 'sf-002',
    invoiceNumber: 'INV-87654',
    supplierName: 'IT Solutions Sweden AB',
    supplierOrgNumber: '556789-0123',
    invoiceDate: '2024-10-20',
    dueDate: '2024-11-20',
    amount: 12000,
    vatAmount: 3000,
    totalAmount: 15000,
    currency: 'SEK',
    status: 'betald',
    category: 'IT-tjänster',
    accountNumber: '6540',
  },
  {
    id: 'sf-003',
    invoiceNumber: 'R-2024-0892',
    supplierName: 'Städservice Stockholm AB',
    invoiceDate: '2024-11-01',
    dueDate: '2024-12-01',
    amount: 4000,
    vatAmount: 1000,
    totalAmount: 5000,
    currency: 'SEK',
    status: 'bokförd',
    category: 'Lokalkostnader',
    accountNumber: '5050',
  },
  {
    id: 'sf-004',
    invoiceNumber: 'TEL-2024-11',
    supplierName: 'Telia Company AB',
    supplierOrgNumber: '556103-4249',
    invoiceDate: '2024-11-10',
    dueDate: '2024-12-10',
    amount: 2400,
    vatAmount: 600,
    totalAmount: 3000,
    currency: 'SEK',
    status: 'attesterad',
    category: 'Telefon',
    accountNumber: '6212',
  },
  {
    id: 'sf-005',
    invoiceNumber: 'AZ-SW-2024-12',
    supplierName: 'Amazon Web Services',
    invoiceDate: '2024-12-01',
    dueDate: '2025-01-01',
    amount: 6400,
    vatAmount: 1600,
    totalAmount: 8000,
    currency: 'SEK',
    status: 'mottagen',
    category: 'IT-infrastruktur',
    accountNumber: '6540',
  },
  {
    id: 'sf-006',
    invoiceNumber: 'HY-2024-Q4',
    supplierName: 'Fastighets AB Centrum',
    supplierOrgNumber: '556456-7890',
    invoiceDate: '2024-12-01',
    dueDate: '2024-12-31',
    amount: 20000,
    vatAmount: 5000,
    totalAmount: 25000,
    currency: 'SEK',
    status: 'attesterad',
    category: 'Lokalhyra',
    accountNumber: '5010',
  },
]
