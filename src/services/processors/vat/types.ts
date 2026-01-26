/**
 * VAT Report types for Swedish Momsdeklaration
 * Based on official Skatteverket SKV 4700 form
 */

/**
 * Complete VAT Report matching official Skatteverket SKV 4700 form.
 * All rutor (fields) from sections A-H are included.
 */
export interface VatReport {
  // Metadata
  periodId?: string | number
  period: string
  dueDate: string
  status: "upcoming" | "submitted" | "overdue"

  // ==========================================================================
  // Section A: Momspliktig försäljning eller uttag (Sales base, excl VAT)
  // ==========================================================================
  ruta05: number  // Momspliktig försäljning 25%
  ruta06: number  // Momspliktig försäljning 12%
  ruta07: number  // Momspliktig försäljning 6%
  ruta08: number  // Hyresinkomster vid frivillig skattskyldighet

  // ==========================================================================
  // Section B: Utgående moms på försäljning (Output VAT)
  // ==========================================================================
  ruta10: number  // Utgående moms 25%
  ruta11: number  // Utgående moms 12%
  ruta12: number  // Utgående moms 6%

  // ==========================================================================
  // Section C: Momspliktiga inköp vid omvänd skattskyldighet (Reverse charge base)
  // ==========================================================================
  ruta20: number  // Inköp av varor från annat EU-land
  ruta21: number  // Inköp av tjänster från annat EU-land
  ruta22: number  // Inköp av tjänster från land utanför EU
  ruta23: number  // Inköp av varor i Sverige (omvänd moms)
  ruta24: number  // Övriga inköp av tjänster

  // ==========================================================================
  // Section D: Utgående moms på inköp i ruta 20-24 (Output VAT on reverse charge)
  // ==========================================================================
  ruta30: number  // Utgående moms 25%
  ruta31: number  // Utgående moms 12%
  ruta32: number  // Utgående moms 6%

  // ==========================================================================
  // Section E: Försäljning m.m. som är undantagen från moms (Exempt sales)
  // ==========================================================================
  ruta35: number  // Försäljning av varor till annat EU-land
  ruta36: number  // Försäljning av varor utanför EU
  ruta37: number  // Mellanmans inköp av varor vid trepartshandel
  ruta38: number  // Mellanmans försäljning av varor vid trepartshandel
  ruta39: number  // Försäljning av tjänster till annat EU-land (huvudregel)
  ruta40: number  // Övrig försäljning av tjänster utanför Sverige
  ruta41: number  // Försäljning där köparen är skattskyldig i Sverige
  ruta42: number  // Övrig momsfri försäljning m.m.

  // ==========================================================================
  // Section F: Ingående moms (Input VAT)
  // ==========================================================================
  ruta48: number  // Ingående moms att dra av

  // ==========================================================================
  // Section G: Moms att betala eller få tillbaka (Result)
  // ==========================================================================
  ruta49: number  // Moms att betala (+) eller få tillbaka (-)

  // ==========================================================================
  // Section H: Import (Beskattningsunderlag vid import)
  // ==========================================================================
  ruta50: number  // Beskattningsunderlag vid import
  ruta60: number  // Utgående moms på import 25%
  ruta61: number  // Utgående moms på import 12%
  ruta62: number  // Utgående moms på import 6%

  // ==========================================================================
  // Calculated aggregates (for UI convenience)
  // ==========================================================================
  salesVat: number    // Total output VAT (ruta10 + ruta11 + ruta12 + ruta30 + ruta31 + ruta32 + ruta60 + ruta61 + ruta62)
  inputVat: number    // Total input VAT (ruta48)
  netVat: number      // Net VAT to pay/receive (salesVat - inputVat)
}

/**
 * Summary for VAT period display
 */
export interface VatPeriodSummary {
  period: string
  dueDate: string
  salesVat: number
  inputVat: number
  netVat: number
  status: VatReport['status']
}
