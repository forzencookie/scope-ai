// Swedish tax/accounting term explanations
export const termExplanations: Record<string, string> = {
    "Momsdeklaration": "Rapport till Skatteverket om moms (mervärdesskatt) du samlat in och betalat. Lämnas månads- eller kvartalsvis.",
    "Inkomstdeklaration": "Årlig rapport till Skatteverket om företagets inkomster och kostnader. Används för att beräkna inkomstskatt.",
    "Årsredovisning": "Sammanfattning av företagets ekonomi för ett räkenskapsår. Obligatorisk för aktiebolag.",
    "Utgående moms": "Moms du tar ut av dina kunder vid försäljning (25%, 12% eller 6%).",
    "Ingående moms": "Moms du betalar på inköp som du får dra av.",
    "Moms att betala": "Skillnaden mellan utgående och ingående moms. Betalas till Skatteverket.",
    "INK2": "Inkomstdeklaration 2 - skatteblanketten för aktiebolag.",
    "Rörelseresultat": "Vinst/förlust från kärnverksamheten, före finansiella poster och skatt.",
    "3:12-regler": "Regler för hur utdelning från fåmansbolag beskattas. Påverkar hur mycket du kan ta ut som kapitalinkomst.",
    "Gränsbelopp": "Max belopp du kan ta ut som kapitalinkomst (lägre skatt) enligt 3:12-reglerna.",
}

// VAT periods data
export const vatPeriods = [
    { period: "Q4 2024", dueDate: "12 feb 2025", status: "upcoming", salesVat: 125000, inputVat: 45000, netVat: 80000 },
    { period: "Q3 2024", dueDate: "12 nov 2024", status: "submitted", salesVat: 118500, inputVat: 42300, netVat: 76200 },
    { period: "Q2 2024", dueDate: "12 aug 2024", status: "submitted", salesVat: 132000, inputVat: 48500, netVat: 83500 },
    { period: "Q1 2024", dueDate: "12 maj 2024", status: "submitted", salesVat: 98000, inputVat: 35200, netVat: 62800 },
]

// Income declaration items
export const declarationItems = [
    { label: "Rörelseintäkter", value: 1850000 },
    { label: "Rörelsekostnader", value: -1420000 },
    { label: "Rörelseresultat", value: 430000, highlight: true },
    { label: "Finansiella intäkter", value: 2500 },
    { label: "Finansiella kostnader", value: -8500 },
    { label: "Resultat före skatt", value: 424000, highlight: true },
    { label: "Skatt (20,6%)", value: -87344 },
    { label: "Årets resultat", value: 336656, highlight: true },
]

// INK2 tax form fields
export const ink2Fields = [
    { field: "1.1", label: "Nettoomsättning", value: 1850000 },
    { field: "1.4", label: "Övriga rörelseintäkter", value: 0 },
    { field: "2.1", label: "Råvaror och förnödenheter", value: -320000 },
    { field: "2.4", label: "Övriga externa kostnader", value: -580000 },
    { field: "2.5", label: "Personalkostnader", value: -520000 },
    { field: "2.7", label: "Avskrivningar", value: -45000 },
    { field: "3.1", label: "Ränteintäkter", value: 2500 },
    { field: "3.3", label: "Räntekostnader", value: -8500 },
    { field: "4.1", label: "Bokfört resultat", value: 379000 },
]

// Annual report sections
export const reportSections = [
    { name: "Förvaltningsberättelse", status: "complete", description: "Verksamhetsbeskrivning och väsentliga händelser" },
    { name: "Resultaträkning", status: "complete", description: "Intäkter, kostnader och årets resultat" },
    { name: "Balansräkning", status: "complete", description: "Tillgångar, skulder och eget kapital" },
    { name: "Noter", status: "incomplete", description: "Tilläggsupplysningar och redovisningsprinciper" },
    { name: "Underskrifter", status: "pending", description: "Styrelsens underskrifter" },
]

// Employer contribution periods
export const contributionPeriods = [
    { month: "December 2024", dueDate: "12 jan 2025", status: "upcoming", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "November 2024", dueDate: "12 dec 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "Oktober 2024", dueDate: "12 nov 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "September 2024", dueDate: "12 okt 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "Augusti 2024", dueDate: "12 sep 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
]

// KPI data
export const kpis = [
    { label: "Omsättning", value: "1,85 mkr", change: "+12%", positive: true, iconName: "TrendingUp" as const },
    { label: "Resultat", value: "379 tkr", change: "+8%", positive: true, iconName: "Wallet" as const },
    { label: "Soliditet", value: "42%", change: "+3%", positive: true, iconName: "Shield" as const },
    { label: "Kassalikviditet", value: "156%", change: "-2%", positive: false, iconName: "Droplets" as const },
]

// Monthly revenue data
export const monthlyRevenue = [
    { month: "Jan", revenue: 142000, expenses: 98000, profit: 44000 },
    { month: "Feb", revenue: 156000, expenses: 112000, profit: 44000 },
    { month: "Mar", revenue: 148000, expenses: 105000, profit: 43000 },
    { month: "Apr", revenue: 165000, expenses: 118000, profit: 47000 },
    { month: "Maj", revenue: 172000, expenses: 125000, profit: 47000 },
    { month: "Jun", revenue: 158000, expenses: 108000, profit: 50000 },
    { month: "Jul", revenue: 134000, expenses: 95000, profit: 39000 },
    { month: "Aug", revenue: 145000, expenses: 102000, profit: 43000 },
    { month: "Sep", revenue: 168000, expenses: 120000, profit: 48000 },
    { month: "Okt", revenue: 175000, expenses: 128000, profit: 47000 },
    { month: "Nov", revenue: 162000, expenses: 115000, profit: 47000 },
    { month: "Dec", revenue: 125000, expenses: 88000, profit: 37000 },
]

// Expense categories
export const expenseCategories = [
    { category: "Personal", amount: 520000, percentage: 37 },
    { category: "Lokalkostnader", amount: 180000, percentage: 13 },
    { category: "Marknadsföring", amount: 95000, percentage: 7 },
    { category: "IT & Teknik", amount: 125000, percentage: 9 },
    { category: "Övriga kostnader", amount: 500000, percentage: 34 },
]

// Bar chart colors
export const barColors = [
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
    { solid: '#3b82f6', stripe: '#60a5fa' },
    { solid: '#6366f1', stripe: '#818cf8' },
]
