// ============================================
// Company Types Configuration
// Defines all Swedish company types (bolagsformer)
// and their available features
// ============================================

// ============================================
// Team Roles & Permissions (RBAC)
// ============================================

/**
 * Team member roles for permission control
 */
export type TeamRole = 'owner' | 'partner' | 'senior' | 'junior' | 'viewer'

/**
 * Available permissions in the system
 */
export type Permission =
  | 'create_document'       // Create drafts
  | 'edit_document'         // Edit existing documents
  | 'delete_document'       // Delete documents
  | 'request_signature'     // Send signature requests
  | 'sign_document'         // Sign documents
  | 'submit_to_authority'   // Submit to Bolagsverket/Skatteverket
  | 'approve_action'        // Approve corporate actions
  | 'manage_team'           // Invite/remove team members

/**
 * Role-based permission mapping
 */
export const rolePermissions: Record<TeamRole, Permission[]> = {
  owner: [
    'create_document', 'edit_document', 'delete_document',
    'request_signature', 'sign_document', 'submit_to_authority',
    'approve_action', 'manage_team',
  ],
  partner: [
    'create_document', 'edit_document', 'delete_document',
    'request_signature', 'sign_document', 'submit_to_authority',
    'approve_action',
  ],
  senior: [
    'create_document', 'edit_document',
    'request_signature', 'sign_document',
    'approve_action',
  ],
  junior: [
    'create_document', 'edit_document',
  ],
  viewer: [],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: TeamRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

/**
 * Role display metadata
 */
export const teamRoleMeta: Record<TeamRole, { label: string; description: string }> = {
  owner: { label: 'Ägare', description: 'Full tillgång till allt' },
  partner: { label: 'Partner', description: 'Kan godkänna och skicka in' },
  senior: { label: 'Senior', description: 'Kan signera och godkänna' },
  junior: { label: 'Junior', description: 'Kan skapa och redigera' },
  viewer: { label: 'Visare', description: 'Kan bara se' },
}

// Company type identifiers
export type CompanyType = 'ab' | 'ef' | 'hb' | 'kb' | 'forening';

// All available features in the app
export type FeatureKey =
  // Bookkeeping
  | 'transaktioner'
  | 'kundfakturor'
  | 'leverantorsfakturor'
  | 'fakturor' // General invoices view
  | 'kvitton'
  | 'verifikationer'
  | 'huvudbok'
  | 'inventarier'
  // Reports
  | 'momsdeklaration'
  | 'inkomstdeklaration'
  | 'arsbokslut'
  | 'arsredovisning'
  | 'resultatrakning'
  | 'balansrakning'
  // Payroll & Compensation
  | 'lonebesked'
  | 'agi'
  | 'utdelning'
  | 'k10' // K10 blankett for fåmansföretag (AB only)
  | 'egenavgifter'
  | 'delagaruttag'
  // Ownership & Governance
  | 'aktiebok'
  | 'agarinfo'
  | 'delagare'
  | 'medlemsregister'
  | 'styrelseprotokoll'
  | 'bolagsstamma'
  | 'arsmote'


// Company type metadata
export interface CompanyTypeInfo {
  id: CompanyType;
  name: string;
  fullName: string;
  description: string;
  features: FeatureKey[];
  // Report variants
  inkomstdeklarationVariant: 'INK2' | 'NE' | 'N3A' | 'N3B' | 'forenklad';
  arsbokslutVariant: 'K2' | 'K3' | 'forenklat';
}

// ============================================
// Company Type Definitions
// ============================================

export const companyTypes: Record<CompanyType, CompanyTypeInfo> = {
  ab: {
    id: 'ab',
    name: 'AB',
    fullName: 'Aktiebolag',
    description: 'Aktiebolag med begränsat personligt ansvar. Kräver 25 000 kr i aktiekapital.',
    features: [
      // Bookkeeping (all)
      'transaktioner', 'kundfakturor', 'leverantorsfakturor', 'fakturor', 'kvitton', 'verifikationer', 'inventarier', 'huvudbok',
      // Reports (all) - AB uses Årsredovisning (K2/K3)
      'momsdeklaration', 'inkomstdeklaration', 'arsredovisning', 'resultatrakning', 'balansrakning',
      // Payroll
      'lonebesked', 'agi', 'utdelning', 'k10',
      // Ownership & Governance
      'aktiebok', 'agarinfo', 'bolagsstamma',
    ],
    inkomstdeklarationVariant: 'INK2',
    arsbokslutVariant: 'K2',
  },
  ef: {
    id: 'ef',
    name: 'EF',
    fullName: 'Enskild Firma',
    description: 'Enskild näringsverksamhet där du som person är ansvarig för företagets skulder.',
    features: [
      // Bookkeeping (all)
      'transaktioner', 'kundfakturor', 'leverantorsfakturor', 'fakturor', 'kvitton', 'verifikationer', 'inventarier', 'huvudbok',
      // Reports (all)
      'momsdeklaration', 'inkomstdeklaration', 'arsbokslut', 'resultatrakning', 'balansrakning',
      // Payroll (if employees + egenavgifter)
      'lonebesked', 'agi', 'egenavgifter',
      // No ownership features - EF owner is the user themselves
    ],
    inkomstdeklarationVariant: 'NE',
    arsbokslutVariant: 'forenklat',
  },
  hb: {
    id: 'hb',
    name: 'HB',
    fullName: 'Handelsbolag',
    description: 'Bolag med minst två delägare som är personligt och solidariskt ansvariga.',
    features: [
      // Bookkeeping (all)
      'transaktioner', 'kundfakturor', 'leverantorsfakturor', 'fakturor', 'kvitton', 'verifikationer', 'inventarier', 'huvudbok',
      // Reports (all)
      'momsdeklaration', 'inkomstdeklaration', 'arsbokslut', 'resultatrakning', 'balansrakning',
      // Payroll
      'lonebesked', 'agi', 'delagaruttag',
      // Ownership
      'delagare',
    ],
    inkomstdeklarationVariant: 'N3A',
    arsbokslutVariant: 'forenklat',
  },
  kb: {
    id: 'kb',
    name: 'KB',
    fullName: 'Kommanditbolag',
    description: 'Handelsbolag där minst en delägare har begränsat ansvar (kommanditdelägare).',
    features: [
      // Bookkeeping (all)
      'transaktioner', 'kundfakturor', 'leverantorsfakturor', 'kvitton', 'verifikationer', 'huvudbok',
      // Reports (all)
      'momsdeklaration', 'inkomstdeklaration', 'arsbokslut', 'resultatrakning', 'balansrakning',
      // Payroll
      'lonebesked', 'agi', 'delagaruttag',
      // Ownership
      'delagare',
    ],
    inkomstdeklarationVariant: 'N3B',
    arsbokslutVariant: 'forenklat',
  },
  forening: {
    id: 'forening',
    name: 'Ideell förening',
    fullName: 'Ideell Förening',
    description: 'Förening som inte bedriver näringsverksamhet i vinstsyfte.',
    features: [
      // Bookkeeping (all)
      'transaktioner', 'kundfakturor', 'leverantorsfakturor', 'kvitton', 'verifikationer', 'huvudbok',
      // Reports - Förening uses Årsredovisning (förenklad)
      'momsdeklaration', 'inkomstdeklaration', 'arsredovisning', 'resultatrakning', 'balansrakning',
      // Payroll (if employees)
      'lonebesked', 'agi',
      // Ownership & Governance
      'medlemsregister', 'bolagsstamma', 'arsmote',
    ],
    inkomstdeklarationVariant: 'forenklad',
    arsbokslutVariant: 'forenklat',
  },
};

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a company type has access to a specific feature
 */
export function hasFeature(companyType: CompanyType, feature: FeatureKey): boolean {
  return companyTypes[companyType].features.includes(feature);
}

/**
 * Get all company types as an array (for selectors, etc.)
 */
export function getCompanyTypeOptions(): CompanyTypeInfo[] {
  return Object.values(companyTypes);
}

/**
 * Get display name for a company type
 */
export function getCompanyTypeName(companyType: CompanyType): string {
  return companyTypes[companyType].name;
}

/**
 * Get full display name for a company type
 */
export function getCompanyTypeFullName(companyType: CompanyType): string {
  return companyTypes[companyType].fullName;
}

/**
 * Get the appropriate income declaration variant for a company type
 */
export function getInkomstdeklarationVariant(companyType: CompanyType): string {
  return companyTypes[companyType].inkomstdeklarationVariant;
}

/**
 * Get the appropriate annual report variant for a company type
 */
export function getArsbokslutVariant(companyType: CompanyType): string {
  return companyTypes[companyType].arsbokslutVariant;
}

// ============================================
// Feature Metadata (for UI labels, icons, etc.)
// ============================================

export interface FeatureInfo {
  key: FeatureKey;
  label: string;
  description: string;
  category: 'bookkeeping' | 'reports' | 'payroll' | 'ownership';
}

export const featureInfo: Record<FeatureKey, FeatureInfo> = {
  // Bookkeeping
  transaktioner: {
    key: 'transaktioner',
    label: 'Transaktioner',
    description: 'Hantera alla banktransaktioner och bokföring',
    category: 'bookkeeping',
  },
  kundfakturor: {
    key: 'kundfakturor',
    label: 'Kundfakturor',
    description: 'Skapa och hantera utgående fakturor',
    category: 'bookkeeping',
  },
  leverantorsfakturor: {
    key: 'leverantorsfakturor',
    label: 'Leverantörsfakturor',
    description: 'Hantera inkommande fakturor från leverantörer',
    category: 'bookkeeping',
  },
  kvitton: {
    key: 'kvitton',
    label: 'Kvitton',
    description: 'Ladda upp och matcha kvitton',
    category: 'bookkeeping',
  },
  verifikationer: {
    key: 'verifikationer',
    label: 'Verifikationer',
    description: 'Visa alla bokföringsverifikationer',
    category: 'bookkeeping',
  },
  huvudbok: {
    key: 'huvudbok',
    label: 'Huvudbok',
    description: 'Kontoöversikt med saldon och aktivitet',
    category: 'bookkeeping',
  },
  fakturor: {
    key: 'fakturor',
    label: 'Fakturor',
    description: 'Hantera kund- och leverantörsfakturor',
    category: 'bookkeeping',
  },
  inventarier: {
    key: 'inventarier',
    label: 'Inventarier',
    description: 'Hantera anläggningstillgångar',
    category: 'bookkeeping',
  },
  // Reports
  momsdeklaration: {
    key: 'momsdeklaration',
    label: 'Momsdeklaration',
    description: 'Skapa och skicka momsdeklaration till Skatteverket',
    category: 'reports',
  },
  inkomstdeklaration: {
    key: 'inkomstdeklaration',
    label: 'Inkomstdeklaration',
    description: 'Årlig inkomstdeklaration',
    category: 'reports',
  },
  arsbokslut: {
    key: 'arsbokslut',
    label: 'Årsbokslut',
    description: 'Årsredovisning eller förenklat årsbokslut',
    category: 'reports',
  },
  arsredovisning: {
    key: 'arsredovisning',
    label: 'Årsredovisning',
    description: 'Formell årsredovisning för aktiebolag',
    category: 'reports',
  },
  resultatrakning: {
    key: 'resultatrakning',
    label: 'Resultaträkning',
    description: 'Översikt av intäkter och kostnader',
    category: 'reports',
  },
  balansrakning: {
    key: 'balansrakning',
    label: 'Balansräkning',
    description: 'Översikt av tillgångar och skulder',
    category: 'reports',
  },
  // Payroll
  lonebesked: {
    key: 'lonebesked',
    label: 'Lönebesked',
    description: 'Skapa lönespecifikationer för anställda',
    category: 'payroll',
  },
  agi: {
    key: 'agi',
    label: 'AGI',
    description: 'Arbetsgivardeklaration på individnivå',
    category: 'payroll',
  },
  utdelning: {
    key: 'utdelning',
    label: 'Utdelning',
    description: 'Hantera utdelning till delägare',
    category: 'payroll',
  },
  k10: {
    key: 'k10',
    label: 'K10',
    description: 'Blankett K10 för fåmansföretag - beräkna gränsbelopp',
    category: 'reports',
  },
  egenavgifter: {
    key: 'egenavgifter',
    label: 'Egenavgifter',
    description: 'Beräkna egenavgifter för enskild firma',
    category: 'payroll',
  },
  delagaruttag: {
    key: 'delagaruttag',
    label: 'Delägaruttag',
    description: 'Hantera uttag för delägare i handelsbolag',
    category: 'payroll',
  },
  // Ownership & Governance
  aktiebok: {
    key: 'aktiebok',
    label: 'Aktiebok',
    description: 'Register över aktieägare och aktier',
    category: 'ownership',
  },
  agarinfo: {
    key: 'agarinfo',
    label: 'Ägarinfo',
    description: 'Information om företagets ägare',
    category: 'ownership',
  },
  delagare: {
    key: 'delagare',
    label: 'Delägare',
    description: 'Hantera delägare och vinstfördelning',
    category: 'ownership',
  },
  medlemsregister: {
    key: 'medlemsregister',
    label: 'Medlemsregister',
    description: 'Register över föreningens medlemmar',
    category: 'ownership',
  },
  styrelseprotokoll: {
    key: 'styrelseprotokoll',
    label: 'Styrelseprotokoll',
    description: 'Dokumentera styrelsemöten',
    category: 'ownership',
  },
  bolagsstamma: {
    key: 'bolagsstamma',
    label: 'Bolagsstämma',
    description: 'Protokoll och dokument för bolagsstämma',
    category: 'ownership',
  },
  arsmote: {
    key: 'arsmote',
    label: 'Årsmöte',
    description: 'Protokoll och dokument för årsmöte',
    category: 'ownership',
  },

};
