/**
 * Bokföring AI Tools - Inventarier (Assets)
 *
 * Tools for managing fixed assets, depreciation, and disposal.
 */

import { defineTool, AIConfirmationRequest } from '../registry'
import { inventarieService, type Inventarie } from '@/services/inventarie-service'
import { verificationService } from '@/services/verification-service'

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
    domain: 'bokforing',
    keywords: ['inventarier', 'tillgångar', 'anläggningstillgång'],
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
    domain: 'bokforing',
    keywords: ['skapa', 'inventarie', 'tillgång', 'köp'],
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
    execute: async (params, context) => {
        const inkopsdatum = params.inkopsdatum || new Date().toISOString().split('T')[0]
        const livslangdAr = params.livslangdAr ?? 5
        const kategori = params.kategori || 'Inventarier'

        // Calculate annual depreciation
        const arligAvskrivning = Math.round(params.inkopspris / livslangdAr)
        const manatligAvskrivning = Math.round(arligAvskrivning / 12)

        // If confirmed, persist to database
        if (context?.isConfirmed) {
            try {
                const saved = await inventarieService.addInventarie({
                    namn: params.namn,
                    inkopspris: params.inkopspris,
                    inkopsdatum,
                    kategori,
                    livslangdAr,
                    anteckningar: params.anteckningar,
                    status: 'aktiv',
                })

                return {
                    success: true,
                    data: {
                        id: saved.id,
                        namn: params.namn,
                        inkopspris: params.inkopspris,
                        inkopsdatum,
                        kategori,
                        livslangdAr,
                        anteckningar: params.anteckningar,
                        status: 'aktiv' as const,
                    },
                    message: `Inventarie "${params.namn}" registrerad (${params.inkopspris.toLocaleString('sv-SE')} kr, ${livslangdAr} års avskrivning).`,
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Kunde inte spara inventarie.'
                return { success: false, error: msg }
            }
        }

        // Preflight: return confirmation request
        const asset: Inventarie = {
            id: 'pending',
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
    domain: 'bokforing',
    keywords: ['avskrivning', 'beräkna', 'värdeminskning'],
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
        const now = new Date()
        const depreciationDetails = assets.map(asset => {
            const totalMonths = asset.livslangdAr * 12
            const monthlyDep = Math.round(asset.inkopspris / totalMonths)

            // Calculate actual months owned from purchase date
            const purchaseDate = new Date(asset.inkopsdatum)
            const monthsOwned = Math.max(0,
                (now.getFullYear() - purchaseDate.getFullYear()) * 12
                + (now.getMonth() - purchaseDate.getMonth())
            )
            // Cap depreciation at total useful life
            const depreciatedMonths = Math.min(monthsOwned, totalMonths)
            const totalDepreciated = monthlyDep * depreciatedMonths
            const remainingValue = Math.max(0, asset.inkopspris - totalDepreciated)

            return {
                id: asset.id,
                namn: asset.namn,
                avskrivning: depreciatedMonths < totalMonths ? monthlyDep : 0,
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
    domain: 'bokforing',
    keywords: ['bokföra', 'avskrivning', 'inventarie'],
    parameters: {
        type: 'object',
        properties: {
            period: { type: 'string', description: 'Period att bokföra (t.ex. "december 2025")' },
            assetIds: { type: 'array', items: { type: 'string' }, description: 'Specifika inventarier (utelämna för alla)' },
        },
        required: ['period'],
    },
    execute: async (params, context) => {
        const { inventarier } = await inventarieService.getInventarier({ limit: 100 })

        let assets = inventarier.filter(i => i.status === 'aktiv' || !i.status)
        if (params.assetIds && params.assetIds.length > 0) {
            assets = assets.filter(i => params.assetIds!.includes(i.id))
        }

        const totalAmount = assets.reduce((sum, asset) => {
            return sum + Math.round(asset.inkopspris / (asset.livslangdAr * 12))
        }, 0)

        // If confirmed, create real verification
        if (context?.isConfirmed) {
            try {
                // Parse period to get a date (last day of the month)
                const today = new Date()
                const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

                const assetNames = assets.map(a => a.namn).join(', ')
                const verification = await verificationService.createVerification({
                    series: 'A',
                    date,
                    description: `Avskrivningar ${params.period}: ${assetNames}`,
                    entries: [
                        { account: '7832', debit: totalAmount, credit: 0, description: 'Avskrivningar inventarier' },
                        { account: '1229', debit: 0, credit: totalAmount, description: 'Ack. avskrivningar inventarier' },
                    ],
                    sourceType: 'depreciation',
                })

                return {
                    success: true,
                    data: {
                        booked: true,
                        verificationId: verification.id,
                        amount: totalAmount,
                        assetCount: assets.length,
                    },
                    message: `Avskrivning bokförd: ${verification.series}${verification.number} (${totalAmount.toLocaleString('sv-SE')} kr).`,
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Kunde inte bokföra avskrivning.'
                return { success: false, error: msg }
            }
        }

        // Preflight: return confirmation request
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
                verificationId: 'pending',
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
    domain: 'bokforing',
    keywords: ['avyttra', 'sälja', 'inventarie', 'skrota'],
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
    execute: async (params, context) => {
        const salePrice = params.salePrice ?? 0
        const reason = params.reason ?? 'såld'
        const disposeDate = params.disposeDate || new Date().toISOString().split('T')[0]

        // Calculate actual book value from depreciation
        const { inventarier } = await inventarieService.getInventarier({ limit: 100 })
        const asset = inventarier.find(i => i.id === params.assetId)

        if (!asset) {
            return { success: false, error: `Inventarie ${params.assetId} hittades inte.` }
        }

        const totalMonths = asset.livslangdAr * 12
        const monthlyDep = Math.round(asset.inkopspris / totalMonths)
        const disposeD = new Date(disposeDate)
        const purchaseD = new Date(asset.inkopsdatum)
        const monthsOwned = Math.max(0,
            (disposeD.getFullYear() - purchaseD.getFullYear()) * 12
            + (disposeD.getMonth() - purchaseD.getMonth())
        )
        const depreciatedMonths = Math.min(monthsOwned, totalMonths)
        const totalDepreciated = monthlyDep * depreciatedMonths
        const bookValue = Math.max(0, asset.inkopspris - totalDepreciated)

        const gainLoss = salePrice - bookValue

        const gainLossText = gainLoss > 0
            ? `Vinst: ${gainLoss.toLocaleString('sv-SE')} kr`
            : gainLoss < 0
                ? `Förlust: ${Math.abs(gainLoss).toLocaleString('sv-SE')} kr`
                : 'Inget resultat'

        // If confirmed, create disposal verification and update asset status
        if (context?.isConfirmed) {
            try {
                // Build disposal journal entries
                const entries = [
                    // Remove accumulated depreciation (debit 1229)
                    { account: '1229', debit: totalDepreciated, credit: 0, description: 'Ack. avskrivningar' },
                    // Remove asset at purchase price (credit 1220)
                    { account: '1220', debit: 0, credit: asset.inkopspris, description: `Avyttring ${asset.namn}` },
                ]

                // If sold: record sale proceeds
                if (salePrice > 0) {
                    entries.push({ account: '1930', debit: salePrice, credit: 0, description: 'Försäljningsintäkt' })
                }

                // Record gain or loss
                if (gainLoss > 0) {
                    entries.push({ account: '3973', debit: 0, credit: gainLoss, description: 'Vinst vid avyttring' })
                } else if (gainLoss < 0) {
                    entries.push({ account: '7973', debit: Math.abs(gainLoss), credit: 0, description: 'Förlust vid avyttring' })
                }

                const verification = await verificationService.createVerification({
                    series: 'A',
                    date: disposeDate,
                    description: `Avyttring: ${asset.namn} (${reason})`,
                    entries,
                    sourceType: 'disposal',
                    sourceId: params.assetId,
                })

                // Update asset status
                const newStatus = reason === 'skrotad' || reason === 'förlorad' ? 'avskriven' : 'såld'
                await inventarieService.updateStatus(params.assetId, newStatus)

                return {
                    success: true,
                    data: {
                        disposed: true,
                        assetId: params.assetId,
                        bookValue,
                        salePrice,
                        gainLoss,
                    },
                    message: `${asset.namn} avyttrad. Verifikation ${verification.series}${verification.number} skapad. ${gainLossText}`,
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Kunde inte avyttra inventarie.'
                return { success: false, error: msg }
            }
        }

        // Preflight: return confirmation request
        const confirmationRequest: AIConfirmationRequest = {
            title: 'Avyttra inventarie',
            description: `Avyttra inventarie ${asset.namn}`,
            summary: [
                { label: 'Inventarie', value: asset.namn },
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
