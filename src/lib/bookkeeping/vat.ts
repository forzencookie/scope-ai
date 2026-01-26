/**
 * VAT calculation utilities for Swedish accounting
 * Supports Swedish VAT rates: 25%, 12%, 6%, 0%
 */

import type { SwedishVatRate } from './types'
import { roundToOre } from './validation'

/**
 * VAT rate configuration for Swedish accounting
 */
export const VAT_RATES: Record<SwedishVatRate, { label: string; multiplier: number }> = {
  25: { label: '25%', multiplier: 0.25 },
  12: { label: '12%', multiplier: 0.12 },
  6: { label: '6%', multiplier: 0.06 },
  0: { label: 'Momsfri', multiplier: 0 },
}

/**
 * Calculate VAT amount from a net amount
 * @param netAmount Amount excluding VAT
 * @param vatRate VAT rate (0, 6, 12, or 25)
 * @returns VAT amount
 */
export function calculateVat(netAmount: number, vatRate: SwedishVatRate): number {
  return roundToOre(netAmount * VAT_RATES[vatRate].multiplier)
}

/**
 * Calculate gross amount (including VAT) from net amount
 * @param netAmount Amount excluding VAT
 * @param vatRate VAT rate (0, 6, 12, or 25)
 * @returns Gross amount including VAT
 */
export function calculateGross(netAmount: number, vatRate: SwedishVatRate): number {
  return roundToOre(netAmount * (1 + VAT_RATES[vatRate].multiplier))
}

/**
 * Extract net amount from gross amount
 * @param grossAmount Amount including VAT
 * @param vatRate VAT rate (0, 6, 12, or 25)
 * @returns Net amount excluding VAT
 */
export function calculateNet(grossAmount: number, vatRate: SwedishVatRate): number {
  return roundToOre(grossAmount / (1 + VAT_RATES[vatRate].multiplier))
}

/**
 * Extract VAT amount from gross amount
 * @param grossAmount Amount including VAT
 * @param vatRate VAT rate (0, 6, 12, or 25)
 * @returns VAT amount
 */
export function extractVat(grossAmount: number, vatRate: SwedishVatRate): number {
  const netAmount = calculateNet(grossAmount, vatRate)
  return roundToOre(grossAmount - netAmount)
}

/**
 * Determine the most likely VAT rate based on account category
 * Uses Swedish BAS account plan conventions
 */
export function inferVatRateFromAccount(account: string): SwedishVatRate {
  const accountNum = parseInt(account, 10)
  
  // Most goods and services: 25%
  // Food (restaurants, catering): 12%
  // Books, newspapers, public transport, hotels: 6%
  // Medical, financial, education: 0%
  
  // Expense accounts (4xxx-6xxx)
  if (accountNum >= 4000 && accountNum <= 4999) {
    // Raw materials and goods - typically 25%
    return 25
  }
  
  if (accountNum >= 5000 && accountNum <= 5999) {
    // External costs
    // 5400-5499: Consumables (25%)
    // 5500-5599: Repairs (25%)
    // 5600-5699: Transport (25% or 6% for passenger transport)
    // 5800-5899: Travel (6-25% depending on type)
    return 25
  }
  
  if (accountNum >= 6000 && accountNum <= 6999) {
    // 6000-6099: External services (25%)
    // 6200-6299: Phone/IT (25%)
    // 6300-6399: Insurance (0% - exempt)
    if (accountNum >= 6300 && accountNum <= 6399) return 0
    return 25
  }
  
  // Revenue accounts (3xxx)
  if (accountNum >= 3000 && accountNum <= 3999) {
    // Standard Swedish sales typically 25%
    return 25
  }
  
  // Default to 25%
  return 25
}

/**
 * Get the correct VAT account based on rate and type
 */
export function getVatAccount(vatRate: SwedishVatRate, type: 'input' | 'output'): string {
  if (type === 'input') {
    // Ingående moms - always 2640
    return '2640'
  }
  
  // Utgående moms based on rate
  switch (vatRate) {
    case 25: return '2610'
    case 12: return '2620'
    case 6: return '2630'
    case 0: return '' // No VAT account for 0%
    default: return '2610'
  }
}

/**
 * Split a gross amount into net and VAT components
 */
export function splitGrossAmount(
  grossAmount: number,
  vatRate: SwedishVatRate
): { net: number; vat: number; gross: number } {
  const net = calculateNet(grossAmount, vatRate)
  const vat = extractVat(grossAmount, vatRate)
  
  return {
    net,
    vat,
    gross: roundToOre(net + vat),
  }
}

/**
 * Format VAT amount for display in Swedish format
 */
export function formatVat(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
  }).format(amount)
}
