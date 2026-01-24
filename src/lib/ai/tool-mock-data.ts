/**
 * Mock Data for AI Tools
 * 
 * Sample data for periodiseringsfonder, förmåner catalog, and investments.
 */

import type {
    Periodiseringsfond,
    FormanCatalogItem,
    EmployeeBenefit,
    Property,
    ShareHolding,
    CryptoHolding,
} from './tool-types'

// =============================================================================
// Periodiseringsfonder Mock Data
// =============================================================================

export const mockPeriodiseringsfonder: Periodiseringsfond[] = [
    {
        id: 'pf-2020',
        companyId: 'demo-company',
        year: 2020,
        amount: 150000,
        dissolvedAmount: 0,
        expiresAt: new Date('2026-12-31'),
        status: 'active',
        notes: 'Avsatt för investeringar 2026',
        createdAt: new Date('2021-03-15'),
        updatedAt: new Date('2021-03-15'),
    },
    {
        id: 'pf-2022',
        companyId: 'demo-company',
        year: 2022,
        amount: 200000,
        dissolvedAmount: 50000,
        expiresAt: new Date('2028-12-31'),
        status: 'partially_dissolved',
        notes: 'Delvis återförd 2024',
        createdAt: new Date('2023-03-15'),
        updatedAt: new Date('2024-06-01'),
    },
    {
        id: 'pf-2023',
        companyId: 'demo-company',
        year: 2023,
        amount: 100000,
        dissolvedAmount: 0,
        expiresAt: new Date('2029-12-31'),
        status: 'active',
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15'),
    },
]

// =============================================================================
// Förmåner Catalog (All Swedish Employee Benefits)
// =============================================================================

export const formanerCatalog: FormanCatalogItem[] = [
    // Tax-Free Benefits (Skattefria förmåner)
    {
        id: 'friskvard',
        name: 'Friskvårdsbidrag',
        category: 'tax_free',
        maxAmount: 5000,
        taxFree: true,
        description: 'Bidrag till motion och friskvård',
        rules: { AB: true, EF: true, EnskildFirma: false },
        basAccount: '7699',
    },
    {
        id: 'personalvard',
        name: 'Personalvårdsförmåner',
        category: 'tax_free',
        maxAmount: undefined,
        taxFree: true,
        description: 'Kaffe, frukt, personalfester av mindre värde',
        rules: { AB: true, EF: true },
        basAccount: '7690',
    },
    {
        id: 'arbetsklader',
        name: 'Arbetskläder',
        category: 'tax_free',
        taxFree: true,
        description: 'Kläder som krävs för arbetet',
        rules: { AB: true, EF: true },
        basAccount: '7380',
    },
    {
        id: 'foretagshalsovard',
        name: 'Företagshälsovård',
        category: 'tax_free',
        taxFree: true,
        description: 'Hälsoundersökningar, förebyggande vård',
        basAccount: '7691',
    },
    {
        id: 'utbildning',
        name: 'Utbildning',
        category: 'tax_free',
        taxFree: true,
        description: 'Arbetsrelaterad utbildning och kurser',
        basAccount: '7620',
    },
    {
        id: 'reseforsakring',
        name: 'Reseförsäkring',
        category: 'tax_free',
        taxFree: true,
        description: 'Försäkring för tjänsteresor',
        basAccount: '7570',
    },
    {
        id: 'julgava',
        name: 'Julgåva',
        category: 'tax_free',
        maxAmount: 550,
        taxFree: true,
        description: 'Jul- eller nyårsgåva till anställda',
        basAccount: '7699',
    },
    {
        id: 'jubileumsgava',
        name: 'Jubileumsgåva',
        category: 'tax_free',
        maxAmount: 1650,
        taxFree: true,
        description: 'Gåva vid företagets jubileum',
        basAccount: '7699',
    },
    {
        id: 'minnesgava',
        name: 'Minnesgåva',
        category: 'tax_free',
        maxAmount: 15000,
        taxFree: true,
        description: 'Gåva vid 25 år, pension, etc.',
        basAccount: '7699',
    },
    {
        id: 'cykel_skattefri',
        name: 'Cykelförmån (skattefri)',
        category: 'tax_free',
        maxAmount: 3000,
        taxFree: true,
        description: 'Skattefri cykelförmån upp till 3000 kr/år',
        basAccount: '7399',
    },

    // Taxable Benefits (Skattepliktiga förmåner)
    {
        id: 'tjanstebil',
        name: 'Tjänstebil',
        category: 'taxable',
        taxFree: false,
        formansvardeCalculation: 'Baserat på nybilspris och biltyp (Skatteverkets tabell)',
        description: 'Bil som tillhandahålls av arbetsgivaren',
        basAccount: '7385',
    },
    {
        id: 'drivmedel',
        name: 'Drivmedelsförmån',
        category: 'taxable',
        taxFree: false,
        formansvardeCalculation: '1.2 x marknadspris för drivmedel',
        description: 'Arbetsgivaren betalar privat drivmedel',
        basAccount: '7385',
    },
    {
        id: 'bostad',
        name: 'Bostadsförmån',
        category: 'taxable',
        taxFree: false,
        formansvardeCalculation: 'Marknadshyra för motsvarande bostad',
        description: 'Bostad som tillhandahålls av arbetsgivaren',
        basAccount: '7399',
    },
    {
        id: 'kost',
        name: 'Kostförmån (fri kost)',
        category: 'taxable',
        taxFree: false,
        formansvardeCalculation: '260 kr/dag (2024)',
        description: 'Fria måltider från arbetsgivaren',
        basAccount: '7399',
    },
    {
        id: 'lunch',
        name: 'Lunchförmån',
        category: 'taxable',
        taxFree: false,
        formansvardeCalculation: '130 kr/dag (2024)',
        description: 'Subventionerad lunch',
        basAccount: '7399',
    },
    {
        id: 'parkering',
        name: 'Parkeringsförmån',
        category: 'taxable',
        taxFree: false,
        formansvardeCalculation: 'Marknadsvärde för parkering',
        description: 'Fri parkering vid arbetsplatsen',
        basAccount: '7399',
    },
    {
        id: 'telefon',
        name: 'Telefonförmån',
        category: 'tax_free', // Changed 2018
        taxFree: true,
        description: 'Fri telefon är numera skattefri',
        basAccount: '6211',
    },

    // Salary Sacrifice (Bruttolöneavdrag)
    {
        id: 'tjanstepension',
        name: 'Tjänstepension',
        category: 'salary_sacrifice',
        taxFree: false,
        formansvardeCalculation: 'Ingen förmånsbeskattning, men lägre bruttolön',
        description: 'Extra pensionsavsättning via bruttolöneavdrag',
        basAccount: '7411',
    },
    {
        id: 'sjukvardsforsakring',
        name: 'Sjukvårdsförsäkring',
        category: 'salary_sacrifice',
        taxFree: false,
        formansvardeCalculation: 'Premien förmånsbeskattas',
        description: 'Privat sjukvårdsförsäkring',
        basAccount: '7570',
    },
    {
        id: 'cykel',
        name: 'Cykelförmån',
        category: 'salary_sacrifice',
        taxFree: false,
        formansvardeCalculation: 'Reducerat förmånsvärde vid bruttolöneavdrag',
        description: 'Cykel via bruttolöneavdrag',
        basAccount: '7399',
    },
]

// =============================================================================
// Employee Benefits Mock Data
// =============================================================================

export const mockEmployeeBenefits: EmployeeBenefit[] = [
    {
        id: 'eb-1',
        companyId: 'demo-company',
        employeeName: 'Anna Andersson',
        benefitType: 'friskvard',
        amount: 3500,
        year: 2024,
        formansvarde: 0, // Tax-free
        createdAt: new Date('2024-03-01'),
    },
    {
        id: 'eb-2',
        companyId: 'demo-company',
        employeeName: 'Erik Eriksson',
        benefitType: 'tjanstebil',
        amount: 0,
        year: 2024,
        formansvarde: 4500, // Monthly taxable value
        notes: 'Volvo XC60, förmånsvärde 4500/mån',
        createdAt: new Date('2024-01-01'),
    },
]

// =============================================================================
// Properties Mock Data
// =============================================================================

export const mockProperties: Property[] = [
    {
        id: 'prop-1',
        companyId: 'demo-company',
        name: 'Kontorsfastighet Storgatan 15',
        propertyType: 'building',
        address: 'Storgatan 15, 111 22 Stockholm',
        purchaseDate: new Date('2020-06-01'),
        purchasePrice: 5000000,
        landValue: 1500000,
        buildingValue: 3500000,
        depreciationRate: 2.0,
        currentValue: 4860000, // After 2 years depreciation
        basAccount: '1110',
        createdAt: new Date('2020-06-01'),
        updatedAt: new Date('2024-01-01'),
    },
]

// =============================================================================
// Share Holdings Mock Data
// =============================================================================

export const mockShareHoldings: ShareHolding[] = [
    {
        id: 'sh-1',
        companyId: 'demo-company',
        companyName: 'TechStartup AB',
        orgNumber: '559123-4567',
        holdingType: 'other',
        sharesCount: 1000,
        purchaseDate: new Date('2022-01-15'),
        purchasePrice: 500000,
        currentValue: 750000,
        dividendReceived: 25000,
        basAccount: '1350',
        notes: 'Strategisk investering',
        createdAt: new Date('2022-01-15'),
        updatedAt: new Date('2024-01-01'),
    },
]

// =============================================================================
// Crypto Holdings Mock Data
// =============================================================================

export const mockCryptoHoldings: CryptoHolding[] = [
    {
        id: 'crypto-1',
        companyId: 'demo-company',
        coin: 'BTC',
        amount: 0.5,
        purchaseDate: new Date('2023-06-15'),
        purchasePriceSek: 150000,
        currentPriceSek: 250000,
        basAccount: '1350',
        createdAt: new Date('2023-06-15'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'crypto-2',
        companyId: 'demo-company',
        coin: 'ETH',
        amount: 5,
        purchaseDate: new Date('2023-09-01'),
        purchasePriceSek: 75000,
        currentPriceSek: 95000,
        basAccount: '1350',
        createdAt: new Date('2023-09-01'),
        updatedAt: new Date('2024-01-01'),
    },
]
