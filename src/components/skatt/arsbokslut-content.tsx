"use client"

import {
    Calendar,
    Building2,
    Clock,
    Bot,
} from "lucide-react"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { SectionCard } from "@/components/ui/section-card"
import {
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell
} from "@/components/ui/data-table"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { useAccountBalances, type AccountActivity } from "@/hooks/use-account-balances"

// Simplified P&L data for sole proprietors
const simplifiedPLItems = [
    { label: "Försäljning och övriga intäkter", value: 485000, bold: true },
    { label: "Varor, material och tjänster", value: -125000 },
    { label: "Övriga externa kostnader", value: -85000 },
    { label: "Personalkostnader", value: 0 },
    { label: "Avskrivningar", value: -15000 },
    { label: "Årets resultat", value: 260000, bold: true, separator: true },
]

// Simplified Balance Sheet data
const simplifiedBalanceSheet = {
    assets: [
        { label: "Tillgångar", value: 385000, bold: true },
        { label: "Inventarier", value: 45000, indent: true },
        { label: "Kundfordringar", value: 62000, indent: true },
        { label: "Kassa och bank", value: 278000, indent: true },
    ],
    liabilities: [
        { label: "Eget kapital och skulder", value: 385000, bold: true, separator: true },
        { label: "Eget kapital", value: 310000, indent: true },
        { label: "Leverantörsskulder", value: 45000, indent: true },
        { label: "Skatteskulder", value: 30000, indent: true },
    ],
}

export function ArsbokslutContent() {
    const { companyTypeName } = useCompany()
    const { text } = useTextMode()
    const { accountBalances, totals, isLoading } = useAccountBalances()

    // Map Account Balances to Report Structure
    // BAS 2024 Simplified Mapping

    // P&L
    const sales = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 3000 && parseInt(a.accountNumber) <= 3999)
        .reduce((sum: number, a: AccountActivity) => sum + (a.balance * -1), 0) // Revenue is Credit (-), flip to positive

    const materials = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 4000 && parseInt(a.accountNumber) <= 4999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) // Cost is Debit (+)

    const externalExpenses = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 5000 && parseInt(a.accountNumber) <= 6999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const personnel = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 7000 && parseInt(a.accountNumber) <= 7699)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const depreciations = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 7800 && parseInt(a.accountNumber) <= 7999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const financialItems = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 8000 && parseInt(a.accountNumber) <= 8999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) // Net financial

    // Resultat: Sales - Costs (Materials + External + Personnel + Depreciations + Financial)
    // Note: Costs are positive numbers here (Debit balances).
    // Sales is positive number (flipped from Credit).
    // Result = Sales - Sum(Costs).

    // However, financial items might be mixed (interest income vs expense).
    // Use raw balance sum for financial: 
    // If it's Debit (+), it's expense. If Credit (-), it's income.
    // Let's stick to consistent sign logic:
    // Expenses are usually Debit (+). Revenue Credit (-).
    // Net Result = (Sum of all P&L accounts) * -1.
    // If Result is negative (Credit heavy), flipping makes it positive Profit.
    const result = Math.round(totals.netIncome)

    // Construct P&L Rows
    const plRows = [
        { label: "Försäljning och övriga intäkter", value: Math.round(sales), bold: true },
        { label: "Varor, material och tjänster", value: Math.round(materials) * -1 }, // Display as negative for cost
        { label: "Övriga externa kostnader", value: Math.round(externalExpenses) * -1 },
        { label: "Personalkostnader", value: Math.round(personnel) * -1 },
        { label: "Avskrivningar", value: Math.round(depreciations) * -1 },
        { label: "Finansiella poster", value: Math.round(financialItems) * -1 },
        { label: "Årets resultat", value: result, bold: true, separator: true },
    ]

    // Balance Sheet
    // Assets (1xxx)
    const fixedAssets = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 1000 && parseInt(a.accountNumber) <= 1399)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const receivables = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 1500 && parseInt(a.accountNumber) <= 1799)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const cash = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 1900 && parseInt(a.accountNumber) <= 1999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0)

    const totalAssets = Math.round(totals.assets)

    // Equity & Liabilities (2xxx)
    // Equity (20xx). Credit is negative.
    const equity = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2000 && parseInt(a.accountNumber) <= 2099)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    // Add current result to Equity presentation? Usually "Årets resultat" is a separate line or part of Equity.
    // In simplified balance sheet: Equity + Result should equal Net Assets.
    // Let's just list Equity as booked + Result.

    const payables = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2400 && parseInt(a.accountNumber) <= 2499)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const taxes = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2500 && parseInt(a.accountNumber) <= 2699)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    const otherLiabilities = accountBalances
        .filter((a: AccountActivity) => parseInt(a.accountNumber) >= 2700 && parseInt(a.accountNumber) <= 2999)
        .reduce((sum: number, a: AccountActivity) => sum + a.balance, 0) * -1

    // Calculate total Equity & Liabilities to ensure it matches Assets
    // Current Equity (Booked) + Result + Liabilities
    const totalEqLiab = Math.round(equity + result + payables + taxes + otherLiabilities)

    const balanceSheet = {
        assets: [
            { label: "Tillgångar", value: totalAssets, bold: true },
            { label: "Anläggningstillgångar", value: Math.round(fixedAssets), indent: true },
            { label: "Kundfordringar mm", value: Math.round(receivables), indent: true },
            { label: "Kassa och bank", value: Math.round(cash), indent: true },
        ],
        liabilities: [
            { label: "Eget kapital och skulder", value: totalEqLiab, bold: true, separator: true },
            { label: "Eget kapital (inkl. årets resultat)", value: Math.round(equity + result), indent: true },
            { label: "Leverantörsskulder", value: Math.round(payables), indent: true },
            { label: "Skatteskulder", value: Math.round(taxes), indent: true },
            { label: "Övriga skulder", value: Math.round(otherLiabilities), indent: true },
        ],
    }

    if (isLoading) {
        return <div className="p-12 text-center text-muted-foreground">Läser in bokföring...</div>
    }

    return (
        <main className="flex-1 flex flex-col px-6 pt-2 pb-6">
            <div className="max-w-6xl w-full space-y-6">
                <StatCardGrid columns={3}>
                    <StatCard
                        label={text.reports.fiscalYear}
                        value="2024"
                        subtitle="2024-01-01 – 2024-12-31"
                        icon={Calendar}
                    />
                    <StatCard
                        label={text.reports.companyType}
                        value={companyTypeName}
                        subtitle={text.reports.simplified}
                        icon={Building2}
                    />
                    <StatCard
                        label={text.reports.reportStatus}
                        value={text.reports.workInProgress}
                        subtitle={`${text.reports.deadline}: 2 maj 2025`}
                        icon={Clock}
                    />
                </StatCardGrid>

                {/* Section Separator */}
                <div className="border-b-2 border-border/60" />

                <SectionCard
                    icon={Bot}
                    title={text.reports.aiYearEnd}
                    description={text.reports.aiYearEndDesc}
                    variant="ai"
                    onAction={() => { }}
                />

                {/* Simplified P&L for sole proprietors */}
                <DataTable title={text.reports.profitLossSimplified}>
                    <DataTableHeader>
                        <DataTableHeaderCell label={text.reports.tablePost} />
                        <DataTableHeaderCell label={text.reports.tableAmount} align="right" />
                    </DataTableHeader>
                    <DataTableBody>
                        {plRows.map((item) => (
                            <DataTableRow key={item.label} className={item.separator ? "border-t-2" : ""}>
                                <DataTableCell bold={item.bold}>{item.label}</DataTableCell>
                                <DataTableCell align="right" bold={item.bold}>
                                    {item.value.toLocaleString('sv-SE')} kr
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>

                {/* Simplified Balance Sheet */}
                <DataTable title={text.reports.balanceSheetSimplified}>
                    <DataTableHeader>
                        <DataTableHeaderCell label={text.reports.tablePost} />
                        <DataTableHeaderCell label={text.reports.tableAmount} align="right" />
                    </DataTableHeader>
                    <DataTableBody>
                        {balanceSheet.assets.map((item) => (
                            <DataTableRow key={item.label}>
                                <DataTableCell bold={item.bold} className={item.indent ? "pl-6" : ""}>
                                    {item.label}
                                </DataTableCell>
                                <DataTableCell align="right" bold={item.bold}>
                                    {item.value.toLocaleString('sv-SE')} kr
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                        {balanceSheet.liabilities.map((item) => (
                            <DataTableRow key={item.label} className={item.separator ? "border-t" : ""}>
                                <DataTableCell bold={item.bold} className={item.indent ? "pl-6" : ""}>
                                    {item.label}
                                </DataTableCell>
                                <DataTableCell align="right" bold={item.bold}>
                                    {item.value.toLocaleString('sv-SE')} kr
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTableBody>
                </DataTable>
            </div>
        </main>
    )
}
