import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

// Create Prisma adapter with correct file path (relative to project root)
const adapter = new PrismaBetterSqlite3({ url: './dev.db' })

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding database...')

    // Clear existing data
    await prisma.journalEntry.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.vATReport.deleteMany()
    await prisma.taxReturn.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.receipt.deleteMany()
    await prisma.account.deleteMany()
    await prisma.company.deleteMany()

    // Create a sample Swedish company
    const company = await prisma.company.create({
        data: {
            name: 'Teknik AB',
            organisationsnr: '556789-1234',
            vatNumber: 'SE556789123401',
            address: 'Storgatan 10',
            postalCode: '111 22',
            city: 'Stockholm',
            email: 'info@teknikab.se',
            phone: '08-123 456 78',
            bankgiro: '123-4567',
            fiscalYearStart: 1,
        },
    })

    console.log(`✅ Created company: ${company.name}`)

    // Create BAS accounts (Swedish chart of accounts)
    const accounts = await Promise.all([
        prisma.account.create({ data: { accountNr: '1910', name: 'Kassa', type: 'ASSET', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '1930', name: 'Företagskonto', type: 'ASSET', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '1510', name: 'Kundfordringar', type: 'ASSET', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '2440', name: 'Leverantörsskulder', type: 'LIABILITY', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '2610', name: 'Utgående moms 25%', type: 'LIABILITY', vatRate: 25, companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '2640', name: 'Ingående moms', type: 'LIABILITY', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '3001', name: 'Försäljning varor 25%', type: 'REVENUE', vatRate: 25, companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '3002', name: 'Försäljning tjänster 25%', type: 'REVENUE', vatRate: 25, companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '4000', name: 'Inköp varor', type: 'EXPENSE', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '5010', name: 'Lokalhyra', type: 'EXPENSE', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '5410', name: 'Förbrukningsinventarier', type: 'EXPENSE', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '6110', name: 'Kontorsmaterial', type: 'EXPENSE', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '6212', name: 'Mobiltelefon', type: 'EXPENSE', companyId: company.id } }),
        prisma.account.create({ data: { accountNr: '7010', name: 'Löner', type: 'EXPENSE', companyId: company.id } }),
    ])

    console.log(`✅ Created ${accounts.length} accounts`)

    // Create sample transactions
    const transactions = await Promise.all([
        prisma.transaction.create({
            data: {
                date: new Date('2024-01-15'),
                description: 'Konsulttjänster januari',
                amount: 50000,
                vatAmount: 12500,
                vatRate: 25,
                category: 'Försäljning',
                type: 'INCOME',
                status: 'BOOKED',
                counterparty: 'Kund AB',
                companyId: company.id,
            },
        }),
        prisma.transaction.create({
            data: {
                date: new Date('2024-01-20'),
                description: 'Webbprojekt',
                amount: 75000,
                vatAmount: 18750,
                vatRate: 25,
                category: 'Försäljning',
                type: 'INCOME',
                status: 'BOOKED',
                counterparty: 'Digital Solutions AB',
                companyId: company.id,
            },
        }),
        prisma.transaction.create({
            data: {
                date: new Date('2024-01-05'),
                description: 'Kontorshyra januari',
                amount: -15000,
                vatAmount: 0,
                vatRate: 0,
                category: 'Lokalhyra',
                type: 'EXPENSE',
                status: 'BOOKED',
                counterparty: 'Fastighets AB',
                companyId: company.id,
            },
        }),
        prisma.transaction.create({
            data: {
                date: new Date('2024-01-10'),
                description: 'Kontorsmaterial',
                amount: -2500,
                vatAmount: 625,
                vatRate: 25,
                category: 'Kontorsmaterial',
                type: 'EXPENSE',
                status: 'BOOKED',
                counterparty: 'Office Depot',
                companyId: company.id,
            },
        }),
        prisma.transaction.create({
            data: {
                date: new Date('2024-01-25'),
                description: 'Programvarulicenser',
                amount: -5000,
                vatAmount: 1250,
                vatRate: 25,
                category: 'IT-kostnader',
                type: 'EXPENSE',
                status: 'VERIFIED',
                counterparty: 'Microsoft',
                companyId: company.id,
            },
        }),
        prisma.transaction.create({
            data: {
                date: new Date('2024-02-01'),
                description: 'Lunch med kund',
                amount: -850,
                vatAmount: 106.25,
                vatRate: 12,
                category: 'Representation',
                type: 'EXPENSE',
                status: 'PENDING',
                counterparty: 'Restaurang Norra',
                companyId: company.id,
            },
        }),
    ])

    console.log(`✅ Created ${transactions.length} transactions`)

    // Create sample invoices
    const invoices = await Promise.all([
        prisma.invoice.create({
            data: {
                invoiceNr: 'F2024-001',
                type: 'OUTGOING',
                customerName: 'Kund AB',
                customerOrgNr: '556111-2222',
                issueDate: new Date('2024-01-15'),
                dueDate: new Date('2024-02-14'),
                amount: 50000,
                vatAmount: 12500,
                status: 'PAID',
                paidAt: new Date('2024-02-10'),
                companyId: company.id,
            },
        }),
        prisma.invoice.create({
            data: {
                invoiceNr: 'F2024-002',
                type: 'OUTGOING',
                customerName: 'Digital Solutions AB',
                customerOrgNr: '556333-4444',
                issueDate: new Date('2024-01-20'),
                dueDate: new Date('2024-02-19'),
                amount: 75000,
                vatAmount: 18750,
                status: 'SENT',
                companyId: company.id,
            },
        }),
        prisma.invoice.create({
            data: {
                invoiceNr: 'L2024-001',
                type: 'INCOMING',
                customerName: 'Leverantör Stockholm AB',
                customerOrgNr: '556555-6666',
                issueDate: new Date('2024-01-08'),
                dueDate: new Date('2024-02-07'),
                amount: 12000,
                vatAmount: 3000,
                status: 'PAID',
                paidAt: new Date('2024-01-30'),
                companyId: company.id,
            },
        }),
    ])

    console.log(`✅ Created ${invoices.length} invoices`)

    // Create VAT report
    const vatReport = await prisma.vATReport.create({
        data: {
            period: '2024-Q1',
            periodType: 'QUARTERLY',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-03-31'),
            salesVAT25: 31250,
            salesVAT12: 106.25,
            salesVAT6: 0,
            purchaseVAT: 1875,
            vatToPay: 29481.25,
            status: 'DRAFT',
            companyId: company.id,
        },
    })

    console.log(`✅ Created VAT report: ${vatReport.period}`)

    // Create tax return
    const taxReturn = await prisma.taxReturn.create({
        data: {
            year: 2023,
            type: 'INK2',
            revenue: 1200000,
            expenses: 850000,
            result: 350000,
            taxableIncome: 350000,
            estimatedTax: 72800,
            status: 'SUBMITTED',
            submittedAt: new Date('2024-05-02'),
        },
    })

    console.log(`✅ Created tax return: ${taxReturn.year}`)

    console.log('\n🎉 Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
