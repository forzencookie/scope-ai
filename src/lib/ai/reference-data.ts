/**
 * Static Reference Data for AI Tools
 *
 * Catalog of Swedish employee benefits with tax rules, BAS accounts, and limits.
 * Used as fallback when the formaner_catalog DB table is not populated.
 */

import type {
    FormanCatalogItem,
} from './tool-types'

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
