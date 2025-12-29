
import { NextResponse } from 'next/server'
import type { InboxItem } from '@/types'
import { db } from "@/lib/server-db"
import { randomUUID } from "crypto"

export async function GET() {
    const items = await db.getInboxItems()
    return NextResponse.json({ items })
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { action, item, type, dataType, data } = body

        // Handle clear action
        if (action === 'clear') {
            await db.clearInbox()
            return NextResponse.json({ success: true })
        }

        // Handle typed data from simulator/receiver
        // dataType: 'transaction' | 'receipt' | 'invoice' | 'supplier-invoice' | 'inbox-item'
        if (dataType && data) {
            const id = data.id || randomUUID()
            const timestamp = new Date()

            switch (dataType) {
                case 'transaction':
                    const transaction = {
                        id,
                        description: data.name || data.description,
                        amount: data.amount,
                        date: data.date || timestamp.toISOString().split('T')[0],
                        account: data.account || 'foretagskonto',
                        status: 'pending',
                        source: data.source || 'user_reported',
                        createdBy: data.createdBy || 'ai_assistant'
                    }
                    await db.addTransaction(transaction)
                    return NextResponse.json({ success: true, dataType, item: transaction })

                case 'receipt':
                    const receipt = {
                        id,
                        supplier: data.merchant || data.name,
                        amount: data.amount,
                        date: data.date || timestamp.toISOString().split('T')[0],
                        category: data.category || 'Övrigt',
                        status: 'pending',
                        source: data.source || 'user_reported',
                        createdBy: data.createdBy || 'ai_assistant'
                    }
                    await db.addReceipt(receipt)
                    return NextResponse.json({ success: true, dataType, item: receipt })

                case 'invoice':
                    const invoice = {
                        id,
                        invoiceNumber: data.invoiceNumber,
                        customerName: data.customerName,
                        amount: data.amount,
                        vatAmount: data.vatAmount,
                        totalAmount: data.totalAmount,
                        issueDate: data.issueDate || data.date,
                        dueDate: data.dueDate,
                        status: data.status || 'draft',
                        source: data.source || 'user_reported',
                        createdBy: data.createdBy || 'ai_assistant'
                    }
                    await db.addInvoice(invoice)
                    return NextResponse.json({ success: true, dataType, item: invoice })

                case 'supplier-invoice':
                    const supplierInvoice = {
                        id,
                        invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
                        supplierName: data.supplier || data.name,
                        amount: data.amount,
                        totalAmount: data.amount,
                        dueDate: data.dueDate || timestamp.toISOString().split('T')[0],
                        invoiceDate: data.date || timestamp.toISOString().split('T')[0],
                        status: data.status || 'pending',
                    }
                    await db.addSupplierInvoice(supplierInvoice)
                    return NextResponse.json({ success: true, dataType, item: supplierInvoice })

                case 'inbox-item':
                    // Fall through to existing inbox item logic
                    break

                default:
                    return NextResponse.json({ error: `Unknown dataType: ${dataType}` }, { status: 400 })
            }
        }

        // Legacy: Create inbox item by type
        if (action === 'create' && type) {
            const newItem: InboxItem = {
                id: randomUUID(),
                timestamp: new Date(),
                date: "Idag",
                read: false,
                starred: false,
                sender: "Unknown",
                title: "No Title",
                description: "No description",
                category: "other",
                aiStatus: 'pending',
                ...(generateMockItem(type) as any)
            }
            await db.addInboxItem(newItem)
            return NextResponse.json({ success: true, item: newItem })
        }

        // Allow direct creation with full item
        if (item) {
            const newItem: InboxItem = {
                ...item,
                id: item.id || randomUUID(),
                timestamp: new Date(item.timestamp || new Date()),
            }
            await db.addInboxItem(newItem)
            return NextResponse.json({ success: true, item: newItem })
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    } catch (error) {
        console.error('Receive API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, ...updates } = body

        const result = await db.updateInboxItem(id, updates)
        return NextResponse.json({ success: true, item: result })
    } catch (error) {
        console.error('PATCH error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

function generateMockItem(type: string): Partial<InboxItem> {
    const today = new Date()
    const invoiceDate = today.toISOString().split('T')[0]
    const dueDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    switch (type) {
        case 'skatteverket-skatt':
            return {
                sender: 'Skatteverket',
                title: 'Beslut om slutlig skatt',
                description: 'Ditt besked om slutlig skatt finns nu att läsa.',
                category: 'skatt',
                aiSuggestion: 'Bokför som skattekostnad'
            }
        case 'skatteverket-moms':
            return {
                sender: 'Skatteverket',
                title: 'Dags att deklarera moms',
                description: 'Momsdeklaration för perioden ska vara inlämnad senast den 12:e.',
                category: 'skatt',
                aiSuggestion: 'Skapa momsrapport'
            }
        case 'bolagsverket':
            return {
                sender: 'Bolagsverket',
                title: 'Ärende registrerat',
                description: 'Ditt ärende om ändring av styrelse har registrerats.',
                category: 'myndighet',
                aiSuggestion: null
            }
        case 'kivra-invoice':
            return {
                sender: 'Fortum Sverige AB',
                title: 'Faktura för El - December 2024',
                description: `Fakturanummer: FO-${Math.floor(Math.random() * 100000)}

Elförbrukning December 2024: 1000 kr
Nätavgift: 250 kr
Moms (25%): 312.50 kr
Totalt att betala: 1562.50 kr

Förfallodatum: ${dueDate}
Bankgiro: 5050-1234
OCR: ${Math.floor(Math.random() * 90000000000) + 10000000000}

Betala senast förfallodagen.`,
                category: 'other',
                aiSuggestion: null,
                // documentData for UI/preview only - AI reads description
                documentData: {
                    type: 'invoice',
                    companyName: 'Fortum Sverige AB',
                    companyLogo: '/logos/fortum.png',
                    companyAddress: 'Box 1026, 169 03 Solna',
                    companyOrgNr: '556059-4523',
                    companyPhone: '010-850 00 00',
                    companyEmail: 'kundservice@fortum.se',
                    invoiceNumber: `FO-${Math.floor(Math.random() * 100000)}`,
                    invoiceDate: invoiceDate,
                    dueDate: dueDate,
                    customerName: 'Ditt Företag AB',
                    customerAddress: 'Din Gata 123, 123 45 Stockholm',
                    lineItems: [
                        {
                            description: 'Elförbrukning December 2024',
                            quantity: 1,
                            unitPrice: 1000,
                            vatRate: 25,
                            amount: 1000
                        },
                        {
                            description: 'Nätavgift',
                            quantity: 1,
                            unitPrice: 250,
                            vatRate: 25,
                            amount: 250
                        }
                    ],
                    subtotal: 1250,
                    vatAmount: 312.50,
                    total: 1562.50,
                    paymentInfo: {
                        bankgiro: '5050-1234',
                        ocrNumber: `${Math.floor(Math.random() * 90000000000) + 10000000000}`,
                    },
                    notes: 'Betala senast förfallodagen för att undvika förseningsavgift.'
                }
            }
        case 'gmail-invoice':
            return {
                sender: 'Notion Labs Inc.',
                title: 'Invoice NOT-' + Math.floor(Math.random() * 10000),
                description: `Notion Pro Plan - Monthly Subscription

Amount: $12.00 (120 kr)
VAT (25%): 30 kr
Total: 150 kr

Payment Date: ${invoiceDate}
Payment: Automatically charged to card ending in 4242

Thank you for your business!`,
                category: 'other',
                aiSuggestion: null,
                documentData: {
                    type: 'invoice',
                    companyName: 'Notion Labs Inc.',
                    companyLogo: '/logos/notion.png',
                    companyAddress: '2300 Harrison St, San Francisco, CA',
                    companyOrgNr: 'US-461234567',
                    invoiceNumber: `NOT-${Math.floor(Math.random() * 10000)}`,
                    invoiceDate: invoiceDate,
                    dueDate: invoiceDate,
                    customerName: 'Ditt Företag AB',
                    lineItems: [{ description: 'Notion Pro Plan', quantity: 1, unitPrice: 120, vatRate: 25, amount: 120 }],
                    subtotal: 120,
                    vatAmount: 30,
                    total: 150,
                    paymentInfo: { ocrNumber: `${Math.floor(Math.random() * 90000000000) + 10000000000}` },
                    notes: 'Payment automatically charged to card.'
                }
            }
        case 'yahoo-invoice':
            return {
                sender: 'One.com Nordic AB',
                title: 'Faktura ONE-' + Math.floor(Math.random() * 100000),
                description: `Domänförnyelse - yourcompany.se

Belopp: 189 kr
Moms (25%): 47.25 kr
Totalt: 236.25 kr

Förfallodatum: ${dueDate}
Bankgiro: 5851-7200
OCR: ${Math.floor(Math.random() * 90000000000) + 10000000000}`,
                category: 'other',
                aiSuggestion: null,
            }
        case 'outlook-invoice':
            return {
                sender: 'Microsoft Ireland',
                title: 'Invoice MS-' + Math.floor(Math.random() * 1000000),
                description: `Microsoft 365 Business Standard
Monthly Subscription (3 users)

Amount: 405 kr
VAT (25%): 101.25 kr
Total: 506.25 kr

Payment Date: ${invoiceDate}
Automatic renewal - Payment charged to card

Ref: microsoftinvoice@microsoft.com`,
                category: 'other',
                aiSuggestion: null,
            }
        default:
            return {
                sender: 'Systemet',
                title: 'Händelse',
                description: 'En ny händelse har inträffat',
                category: 'other',
                aiSuggestion: null
            }
    }
}
