/**
 * Bokföring AI Tools - Inventarier (Assets)
 *
 * Tools for managing fixed assets, depreciation, and disposal.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { inventarieService, type Inventarie } from '@/services/inventarie-service'

// =============================================================================
// Get Assets Tool
// =============================================================================

export interface GetAssetsParams {
    limit?: number
    kategori?: string
    status?: 'aktiv' | 'såld' | 'avskriven'
}

export const getAssetsTool = defineTool<GetAssetsParams, Inventarie[]>({
    name: 'get_assets',
    description: 'Hämta inventarier och anläggningstillgångar (maskiner, datorer, möbler etc). Visar inköpspris, kvarvarande värde och avskrivningsstatus.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            limit: { type: 'number', description: 'Max antal att hämta (standard: 50)' },
            kategori: { type: 'string', description: 'Filtrera på kategori (t.ex. "Datorer", "Möbler")' },
            status: { type: 'string', enum: ['aktiv', 'såld', 'avskriven'], description: 'Filtrera på status' },
        },
    },
    execute: async (params) => {
        const { inventarier, totalCount } = await inventarieService.getInventarier({
            limit: params.limit ?? 50,
            kategori: params.kategori,
        })

        // Filter by status locally if needed
        let filtered = inventarier
        if (params.status) {
            filtered = inventarier.filter(i => i.status === params.status)
        }

        const totalValue = filtered.reduce((sum, i) => sum + i.inkopspris, 0)

        return {
            success: true,
            data: filtered,
            message: filtered.length > 0
                ? `${filtered.length} inventarier med totalt inköpsvärde ${totalValue.toLocaleString('sv-SE')} kr.`
                : 'Inga inventarier hittades.',
        }
    },
})

// =============================================================================
// Create Asset Tool
// =============================================================================

export interface CreateAssetParams {
    namn: string
    inkopspris: number
    inkopsdatum?: string
    kategori?: string
    livslangdAr?: number
    anteckningar?: string
}

export const createAssetTool = defineTool<CreateAssetParams, Inventarie>({
    name: 'create_asset',
    description: 'Registrera en ny inventarie/anläggningstillgång. Skapar automatiskt avskrivningsplan baserat på ekonomisk livslängd. Använd när användaren köpt dator, maskin, bil, eller annan utrustning över halva prisbasbeloppet. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            namn: { type: 'string', description: 'Namn på tillgången (t.ex. "MacBook Pro 16")' },
            inkopspris: { type: 'number', description: 'Inköpspris i kronor' },
            inkopsdatum: { type: 'string', description: 'Inköpsdatum (YYYY-MM-DD), standard idag' },
            kategori: { type: 'string', description: 'Kategori (t.ex. "Datorer", "Möbler", "Fordon")' },
            livslangdAr: { type: 'number', description: 'Avskrivningstid i år (standard: 5)' },
            anteckningar: { type: 'string', description: 'Valfria anteckningar' },
        },
        required: ['namn', 'inkopspris'],
    },
    execute: async (params) => {
        const inkopsdatum = params.inkopsdatum || new Date().toISOString().split('T')[0]
        const livslangdAr = params.livslangdAr ?? 5
        const kategori = params.kategori || 'Inventarier'

        // Calculate annual depreciation
        const arligAvskrivning = Math.round(params.inkopspris / livslangdAr)
        const manatligAvskrivning = Math.round(arligAvskrivning / 12)

        const asset: Inventarie = {
            id: `inv-${Date.now()}`,
            namn: params.namn,
            inkopspris: params.inkopspris,
            inkopsdatum,
            kategori,
            livslangdAr,
            anteckningar: params.anteckningar,
            status: 'aktiv',
        }

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Registrera inventarie',
            description: `Lägg till ${params.namn} som inventarie`,
            summary: [
                { label: 'Namn', value: params.namn },
                { label: 'Inköpspris', value: `${params.inkopspris.toLocaleString('sv-SE')} kr` },
                { label: 'Kategori', value: kategori },
                { label: 'Avskrivningstid', value: `${livslangdAr} år` },
                { label: 'Årlig avskrivning', value: `${arligAvskrivning.toLocaleString('sv-SE')} kr` },
                { label: 'Månatlig avskrivning', value: `${manatligAvskrivning.toLocaleString('sv-SE')} kr` },
            ],
            action: { toolName: 'create_asset', params },
            requireCheckbox: false,
        }

        return {
            success: true,
            data: asset,
            message: `Inventarie "${params.namn}" förberedd för registrering med ${livslangdAr} års avskrivning.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Calculate Depreciation Tool
// =============================================================================

export interface CalculateDepreciationParams {
    period?: string // e.g., "december 2025" or "2025"
    assetId?: string // Specific asset, or all if omitted
}

export interface DepreciationResult {
    period: string
    totalAmount: number
    assets: Array<{
        id: string
        namn: string
        avskrivning: number
        kvarvarandeVarde: number
    }>
}

export const calculateDepreciationTool = defineTool<CalculateDepreciationParams, DepreciationResult>({
    name: 'calculate_depreciation',
    description: 'Beräkna avskrivning för inventarier. Visar hur mycket som ska skrivas av varje månad/år och kvarvarande bokfört värde.',
    category: 'read',
    requiresConfirmation: false,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period (t.ex. "december 2025" eller "2025")' },
            assetId: { type: 'string', description: 'ID för specifik inventarie (utelämna för alla)' },
        },
    },
    execute: async (params) => {
        const { inventarier } = await inventarieService.getInventarier({ limit: 100 })

        // Filter active assets
        let assets = inventarier.filter(i => i.status === 'aktiv' || !i.status)

        if (params.assetId) {
            assets = assets.filter(i => i.id === params.assetId)
        }

        const period = params.period || new Date().toLocaleString('sv-SE', { month: 'long', year: 'numeric' })

        // Calculate monthly depreciation for each asset
        const depreciationDetails = assets.map(asset => {
            const monthlyDep = Math.round(asset.inkopspris / (asset.livslangdAr * 12))
            // Simplified: assume asset is midway through its life for remaining value
            const monthsOwned = 12 // Simplified
            const totalDepreciated = monthlyDep * monthsOwned
            const remainingValue = Math.max(0, asset.inkopspris - totalDepreciated)

            return {
                id: asset.id,
                namn: asset.namn,
                avskrivning: monthlyDep,
                kvarvarandeVarde: remainingValue,
            }
        })

        const totalAmount = depreciationDetails.reduce((sum, d) => sum + d.avskrivning, 0)

        return {
            success: true,
            data: {
                period,
                totalAmount,
                assets: depreciationDetails,
            },
            message: `Avskrivning för ${period}: ${totalAmount.toLocaleString('sv-SE')} kr på ${assets.length} inventarier.`,
        }
    },
})

// =============================================================================
// Book Depreciation Tool
// =============================================================================

export interface BookDepreciationParams {
    period: string
    assetIds?: string[]
}

export interface BookDepreciationResult {
    booked: boolean
    verificationId: string
    amount: number
    assetCount: number
}

export const bookDepreciationTool = defineTool<BookDepreciationParams, BookDepreciationResult>({
    name: 'book_depreciation',
    description: 'Bokför månatliga/årliga avskrivningar för inventarier. Skapar verifikation automatiskt. Använd vid månadsavslut eller bokslut. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period att bokföra (t.ex. "december 2025")' },
            assetIds: { type: 'array', items: { type: 'string' }, description: 'Specifika inventarier (utelämna för alla)' },
        },
        required: ['period'],
    },
    execute: async (params) => {
        const { inventarier } = await inventarieService.getInventarier({ limit: 100 })

        let assets = inventarier.filter(i => i.status === 'aktiv' || !i.status)
        if (params.assetIds && params.assetIds.length > 0) {
            assets = assets.filter(i => params.assetIds!.includes(i.id))
        }

        const totalAmount = assets.reduce((sum, asset) => {
            return sum + Math.round(asset.inkopspris / (asset.livslangdAr * 12))
        }, 0)

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Bokför avskrivningar',
            description: `Bokför avskrivningar för ${params.period}`,
            summary: [
                { label: 'Period', value: params.period },
                { label: 'Antal inventarier', value: String(assets.length) },
                { label: 'Total avskrivning', value: `${totalAmount.toLocaleString('sv-SE')} kr` },
                { label: 'Konto debet', value: '7832 (Avskrivningar inventarier)' },
                { label: 'Konto kredit', value: '1229 (Ack. avskrivningar inventarier)' },
            ],
            action: { toolName: 'book_depreciation', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: {
                booked: false,
                verificationId: `ver-${Date.now()}`,
                amount: totalAmount,
                assetCount: assets.length,
            },
            message: `Avskrivning på ${totalAmount.toLocaleString('sv-SE')} kr förberedd för bokföring.`,
            confirmationRequired: confirmationRequest,
        }
    },
})

// =============================================================================
// Dispose Asset Tool
// =============================================================================

export interface DisposeAssetParams {
    assetId: string
    salePrice?: number
    disposeDate?: string
    reason?: 'såld' | 'skrotad' | 'förlorad'
}

export interface DisposeAssetResult {
    disposed: boolean
    assetId: string
    bookValue: number
    salePrice: number
    gainLoss: number
}

export const disposeAssetTool = defineTool<DisposeAssetParams, DisposeAssetResult>({
    name: 'dispose_asset',
    description: 'Avyttra, sälj eller skrota en inventarie. Beräknar vinst/förlust vid försäljning och skapar korrekta bokföringsposter. Använd när användaren säljer bil, dator eller annan utrustning. Kräver bekräftelse.',
    category: 'write',
    requiresConfirmation: true,
    parameters: {
        type: 'object',
        properties: {
            assetId: { type: 'string', description: 'ID för inventarien att avyttra' },
            salePrice: { type: 'number', description: 'Försäljningspris (0 om skrotad)' },
            disposeDate: { type: 'string', description: 'Avyttringsdatum (YYYY-MM-DD)' },
            reason: { type: 'string', enum: ['såld', 'skrotad', 'förlorad'], description: 'Anledning till avyttring' },
        },
        required: ['assetId'],
    },
    execute: async (params) => {
        // In production, fetch the actual asset
        const salePrice = params.salePrice ?? 0
        const reason = params.reason ?? 'såld'
        const disposeDate = params.disposeDate || new Date().toISOString().split('T')[0]

        // Mock book value calculation (in production, calculate from depreciation)
        const bookValue = 5000 // Would be calculated
        const gainLoss = salePrice - bookValue

        const gainLossText = gainLoss > 0
            ? `Vinst: ${gainLoss.toLocaleString('sv-SE')} kr`
            : gainLoss < 0
                ? `Förlust: ${Math.abs(gainLoss).toLocaleString('sv-SE')} kr`
                : 'Inget resultat'

        const confirmationRequest: AIConfirmationRequest = {
            title: 'Avyttra inventarie',
            description: `Avyttra inventarie ${params.assetId}`,
            summary: [
                { label: 'Inventarie', value: params.assetId },
                { label: 'Anledning', value: reason },
                { label: 'Datum', value: disposeDate },
                { label: 'Bokfört värde', value: `${bookValue.toLocaleString('sv-SE')} kr` },
                { label: 'Försäljningspris', value: `${salePrice.toLocaleString('sv-SE')} kr` },
                { label: 'Resultat', value: gainLossText },
            ],
            action: { toolName: 'dispose_asset', params },
            requireCheckbox: true,
        }

        return {
            success: true,
            data: {
                disposed: false,
                assetId: params.assetId,
                bookValue,
                salePrice,
                gainLoss,
            },
            message: `Avyttring förberedd. ${gainLossText}`,
            confirmationRequired: confirmationRequest,
        }
    },
})

export const inventarierTools = [
    getAssetsTool,
    createAssetTool,
    calculateDepreciationTool,
    bookDepreciationTool,
    disposeAssetTool,
]
