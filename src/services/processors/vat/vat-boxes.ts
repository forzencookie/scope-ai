/**
 * Canonical VAT box (ruta) definitions for Swedish Momsdeklaration (SKV 4700)
 *
 * Maps each of the 33 rutor to BAS account ranges and calculation method.
 * This is the single source of truth — used by both calculator.ts and UI.
 *
 * References:
 * - Skatteverket SKV 4700 (Momsdeklaration)
 * - BAS kontoplan 2025
 */

export type VatBoxFormula = 'sum' | 'reverse_vat' | 'computed'

/**
 * Which side of the ledger entry to read for this box.
 * - 'credit_net': credit - debit (liability accounts, sales)
 * - 'debit_net': debit - credit (asset accounts, purchases)
 * - 'none': computed from other boxes, no direct account mapping
 */
export type VatBoxSide = 'credit_net' | 'debit_net' | 'none'

export interface VatBoxDefinition {
  /** Box number on the SKV 4700 form */
  box: number
  /** VatReport field name (e.g. 'ruta05') */
  field: `ruta${number}`
  /** Section on the form (A-H) */
  section: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'
  /** Swedish label from the form */
  label: string
  /** BAS account ranges to sum. Each entry is [start, end] inclusive. Empty for computed boxes. */
  accounts: [string, string][]
  /** How to calculate this box */
  formula: VatBoxFormula
  /** Which side of the ledger to read */
  side: VatBoxSide
  /** For reverse_vat: the VAT rate to divide by to get the base */
  vatRate?: number
  /** Sign convention: 1 = positive means liability/income, -1 = negate */
  sign: 1 | -1
}

/**
 * All 33 rutor on the Momsdeklaration (SKV 4700).
 *
 * BAS account mapping sources:
 * - 2610-2619: Utgående moms 25%
 * - 2620-2629: Utgående moms 12%
 * - 2630-2639: Utgående moms 6%
 * - 2640-2649: Ingående moms
 * - 2650-2659: Moms på import (reverse charge)
 * - 3000-3099: Nettoomsättning, varor (25%)
 * - 3100-3199: Nettoomsättning, varor (12% — livsmedel etc.)
 * - 3200-3299: Nettoomsättning, varor (6% — böcker etc.)
 * - 3300-3399: Nettoomsättning, tjänster (25%)
 * - 3400-3499: Försäljningsintäkter, momsfria (export/EU)
 * - 3500-3599: Fakturerade kostnader
 * - 3600-3699: Sidointäkter (often exempt)
 * - 3800-3899: Aktiverat arbete
 * - 3900-3999: Övrigt
 * - 4515: Inköp varor inom EU
 * - 4516: Inköp varor inom EU, 12%
 * - 4517: Inköp varor inom EU, 6%
 * - 4531: Inköp tjänster utanför EU
 * - 4535: Inköp tjänster inom EU
 * - 4536: Inköp tjänster inom EU, 12%
 * - 4545: Inköp varor i Sverige, omvänd moms
 * - 4546: Inköp varor i Sverige, omvänd moms, 12%
 * - 4547: Inköp varor i Sverige, omvänd moms, 6%
 * - 4549: Övriga inköp tjänster omvänd moms
 */
export const VAT_BOXES: VatBoxDefinition[] = [
  // ========================================
  // Section A: Momspliktig försäljning (sales base excl. VAT)
  // ========================================
  {
    box: 5,
    field: 'ruta05',
    section: 'A',
    label: 'Momspliktig försäljning som inte ingår i ruta 06, 07 eller 08',
    accounts: [
      ['3000', '3099'], // Varor 25%
      ['3300', '3399'], // Tjänster 25%
      ['3500', '3599'], // Fakturerade kostnader (typically 25%)
    ],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 6,
    field: 'ruta06',
    section: 'A',
    label: 'Momspliktig försäljning 12%',
    accounts: [
      ['3100', '3199'], // Varor 12% (livsmedel etc.)
    ],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 7,
    field: 'ruta07',
    section: 'A',
    label: 'Momspliktig försäljning 6%',
    accounts: [
      ['3200', '3299'], // Varor/tjänster 6% (böcker, kultur, persontransport)
    ],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 8,
    field: 'ruta08',
    section: 'A',
    label: 'Hyresinkomster vid frivillig skattskyldighet',
    accounts: [
      ['3900', '3949'], // Hyresinkomster vid frivillig moms
    ],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },

  // ========================================
  // Section B: Utgående moms (output VAT on sales)
  // ========================================
  {
    box: 10,
    field: 'ruta10',
    section: 'B',
    label: 'Utgående moms 25%',
    accounts: [['2610', '2619']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 11,
    field: 'ruta11',
    section: 'B',
    label: 'Utgående moms 12%',
    accounts: [['2620', '2629']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 12,
    field: 'ruta12',
    section: 'B',
    label: 'Utgående moms 6%',
    accounts: [['2630', '2639']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },

  // ========================================
  // Section C: Reverse charge purchases (base amounts)
  // ========================================
  {
    box: 20,
    field: 'ruta20',
    section: 'C',
    label: 'Inköp av varor från annat EU-land',
    accounts: [
      ['4515', '4515'],
      ['4516', '4516'],
      ['4517', '4517'],
    ],
    formula: 'sum',
    side: 'debit_net',
    sign: 1,
  },
  {
    box: 21,
    field: 'ruta21',
    section: 'C',
    label: 'Inköp av tjänster från annat EU-land enligt huvudregeln',
    accounts: [
      ['4535', '4535'],
      ['4536', '4536'],
    ],
    formula: 'sum',
    side: 'debit_net',
    sign: 1,
  },
  {
    box: 22,
    field: 'ruta22',
    section: 'C',
    label: 'Inköp av tjänster från land utanför EU',
    accounts: [['4531', '4531']],
    formula: 'sum',
    side: 'debit_net',
    sign: 1,
  },
  {
    box: 23,
    field: 'ruta23',
    section: 'C',
    label: 'Inköp av varor i Sverige (byggtjänster, guld, mobiltelefoner m.m.)',
    accounts: [
      ['4545', '4545'],
      ['4546', '4546'],
      ['4547', '4547'],
    ],
    formula: 'sum',
    side: 'debit_net',
    sign: 1,
  },
  {
    box: 24,
    field: 'ruta24',
    section: 'C',
    label: 'Övriga inköp av tjänster',
    accounts: [['4549', '4549']],
    formula: 'sum',
    side: 'debit_net',
    sign: 1,
  },

  // ========================================
  // Section D: Output VAT on reverse charge (rutor 20-24)
  // Computed as: base × VAT rate. No direct accounts — these are
  // the VAT amounts the buyer must report on reverse charge purchases.
  // ========================================
  {
    box: 30,
    field: 'ruta30',
    section: 'D',
    label: 'Utgående moms 25% (på inköp i ruta 20-24)',
    accounts: [],
    formula: 'computed',
    side: 'none',
    vatRate: 0.25,
    sign: 1,
  },
  {
    box: 31,
    field: 'ruta31',
    section: 'D',
    label: 'Utgående moms 12% (på inköp i ruta 20-24)',
    accounts: [],
    formula: 'computed',
    side: 'none',
    vatRate: 0.12,
    sign: 1,
  },
  {
    box: 32,
    field: 'ruta32',
    section: 'D',
    label: 'Utgående moms 6% (på inköp i ruta 20-24)',
    accounts: [],
    formula: 'computed',
    side: 'none',
    vatRate: 0.06,
    sign: 1,
  },

  // ========================================
  // Section E: VAT-exempt sales
  // ========================================
  {
    box: 35,
    field: 'ruta35',
    section: 'E',
    label: 'Försäljning av varor till annat EU-land',
    accounts: [['3400', '3404']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 36,
    field: 'ruta36',
    section: 'E',
    label: 'Försäljning av varor utanför EU (export)',
    accounts: [['3405', '3409']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 37,
    field: 'ruta37',
    section: 'E',
    label: 'Mellanmans inköp av varor vid trepartshandel',
    accounts: [['4518', '4518']],
    formula: 'sum',
    side: 'debit_net',
    sign: 1,
  },
  {
    box: 38,
    field: 'ruta38',
    section: 'E',
    label: 'Mellanmans försäljning av varor vid trepartshandel',
    accounts: [['3410', '3414']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 39,
    field: 'ruta39',
    section: 'E',
    label: 'Försäljning av tjänster till annat EU-land (huvudregeln)',
    accounts: [['3415', '3419']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 40,
    field: 'ruta40',
    section: 'E',
    label: 'Övrig försäljning av tjänster omsatta utanför Sverige',
    accounts: [['3420', '3429']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 41,
    field: 'ruta41',
    section: 'E',
    label: 'Försäljning när köparen är skattskyldig i Sverige',
    accounts: [['3430', '3439']],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },
  {
    box: 42,
    field: 'ruta42',
    section: 'E',
    label: 'Övrig momsfri försäljning m.m.',
    accounts: [
      ['3440', '3499'], // Remaining exempt sales
      ['3600', '3699'], // Sidointäkter (often exempt)
    ],
    formula: 'sum',
    side: 'credit_net',
    sign: 1,
  },

  // ========================================
  // Section F: Input VAT
  // ========================================
  {
    box: 48,
    field: 'ruta48',
    section: 'F',
    label: 'Ingående moms att dra av',
    accounts: [['2640', '2649']],
    formula: 'sum',
    side: 'debit_net',
    sign: 1,
  },

  // ========================================
  // Section G: Net VAT (computed)
  // ========================================
  {
    box: 49,
    field: 'ruta49',
    section: 'G',
    label: 'Moms att betala eller få tillbaka',
    accounts: [],
    formula: 'computed',
    side: 'none',
    sign: 1,
  },

  // ========================================
  // Section H: Import VAT
  // ========================================
  {
    box: 50,
    field: 'ruta50',
    section: 'H',
    label: 'Beskattningsunderlag vid import',
    accounts: [['2650', '2659']], // Moms vid import — base amount
    formula: 'reverse_vat',
    side: 'credit_net',
    vatRate: 0.25,
    sign: 1,
  },
  {
    box: 60,
    field: 'ruta60',
    section: 'H',
    label: 'Utgående moms på import 25%',
    accounts: [],
    formula: 'computed',
    side: 'none',
    vatRate: 0.25,
    sign: 1,
  },
  {
    box: 61,
    field: 'ruta61',
    section: 'H',
    label: 'Utgående moms på import 12%',
    accounts: [],
    formula: 'computed',
    side: 'none',
    vatRate: 0.12,
    sign: 1,
  },
  {
    box: 62,
    field: 'ruta62',
    section: 'H',
    label: 'Utgående moms på import 6%',
    accounts: [],
    formula: 'computed',
    side: 'none',
    vatRate: 0.06,
    sign: 1,
  },
]

// ==========================================
// Lookup helpers
// ==========================================

/** Map from field name (e.g. 'ruta05') to box definition */
export const VAT_BOX_BY_FIELD = new Map<string, VatBoxDefinition>(
  VAT_BOXES.map(b => [b.field, b])
)

/** Map from box number to box definition */
export const VAT_BOX_BY_NUMBER = new Map<number, VatBoxDefinition>(
  VAT_BOXES.map(b => [b.box, b])
)

/** Get all boxes for a given section */
export function getBoxesForSection(section: VatBoxDefinition['section']): VatBoxDefinition[] {
  return VAT_BOXES.filter(b => b.section === section)
}

/** Check if an account falls within any range for a given box */
export function accountMatchesBox(account: string, box: VatBoxDefinition): boolean {
  return box.accounts.some(([start, end]) => account >= start && account <= end)
}

/**
 * Find which box(es) an account maps to.
 * An account can match multiple boxes (rare but possible for edge cases).
 */
export function findBoxesForAccount(account: string): VatBoxDefinition[] {
  return VAT_BOXES.filter(b => b.accounts.length > 0 && accountMatchesBox(account, b))
}
