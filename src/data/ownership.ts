// ============================================
// Mock Data for New Features
// Ownership, Partners, Members, etc.
// ============================================

import type { CompanyType } from '@/lib/company-types';

// ============================================
// Aktiebok (Share Registry) - AB only
// ============================================

export interface Shareholder {
  id: string;
  name: string;
  personalNumber?: string; // Personnummer
  orgNumber?: string; // Organisationsnummer (for companies)
  type: 'person' | 'company';
  shares: number;
  shareClass: 'A' | 'B' | 'stamaktier';
  ownershipPercentage: number;
  acquisitionDate: string;
  acquisitionPrice: number;
  votes: number;
  votesPercentage: number;
}

export interface ShareTransaction {
  id: string;
  date: string;
  type: 'nyemission' | 'köp' | 'försäljning' | 'gåva' | 'arv' | 'split';
  fromShareholder?: string;
  toShareholder: string;
  shares: number;
  pricePerShare: number;
  totalPrice: number;
  shareClass: 'A' | 'B' | 'stamaktier';
  notes?: string;
}

export const mockShareholders: Shareholder[] = [
  {
    id: 'sh-1',
    name: 'Anna Andersson',
    personalNumber: '198505151234',
    type: 'person',
    shares: 750,
    shareClass: 'stamaktier',
    ownershipPercentage: 75,
    acquisitionDate: '2020-01-15',
    acquisitionPrice: 18750,
    votes: 750,
    votesPercentage: 75,
  },
  {
    id: 'sh-2',
    name: 'Erik Eriksson',
    personalNumber: '199002201234',
    type: 'person',
    shares: 250,
    shareClass: 'stamaktier',
    ownershipPercentage: 25,
    acquisitionDate: '2021-06-01',
    acquisitionPrice: 25000,
    votes: 250,
    votesPercentage: 25,
  },
];

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
];

export interface ShareCapital {
  totalShares: number;
  shareCapital: number; // Aktiekapital
  quotaValue: number; // Kvotvärde
  shareClasses: {
    class: 'A' | 'B' | 'stamaktier';
    shares: number;
    votesPerShare: number;
  }[];
}

export const mockShareCapital: ShareCapital = {
  totalShares: 1000,
  shareCapital: 25000,
  quotaValue: 25,
  shareClasses: [
    { class: 'stamaktier', shares: 1000, votesPerShare: 1 },
  ],
};

// ============================================
// Delägare (Partners) - HB/KB only
// ============================================

export interface Partner {
  id: string;
  name: string;
  personalNumber: string;
  type: 'komplementär' | 'kommanditdelägare'; // KB only has kommanditdelägare
  ownershipPercentage: number;
  profitSharePercentage: number;
  capitalContribution: number;
  currentCapitalBalance: number;
  joinDate: string;
  isLimitedLiability: boolean; // true for kommanditdelägare
}

export interface PartnerWithdrawal {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string;
  amount: number;
  type: 'uttag' | 'insättning';
  description: string;
}

export const mockPartners: Partner[] = [
  {
    id: 'p-1',
    name: 'Anna Andersson',
    personalNumber: '198505151234',
    type: 'komplementär',
    ownershipPercentage: 60,
    profitSharePercentage: 60,
    capitalContribution: 100000,
    currentCapitalBalance: 145000,
    joinDate: '2020-01-15',
    isLimitedLiability: false,
  },
  {
    id: 'p-2',
    name: 'Erik Eriksson',
    personalNumber: '199002201234',
    type: 'komplementär',
    ownershipPercentage: 40,
    profitSharePercentage: 40,
    capitalContribution: 50000,
    currentCapitalBalance: 78000,
    joinDate: '2020-01-15',
    isLimitedLiability: false,
  },
];

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
];

// ============================================
// Medlemsregister (Members) - Förening only
// ============================================

export interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  memberNumber: string;
  joinDate: string;
  membershipType: 'ordinarie' | 'stödmedlem' | 'hedersmedlem';
  status: 'aktiv' | 'vilande' | 'avslutad';
  feesPaid: boolean;
  currentYearFeePaid: boolean;
  roles: string[]; // e.g., ['ordförande', 'kassör']
}

export interface MembershipFee {
  id: string;
  memberId: string;
  memberName: string;
  year: number;
  amount: number;
  paidDate: string | null;
  status: 'betald' | 'obetald' | 'påminnelse skickad';
}

export const mockMembers: Member[] = [
  {
    id: 'm-1',
    name: 'Anna Andersson',
    email: 'anna@example.com',
    phone: '070-123 45 67',
    memberNumber: '001',
    joinDate: '2020-01-15',
    membershipType: 'ordinarie',
    status: 'aktiv',
    feesPaid: true,
    currentYearFeePaid: true,
    roles: ['ordförande'],
  },
  {
    id: 'm-2',
    name: 'Erik Eriksson',
    email: 'erik@example.com',
    phone: '070-234 56 78',
    memberNumber: '002',
    joinDate: '2020-03-20',
    membershipType: 'ordinarie',
    status: 'aktiv',
    feesPaid: true,
    currentYearFeePaid: true,
    roles: ['kassör'],
  },
  {
    id: 'm-3',
    name: 'Maria Svensson',
    email: 'maria@example.com',
    memberNumber: '003',
    joinDate: '2021-06-01',
    membershipType: 'ordinarie',
    status: 'aktiv',
    feesPaid: true,
    currentYearFeePaid: false,
    roles: [],
  },
  {
    id: 'm-4',
    name: 'Johan Lindqvist',
    email: 'johan@example.com',
    memberNumber: '004',
    joinDate: '2022-09-15',
    membershipType: 'stödmedlem',
    status: 'aktiv',
    feesPaid: false,
    currentYearFeePaid: false,
    roles: [],
  },
];

export interface MembershipChange {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  changeType: 'gått med' | 'lämnat' | 'statusändring' | 'rollbyte';
  details: string;
}

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
];

// ============================================
// Styrelseprotokoll (Board Minutes) - AB, Förening
// ============================================

export interface BoardMeeting {
  id: string;
  meetingNumber: number;
  date: string;
  location: string;
  type: 'ordinarie' | 'extra' | 'konstituerande';
  attendees: string[];
  absentees: string[];
  chairperson: string;
  secretary: string;
  agendaItems: AgendaItem[];
  status: 'planerad' | 'genomförd' | 'protokoll signerat';
  documentUrl?: string;
}

export interface AgendaItem {
  id: string;
  number: string;
  title: string;
  description?: string;
  decision?: string;
  votingResult?: {
    for: number;
    against: number;
    abstained: number;
  };
}

export const mockBoardMeetings: BoardMeeting[] = [
  {
    id: 'bm-1',
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
    id: 'bm-2',
    meetingNumber: 13,
    date: '2025-01-15',
    location: 'Kontoret, Stockholm',
    type: 'ordinarie',
    attendees: [],
    absentees: [],
    chairperson: 'Anna Andersson',
    secretary: 'Erik Eriksson',
    agendaItems: [
      { id: 'ai-8', number: '1', title: 'Mötets öppnande' },
      { id: 'ai-9', number: '2', title: 'Val av justerare' },
      { id: 'ai-10', number: '3', title: 'Godkännande av dagordning' },
      { id: 'ai-11', number: '4', title: 'Bokslut 2024' },
      { id: 'ai-12', number: '5', title: 'Övriga frågor' },
      { id: 'ai-13', number: '6', title: 'Mötets avslutande' },
    ],
    status: 'planerad',
  },
];

// ============================================
// Bolagsstämma / Årsmöte
// ============================================

export interface GeneralMeeting {
  id: string;
  year: number;
  date: string;
  location: string;
  type: 'ordinarie' | 'extra';
  meetingType: 'bolagsstamma' | 'arsmote'; // AB vs Förening
  attendeesCount: number;
  sharesRepresented?: number; // AB only
  votesRepresented?: number; // AB only
  chairperson: string;
  secretary: string;
  decisions: GeneralMeetingDecision[];
  status: 'kallad' | 'genomförd' | 'protokoll signerat';
  documentUrl?: string;
}

export interface GeneralMeetingDecision {
  id: string;
  title: string;
  description?: string;
  decision: string;
  votingResult?: {
    for: number;
    against: number;
    abstained: number;
  };
}

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
      { id: 'gmd-1', title: 'Fastställande av resultat- och balansräkning', decision: 'Stämman fastställde resultat- och balansräkningen för 2023' },
      { id: 'gmd-2', title: 'Disposition av vinst', decision: 'Stämman beslutade att dela ut 120 000 kr till aktieägarna' },
      { id: 'gmd-3', title: 'Ansvarsfrihet för styrelsen', decision: 'Stämman beviljade styrelsen ansvarsfrihet' },
      { id: 'gmd-4', title: 'Val av styrelse', decision: 'Anna Andersson och Erik Eriksson omvaldes till styrelsen' },
      { id: 'gmd-5', title: 'Val av revisor', decision: 'Revisionsbyrån AB omvaldes som revisor' },
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
];

// ============================================
// Ägarinfo (Owner Info) - All company types
// ============================================

export interface OwnerInfo {
  companyType: CompanyType;
  // AB
  shareholders?: Shareholder[];
  shareCapital?: ShareCapital;
  // EF
  owner?: {
    name: string;
    personalNumber: string;
    address: string;
    fSkatt: boolean;
    momsRegistered: boolean;
  };
  // HB/KB
  partners?: Partner[];
  // Förening
  members?: Member[];
  boardMembers?: {
    name: string;
    role: string;
    since: string;
  }[];
}

export const mockOwnerInfo: Record<CompanyType, OwnerInfo> = {
  ab: {
    companyType: 'ab',
    shareholders: mockShareholders,
    shareCapital: mockShareCapital,
  },
  ef: {
    companyType: 'ef',
    owner: {
      name: 'Anna Andersson',
      personalNumber: '198505151234',
      address: 'Storgatan 1, 111 22 Stockholm',
      fSkatt: true,
      momsRegistered: true,
    },
  },
  hb: {
    companyType: 'hb',
    partners: mockPartners,
  },
  kb: {
    companyType: 'kb',
    partners: [
      { ...mockPartners[0], type: 'komplementär', isLimitedLiability: false },
      { ...mockPartners[1], type: 'kommanditdelägare', isLimitedLiability: true },
    ],
  },
  forening: {
    companyType: 'forening',
    members: mockMembers,
    boardMembers: [
      { name: 'Anna Andersson', role: 'Ordförande', since: '2022-05-15' },
      { name: 'Erik Eriksson', role: 'Kassör', since: '2022-05-15' },
      { name: 'Maria Svensson', role: 'Sekreterare', since: '2023-05-15' },
    ],
  },
};

// ============================================
// Egenavgifter (Self-Employment Tax) - EF only
// ============================================

export interface EgenavgifterCalculation {
  year: number;
  income: number; // Överskott av näringsverksamhet
  // Rates for 2024
  rates: {
    sjukforsakring: number; // 3.64%
    foraldraforsakring: number; // 2.60%
    alderspension: number; // 10.21%
    efterlevandepension: number; // 0.60%
    arbetsmarknad: number; // 0.10%
    // Total: ~17.15% (varies by year)
  };
  calculated: {
    sjukforsakring: number;
    foraldraforsakring: number;
    alderspension: number;
    efterlevandepension: number;
    arbetsmarknad: number;
    total: number;
  };
  // Deductions
  schablonavdrag: number; // 25% of egenavgifter
  netEgenavgifter: number;
}

export function calculateEgenavgifter(income: number, year: number = 2024): EgenavgifterCalculation {
  // 2024 rates
  const rates = {
    sjukforsakring: 0.0364,
    foraldraforsakring: 0.0260,
    alderspension: 0.1021,
    efterlevandepension: 0.0060,
    arbetsmarknad: 0.0010,
  };
  
  const calculated = {
    sjukforsakring: Math.round(income * rates.sjukforsakring),
    foraldraforsakring: Math.round(income * rates.foraldraforsakring),
    alderspension: Math.round(income * rates.alderspension),
    efterlevandepension: Math.round(income * rates.efterlevandepension),
    arbetsmarknad: Math.round(income * rates.arbetsmarknad),
    total: 0,
  };
  
  calculated.total = 
    calculated.sjukforsakring +
    calculated.foraldraforsakring +
    calculated.alderspension +
    calculated.efterlevandepension +
    calculated.arbetsmarknad;
  
  const schablonavdrag = Math.round(calculated.total * 0.25);
  const netEgenavgifter = calculated.total - schablonavdrag;
  
  return {
    year,
    income,
    rates,
    calculated,
    schablonavdrag,
    netEgenavgifter,
  };
}

// ============================================
// Leverantörsfakturor (Supplier Invoices)
// ============================================

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierOrgNumber?: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  currency: 'SEK' | 'EUR' | 'USD';
  status: 'mottagen' | 'attesterad' | 'betald' | 'förfallen' | 'tvist';
  paymentDate?: string;
  category?: string;
  accountNumber?: string;
  documentUrl?: string;
  notes?: string;
  // OCR/AI extracted
  ocrReference?: string;
  bankgiro?: string;
  plusgiro?: string;
}

export const mockSupplierInvoices: SupplierInvoice[] = [
  {
    id: 'si-1',
    invoiceNumber: 'F2024-1234',
    supplierName: 'Kontorsleverantören AB',
    supplierOrgNumber: '556123-4567',
    invoiceDate: '2024-12-01',
    dueDate: '2024-12-31',
    amount: 4000,
    vatAmount: 1000,
    totalAmount: 5000,
    currency: 'SEK',
    status: 'mottagen',
    category: 'Kontorsmaterial',
    accountNumber: '6110',
    bankgiro: '123-4567',
  },
  {
    id: 'si-2',
    invoiceNumber: 'INV-5678',
    supplierName: 'IT-Konsulten AB',
    supplierOrgNumber: '556234-5678',
    invoiceDate: '2024-11-25',
    dueDate: '2024-12-25',
    amount: 40000,
    vatAmount: 10000,
    totalAmount: 50000,
    currency: 'SEK',
    status: 'attesterad',
    category: 'IT-tjänster',
    accountNumber: '6540',
    bankgiro: '234-5678',
  },
  {
    id: 'si-3',
    invoiceNumber: '2024/0892',
    supplierName: 'Hyresvärden AB',
    invoiceDate: '2024-12-01',
    dueDate: '2024-12-31',
    amount: 20000,
    vatAmount: 5000,
    totalAmount: 25000,
    currency: 'SEK',
    status: 'betald',
    paymentDate: '2024-12-10',
    category: 'Lokalhyra',
    accountNumber: '5010',
    bankgiro: '345-6789',
  },
  {
    id: 'si-4',
    invoiceNumber: 'F-11234',
    supplierName: 'Telebolag AB',
    invoiceDate: '2024-11-01',
    dueDate: '2024-11-30',
    amount: 800,
    vatAmount: 200,
    totalAmount: 1000,
    currency: 'SEK',
    status: 'förfallen',
    category: 'Telefoni',
    accountNumber: '6212',
    notes: 'Påminnelse skickad',
  },
];
