import { NextResponse } from 'next/server'
import { db } from '@/lib/server-db'
import { randomUUID } from 'crypto'

interface ProcessRequest {
    inboxId: string
    targetType: 'receipt' | 'invoice' // invoice = supplier-invoice in our context
}

export async function POST(request: Request) {
    try {
        const body: ProcessRequest = await request.json()
        const { inboxId, targetType } = body

        if (!inboxId || !targetType) {
            return NextResponse.json({ error: 'Missing inboxId or targetType' }, { status: 400 })
        }

        // 1. Fetch Inbox Items to find the one we need
        const allItems = await db.getInboxItems()
        const inboxItem = allItems.find((item: any) => item.id === inboxId)

        if (!inboxItem) {
            return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 })
        }

        // 2. Prepare data from inbox item
        const newId = randomUUID()
        const today = new Date().toISOString().split('T')[0]

        // Extract data from documentData if present, otherwise use defaults
        const docData = inboxItem.documentData || {}

        if (targetType === 'receipt') {
            // Create Receipt
            const receipt = {
                id: newId,
                supplier: docData.companyName || inboxItem.sender,
                amount: docData.subtotal || docData.total || 0,
                date: docData.invoiceDate || today,
                category: 'Övrigt',
                status: 'mottagen',
                source: 'inbox',
                createdBy: 'ai_workflow'
            }
            await db.addReceipt(receipt)
        } else if (targetType === 'invoice') {
            // Create Supplier Invoice
            const supplierInvoice = {
                id: newId,
                invoiceNumber: docData.invoiceNumber || `INV-${Date.now()}`,
                supplierName: docData.companyName || inboxItem.sender,
                amount: docData.subtotal || 0,
                vatAmount: docData.vatAmount || 0,
                totalAmount: docData.total || 0,
                dueDate: docData.dueDate || today,
                invoiceDate: docData.invoiceDate || today,
                status: 'mottagen',
            }
            await db.addSupplierInvoice(supplierInvoice)
        } else {
            return NextResponse.json({ error: `Unknown targetType: ${targetType}` }, { status: 400 })
        }

        // 3. Update Inbox Item to mark as processed
        await db.updateInboxItem(inboxId, {
            aiStatus: 'approved',
            linkedEntityId: newId,
            linkedEntityType: targetType
        })

        return NextResponse.json({
            success: true,
            message: `Created ${targetType} from inbox item`,
            linkedEntityId: newId,
            linkedEntityType: targetType
        })
    } catch (error) {
        console.error('Inbox process error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
