
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import * as crypto from 'crypto'

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

import {
    mockTransactions,
    mockReceipts,
    mockInvoices,
    mockShareholders,
    mockAnnualMeetings,
    mockDividends
} from '@/data/mock-data'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

function generateUUID(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 32).replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}

async function seed() {
    console.log('Starting seed...')

    // 1. Get/Create User
    const { data: { users } } = await supabase.auth.admin.listUsers()
    let userId = users[0]?.id
    console.log(`User ID: ${userId}`)

    // 2. Ensure Company
    const companyId = '00000000-0000-0000-0000-000000000001'
    await supabase.from('companies').upsert({
        id: companyId,
        name: 'Demo Company AB'
    })
    console.log('Company ensured')

    // 3. Transactions
    console.log(`Seeding transactions...`)
    let txCount = 0
    for (const t of mockTransactions) {
        let status = 'Att bokföra'
        if (t.status === 'recorded') status = 'Bokförd'
        if (t.status === 'missing_documentation') status = 'Saknar underlag'

        const txId = generateUUID(t.id)
        const payload: any = {
            id: txId,
            description: t.name,
            created_at: new Date(t.date).toISOString(),
            amount: t.amountValue,
            amount_value: t.amountValue,
            status: status,
            category: t.category,
            account: t.account,
            user_id: userId,
            company_id: companyId,
            created_by: userId,
        }

        const { error } = await supabase.from('transactions').upsert(payload)
        if (error) {
            console.error(`Tx Error (${t.id}):`, error.message)
        } else {
            txCount++
        }
    }
    console.log(`Seeded ${txCount}/${mockTransactions.length} transactions`)

    // 4. Receipts
    console.log(`Seeding receipts...`)
    let rcCount = 0
    for (const r of mockReceipts) {
        const amountVal = typeof r.amount === 'string' ? parseFloat(r.amount.replace(/[^0-9.-]/g, '')) : r.amount

        const payload: any = {
            id: r.id,
            // supplier: r.supplier, // Removed
            amount: amountVal,
            status: r.status,
            // image_url: r.attachment,
            user_id: userId,
            total_amount: amountVal,
            created_at: new Date(r.date).toISOString()
        }

        let { error } = await supabase.from('receipts').upsert(payload)
        if (error) {
            if (error.message.includes('invalid input syntax for type uuid')) {
                payload.id = generateUUID(r.id)
                const { error: retryErr } = await supabase.from('receipts').upsert(payload)
                if (retryErr) console.error(`Receipt Error retry (${r.id}):`, retryErr.message)
                else rcCount++
            } else {
                console.error(`Receipt Error (${r.id}):`, error.message)
            }
        } else {
            rcCount++
        }
    }
    console.log(`Seeded ${rcCount}/${mockReceipts.length} receipts`)

    // 5. Invoices
    console.log(`Seeding invoices...`)
    for (const inv of mockInvoices) {
        const status = normalizeInvoiceStatus(inv.status)
        if (inv.type === 'customer') {
            const { error } = await supabase.from('customer_invoices').upsert({
                id: generateUUID(inv.id),
                invoice_number: inv.number,
                invoice_date: inv.date,
                due_date: inv.dueDate,
                customer_name: inv.customer,
                total_amount: inv.amount,
                status: status,
                user_id: userId,
                company_id: companyId,
                subtotal: inv.amount
            })
            if (error) console.error(`CustInvoice Error (${inv.id}):`, error.message)
        } else {
            const { error } = await supabase.from('supplier_invoices').upsert({
                id: generateUUID(inv.id),
                invoice_number: inv.number,
                supplier_name: inv.customer,
                total_amount: inv.amount,
                amount: inv.amount,
                issue_date: inv.date,
                due_date: inv.dueDate,
                status: status,
                user_id: userId,
                company_id: companyId
            })
            if (error && !error.message.includes('relation "public.supplier_invoices" does not exist')) {
                console.error(`SuppInvoice Error (${inv.id}):`, error.message)
            }
        }
    }

    // 6. Shareholders
    console.log(`Seeding shareholders...`)
    for (const sh of mockShareholders) {
        const { error } = await supabase.from('shareholders').upsert({
            name: sh.name,
            person_number: sh.ssn_org_nr,
            shares: sh.shares_count || 0,
            share_percentage: sh.shares_percentage,
            share_class: sh.share_class,
            user_id: userId,
            company_id: companyId
        })
        if (error) console.error(`Shareholder Error (${sh.id}):`, error.message)
    }

    console.log('Seed completed.')
}

function normalizeInvoiceStatus(s: string) {
    const map: any = {
        'sent': 'sent',
        'draft': 'draft',
        'paid': 'paid',
        'received': 'viewed',
        'overdue': 'overdue'
    }
    return map[s] || 'draft'
}

seed().catch(e => console.error(e))
