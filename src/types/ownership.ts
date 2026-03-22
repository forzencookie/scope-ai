// ============================================
// Ownership Types
// Shareholders, Partners, Members, Board Meetings, etc.
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
  accountBase?: number; // BAS account base for this partner (e.g. 2071, 2074, 2077...)
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

export interface MembershipChange {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  changeType: 'gått med' | 'lämnat' | 'statusändring' | 'rollbyte';
  details: string;
}

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

// ============================================
// Bolagsstämma / Årsmöte
// ============================================

export interface GeneralMeeting {
  id: string;
  title: string;
  year: number;
  date: string;
  location: string;
  type: 'ordinarie' | 'extra';
  meetingType: 'bolagsstamma' | 'arsmote'; // AB vs Förening
  meetingCategory: 'bolagsstamma' | 'styrelsemote'; // Distinguishes stämma from board meeting
  attendeesCount: number;
  sharesRepresented?: number; // AB only
  votesRepresented?: number; // AB only
  chairperson: string;
  secretary: string;
  decisions: GeneralMeetingDecision[];
  status: 'planerad' | 'kallad' | 'genomförd' | 'protokoll signerat';
  documentUrl?: string;
  // Kallelse-related fields
  kallelseText?: string;
  kallelseSavedAt?: string;
  time?: string;
  agenda?: string | string[];
  // Board meeting specific fields
  attendees?: string[];
  absentees?: string[];
  meetingNumber?: number;
  protokollText?: string;
  notes?: string;
}

export interface GeneralMeetingDecision {
  id: string;
  title: string;
  description?: string;
  decision: string;
  type?: 'dividend' | 'board_election' | 'auditor_election' | 'other';
  amount?: number;
  booked?: boolean;
  votingResult?: {
    for: number;
    against: number;
    abstained: number;
  };
  protokollText?: string;
}

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

// ============================================
// Egenavgifter (Self-Employment Tax) - EF only
// ============================================

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
  status: 'Mottagen' | 'Godkänd' | 'Betald';
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
