/**
 * Transaction templates for common Swedish business transactions
 * Used for AI-assisted categorization and quick entry creation
 */

import type { TransactionTemplate } from './types'

/**
 * Pre-defined templates for common Swedish business expenses
 */
export const transactionTemplates: TransactionTemplate[] = [
  // Office & Administration
  {
    id: 'office-supplies',
    name: 'Kontorsmaterial',
    category: 'expense',
    keywords: ['kontor', 'papper', 'penna', 'ica maxi', 'staples', 'dustin', 'clas ohlson'],
    defaultAccount: '6110',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Kontorsmaterial',
  },
  {
    id: 'software',
    name: 'Programvara',
    category: 'expense',
    keywords: ['software', 'licens', 'saas', 'github', 'figma', 'slack', 'notion', 'microsoft', 'adobe', 'google workspace'],
    defaultAccount: '6540',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Programvarulicens',
  },
  {
    id: 'phone-internet',
    name: 'Telefon & Internet',
    category: 'expense',
    keywords: ['telia', 'tele2', 'tre', 'telenor', 'hallon', 'comviq', 'bredband', 'fiber', 'telefon', 'mobil'],
    defaultAccount: '6210',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Telefoni/Internet',
  },
  {
    id: 'hosting',
    name: 'Hosting & Moln',
    category: 'expense',
    keywords: ['aws', 'azure', 'google cloud', 'digitalocean', 'heroku', 'vercel', 'netlify', 'cloudflare', 'hosting'],
    defaultAccount: '6540',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Hosting/Molntjänst',
  },

  // Travel & Transportation
  {
    id: 'travel-domestic',
    name: 'Resor inrikes',
    category: 'expense',
    keywords: ['sj', 'flyg', 'taxi', 'uber', 'bolt', 'sl', 'västtrafik', 'skånetrafiken', 'resekostnad'],
    defaultAccount: '5800',
    counterAccount: '1930',
    vatRate: 6,
    descriptionTemplate: 'Resor inrikes',
  },
  {
    id: 'travel-international',
    name: 'Resor utrikes',
    category: 'expense',
    keywords: ['utrikes', 'international', 'flight', 'abroad'],
    defaultAccount: '5810',
    counterAccount: '1930',
    vatRate: 0, // Often reverse charge or exempt
    descriptionTemplate: 'Resor utrikes',
  },
  {
    id: 'car-expenses',
    name: 'Bilkostnader',
    category: 'expense',
    keywords: ['bensin', 'diesel', 'bränsle', 'parkering', 'biltvätt', 'service', 'däck', 'bilförsäkring', 'circle k', 'okq8', 'preem', 'st1'],
    defaultAccount: '5600',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Bilkostnad',
  },

  // Rent & Premises
  {
    id: 'office-rent',
    name: 'Lokalhyra',
    category: 'expense',
    keywords: ['hyra', 'lokal', 'kontor', 'fastighet', 'coworking', 'epicenter', 'regus', 'spaces'],
    defaultAccount: '5010',
    counterAccount: '1930',
    vatRate: 25, // If landlord opted for VAT
    descriptionTemplate: 'Lokalhyra',
  },

  // Marketing & Advertising
  {
    id: 'marketing',
    name: 'Marknadsföring',
    category: 'expense',
    keywords: ['reklam', 'annons', 'marknadsföring', 'facebook ads', 'google ads', 'linkedin', 'instagram', 'kampanj'],
    defaultAccount: '5910',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Marknadsföring',
  },

  // Professional Services
  {
    id: 'consulting',
    name: 'Konsulttjänster',
    category: 'expense',
    keywords: ['konsult', 'rådgivning', 'uppdrag', 'extern'],
    defaultAccount: '6550',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Konsulttjänster',
  },
  {
    id: 'legal-accounting',
    name: 'Juridik & Redovisning',
    category: 'expense',
    keywords: ['advokat', 'jurist', 'revisor', 'redovisning', 'bokföring', 'pwc', 'kpmg', 'deloitte', 'ey', 'grant thornton'],
    defaultAccount: '6530',
    counterAccount: '1930',
    vatRate: 25,
    descriptionTemplate: 'Juridik/Redovisning',
  },

  // Insurance
  {
    id: 'insurance',
    name: 'Försäkringar',
    category: 'expense',
    keywords: ['försäkring', 'if', 'trygg-hansa', 'länsförsäkringar', 'folksam', 'gjensidige'],
    defaultAccount: '6310',
    counterAccount: '1930',
    vatRate: 0, // Insurance is VAT exempt
    descriptionTemplate: 'Företagsförsäkring',
  },

  // Food & Entertainment
  {
    id: 'representation',
    name: 'Representation',
    category: 'expense',
    keywords: ['lunch', 'middag', 'kund', 'representation', 'möte', 'restaurang'],
    defaultAccount: '6071',
    counterAccount: '1930',
    vatRate: 12, // Food rate
    descriptionTemplate: 'Representation',
  },
  {
    id: 'staff-welfare',
    name: 'Personalvård',
    category: 'expense',
    keywords: ['fika', 'kaffe', 'frukt', 'personal', 'teambuilding', 'julbord', 'after work'],
    defaultAccount: '7690',
    counterAccount: '1930',
    vatRate: 12,
    descriptionTemplate: 'Personalvård',
  },

  // Income Templates
  {
    id: 'consulting-income',
    name: 'Konsultintäkt',
    category: 'income',
    keywords: ['faktura', 'intäkt', 'konsult', 'arvode', 'uppdrag'],
    defaultAccount: '1510', // Kundfordran
    counterAccount: '3010', // Försäljning tjänster
    vatRate: 25,
    descriptionTemplate: 'Konsultarvode',
  },
  {
    id: 'product-sales',
    name: 'Varuförsäljning',
    category: 'income',
    keywords: ['försäljning', 'produkt', 'vara', 'e-handel'],
    defaultAccount: '1510',
    counterAccount: '3001',
    vatRate: 25,
    descriptionTemplate: 'Varuförsäljning',
  },
]

/**
 * Find matching template based on transaction description
 */
export function findMatchingTemplate(
  description: string,
  amount?: number
): TransactionTemplate | undefined {
  const normalizedDesc = description.toLowerCase()

  // Score each template based on keyword matches
  const scoredTemplates = transactionTemplates.map(template => {
    let score = 0
    
    template.keywords.forEach(keyword => {
      if (normalizedDesc.includes(keyword.toLowerCase())) {
        // Longer keyword matches get higher scores
        score += keyword.length
      }
    })

    // Bonus for category match based on amount sign
    if (amount !== undefined) {
      if (amount < 0 && template.category === 'expense') score += 5
      if (amount > 0 && template.category === 'income') score += 5
    }

    return { template, score }
  })

  // Find best match (score > 0)
  const bestMatch = scoredTemplates
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)[0]

  return bestMatch?.template
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: TransactionTemplate['category']
): TransactionTemplate[] {
  return transactionTemplates.filter(t => t.category === category)
}

/**
 * Get all expense templates
 */
export function getExpenseTemplates(): TransactionTemplate[] {
  return getTemplatesByCategory('expense')
}

/**
 * Get all income templates
 */
export function getIncomeTemplates(): TransactionTemplate[] {
  return getTemplatesByCategory('income')
}
