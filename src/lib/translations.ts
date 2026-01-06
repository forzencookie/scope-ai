/**
 * Centralized Translations for Enkel/Avancerad Mode
 * 
 * All UI text in one place for easy management.
 * Each key has both 'enkel' (beginner-friendly) and 'avancerad' (professional) versions.
 */

export const translations = {
  // ============================================================================
  // Common Actions (used throughout the app)
  // ============================================================================
  common: {
    save: { enkel: "Spara", avancerad: "Spara" },
    cancel: { enkel: "Avbryt", avancerad: "Avbryt" },
    add: { enkel: "Lägg till", avancerad: "Lägg till" },
    edit: { enkel: "Ändra", avancerad: "Redigera" },
    delete: { enkel: "Ta bort", avancerad: "Radera" },
    upload: { enkel: "Ladda upp", avancerad: "Ladda upp" },
    download: { enkel: "Ladda ner", avancerad: "Ladda ner" },
    close: { enkel: "Stäng", avancerad: "Stäng" },
    confirm: { enkel: "Bekräfta", avancerad: "Bekräfta" },
    search: { enkel: "Sök...", avancerad: "Sök..." },
  },

  // ============================================================================
  // Navigation
  // ============================================================================
  nav: {
    inbox: { enkel: "Inkorg", avancerad: "Inkorg" },
    aiRobot: { enkel: "AI-hjälpen", avancerad: "AI Robot" },
    events: { enkel: "Nyheter", avancerad: "Händelser" },
    bookkeeping: { enkel: "Min bokföring", avancerad: "Bokföring" },
    reports: { enkel: "Rapporter", avancerad: "Rapporter" },
    payroll: { enkel: "Löner", avancerad: "Löner" },
    owners: { enkel: "Ägarinfo", avancerad: "Ägare & Styrning" },
    settings: { enkel: "Inställningar", avancerad: "Inställningar" },
    statistics: { enkel: "Statistik", avancerad: "Företagsstatistik" },
    more: { enkel: "Övrigt", avancerad: "Mer" },
  },

  // ============================================================================
  // Transactions / Bokföring
  // ============================================================================
  transactions: {
    title: { enkel: "köpt och sålt", avancerad: "Transaktioner" },
    subtitle: { enkel: "Alla kostnader och inkomster visas här", avancerad: "Granska och bokför transaktioner." },
    allTransactions: { enkel: "Alla kostnader och inkomster", avancerad: "Alla transaktioner" },
    newTransaction: { enkel: "Ny betalning eller inkomst", avancerad: "Ny transaktion" },
    toRecord: { enkel: "Att sortera", avancerad: "Att bokföra" },
    recorded: { enkel: "Klara", avancerad: "Bokförda" },
    missingDoc: { enkel: "Saknar kvitto", avancerad: "Saknar underlag" },
    ignored: { enkel: "Hoppade över", avancerad: "Ignorerade" },
    all: { enkel: "Alla", avancerad: "Alla" },

    // Actions
    book: { enkel: "Sortera", avancerad: "Bokför" },
    bookAll: { enkel: "Sortera alla", avancerad: "Bokför alla" },
    bookSelected: { enkel: "Sortera valda", avancerad: "Bokför valda" },
    ignore: { enkel: "Hoppa över", avancerad: "Ignorera" },
    addReceipt: { enkel: "Lägg till kvitto", avancerad: "Lägg till underlag" },
    viewDetails: { enkel: "Visa detaljer", avancerad: "Visa detaljer" },

    // Table headers
    date: { enkel: "Datum", avancerad: "Datum" },
    description: { enkel: "Beskrivning", avancerad: "Beskrivning" },
    amount: { enkel: "Belopp", avancerad: "Belopp" },
    category: { enkel: "Typ", avancerad: "Kategori" },
    account: { enkel: "Konto", avancerad: "Bokföringskonto" },
    status: { enkel: "Status", avancerad: "Status" },

    // Status labels
    statusToRecord: { enkel: "Att sortera", avancerad: "Att bokföra" },
    statusRecorded: { enkel: "Klar", avancerad: "Bokförd" },
    statusMissingDoc: { enkel: "Saknar kvitto", avancerad: "Saknar underlag" },
    statusIgnored: { enkel: "Hoppad över", avancerad: "Ignorerad" },

    // Empty state
    empty: { enkel: "Inga kostnader eller inkomster ännu", avancerad: "Inga transaktioner" },
    emptyDesc: { enkel: "Ladda upp dina transaktioner så sköter vi resten.", avancerad: "Ladda upp dina transaktioner så sköter vi resten." },

    // Search
    search: { enkel: "Sök betalningar...", avancerad: "Sök transaktioner..." },
  },

  // ============================================================================
  // Invoices (Customer)
  // ============================================================================
  invoices: {
    title: { enkel: "Skicka fakturor", avancerad: "Kundfakturor" },
    subtitle: { enkel: "Fakturera kunder och få betalt snabbare.", avancerad: "Skapa, skicka och följ upp betalningar." },
    create: { enkel: "Skapa faktura", avancerad: "Ny faktura" },
    send: { enkel: "Skicka", avancerad: "Skicka" },
    sendReminder: { enkel: "Skicka påminnelse", avancerad: "Skicka betalningspåminnelse" },
    markPaid: { enkel: "Markera betald", avancerad: "Markera som betald" },

    // Table headers
    invoiceNumber: { enkel: "Fakturanr", avancerad: "Fakturanummer" },
    customer: { enkel: "Kund", avancerad: "Kund" },
    issueDate: { enkel: "Skickad", avancerad: "Fakturadatum" },
    dueDate: { enkel: "Betala senast", avancerad: "Förfallodatum" },
    amount: { enkel: "Belopp", avancerad: "Belopp" },
    status: { enkel: "Status", avancerad: "Status" },

    // Status
    statusPaid: { enkel: "Betald", avancerad: "Betald" },
    statusSent: { enkel: "Skickad", avancerad: "Skickad" },
    statusDraft: { enkel: "Utkast", avancerad: "Utkast" },
    statusOverdue: { enkel: "Sen", avancerad: "Förfallen" },
    statusCancelled: { enkel: "Borttagen", avancerad: "Makulerad" },

    // Stats
    outstanding: { enkel: "Väntar på betalning", avancerad: "Utestående" },
    overdue: { enkel: "Försenade", avancerad: "Förfallna" },
    paidThisMonth: { enkel: "Betalda denna månad", avancerad: "Betalda denna period" },

    // Empty
    empty: { enkel: "Inga fakturor ännu", avancerad: "Inga fakturor" },
    emptyDesc: { enkel: "Skapa din första faktura för att få betalt", avancerad: "Skapa fakturor för att fakturera kunder" },

    search: { enkel: "Sök fakturor...", avancerad: "Sök fakturor..." },

    // Bulk actions
    allInvoices: { enkel: "Alla fakturor", avancerad: "Alla fakturor" },
    invoices: { enkel: "fakturor", avancerad: "fakturor" },
    invoicesDeleted: { enkel: "Fakturor borttagna", avancerad: "Fakturor raderade" },
    invoicesDeletedDesc: { enkel: "fakturor har tagits bort", avancerad: "fakturor har raderats" },
    invoicesSent: { enkel: "Fakturor skickade", avancerad: "Fakturor skickade" },
    invoicesSentDesc: { enkel: "fakturor har skickats", avancerad: "fakturor har skickats" },
    preparingDownload: { enkel: "Förbereder", avancerad: "Förbereder" },
    invoiceDeleted: { enkel: "Faktura borttagen", avancerad: "Faktura raderad" },
    invoiceDeletedDesc: { enkel: "har tagits bort", avancerad: "har raderats" },
    reminderSent: { enkel: "Påminnelse skickad", avancerad: "Påminnelse skickad" },
    reminderSentDesc: { enkel: "Påminnelse har skickats till", avancerad: "Betalningspåminnelse har skickats till" },
    invoiceCreated: { enkel: "Faktura skapad!", avancerad: "Faktura skapad!" },
    invoiceCreatedDesc: { enkel: "Faktura till", avancerad: "Faktura till" },
    hasBeenCreated: { enkel: "har skapats", avancerad: "har skapats" },

    // Form
    createInvoice: { enkel: "Skapa ny faktura", avancerad: "Skapa ny faktura" },
    customerName: { enkel: "Kund", avancerad: "Kund" },
    enterCustomer: { enkel: "Ange kundnamn...", avancerad: "Ange kundnamn..." },
    customerRequired: { enkel: "Kundnamn behövs", avancerad: "Kundnamn krävs" },
    customerMinLength: { enkel: "Kundnamn måste vara minst 2 tecken", avancerad: "Kundnamn måste vara minst 2 tecken" },
    amountRequired: { enkel: "Belopp behövs", avancerad: "Belopp krävs" },
    amountPositive: { enkel: "Belopp måste vara mer än 0", avancerad: "Belopp måste vara större än 0" },
    amountTooLarge: { enkel: "Beloppet är för stort", avancerad: "Belopp är för stort" },
    requiredFields: { enkel: "* Måste fyllas i", avancerad: "* Obligatoriska fält" },
    creating: { enkel: "Skapar...", avancerad: "Skapar..." },

    // Details dialog
    details: { enkel: "Fakturadetaljer", avancerad: "Fakturadetaljer" },
    outgoingInvoices: { enkel: "Skickade fakturor", avancerad: "Utgående Fakturor" },
    lastUpdated: { enkel: "Senast uppdaterad:", avancerad: "Senaste uppdaterad:" },
  },

  // ============================================================================
  // Assets / Tillgångar
  // ============================================================================
  assets: {
    title: { enkel: "Tillgångar", avancerad: "Anläggningsregister" },
    subtitle: { enkel: "Datorer, möbler och andra saker du äger.", avancerad: "Inventarier och avskrivningar enligt plan." },
    addAsset: { enkel: "Lägg till", avancerad: "Lägg till inventarie" },
    newAsset: { enkel: "Ny tillgång", avancerad: "Ny inventarie" },
    newAssetDesc: { enkel: "Lägg till en ny tillgång.", avancerad: "Lägg till en ny tillgång i anläggningsregistret." },

    // Table headers
    name: { enkel: "Namn", avancerad: "Namn" },
    category: { enkel: "Typ", avancerad: "Kategori" },
    purchaseDate: { enkel: "Köpdatum", avancerad: "Inköpsdatum" },
    purchasePrice: { enkel: "Köppris", avancerad: "Anskaffningsvärde" },
    currentValue: { enkel: "Värde nu", avancerad: "Bokfört värde" },
    usefulLife: { enkel: "Livslängd", avancerad: "Livslängd" },

    // Stats
    totalAssets: { enkel: "Alla tillgångar", avancerad: "Totala tillgångar" },
    totalValue: { enkel: "Totalt värde", avancerad: "Totalt anskaffningsvärde" },
    currentTotalValue: { enkel: "Nuvarande värde", avancerad: "Bokfört värde" },
    depreciation: { enkel: "Värdeminskningar", avancerad: "Ackumulerade avskrivningar" },

    // Empty
    empty: { enkel: "Inga tillgångar", avancerad: "Inga tillgångar registrerade" },
  },

  // ============================================================================
  // Supplier Invoices
  // ============================================================================
  supplierInvoices: {
    title: { enkel: "Fakturor att betala", avancerad: "Leverantörsfakturor" },
    subtitle: { enkel: "Fakturor du fått från andra företag.", avancerad: "Godkänn, betala och håll koll på förfallodatum." },
    addInvoice: { enkel: "Lägg till", avancerad: "Lägg till faktura" },
    approve: { enkel: "Godkänn", avancerad: "Attestera" },
    pay: { enkel: "Betala", avancerad: "Betala" },
    reject: { enkel: "Avslå", avancerad: "Avvisa" },

    // Table headers
    supplier: { enkel: "Från", avancerad: "Leverantör" },
    invoiceNumber: { enkel: "Fakturanr", avancerad: "Fakturanummer" },
    invoiceDate: { enkel: "Datum", avancerad: "Fakturadatum" },
    dueDate: { enkel: "Betala senast", avancerad: "Förfallodatum" },
    amount: { enkel: "Belopp", avancerad: "Belopp" },
    ocr: { enkel: "Betalningsnummer", avancerad: "OCR-nummer" },
    status: { enkel: "Status", avancerad: "Status" },

    // Status
    statusReceived: { enkel: "Ny", avancerad: "Mottagen" },
    statusApproved: { enkel: "Godkänd", avancerad: "Attesterad" },
    statusPaid: { enkel: "Betald", avancerad: "Betald" },
    statusOverdue: { enkel: "Försenad", avancerad: "Förfallen" },
    statusDispute: { enkel: "Problem", avancerad: "Tvist" },

    // Stats
    unpaid: { enkel: "Obetalda", avancerad: "Obetalda fakturor" },
    toApprove: { enkel: "Att godkänna", avancerad: "Att attestera" },
    overdueAmount: { enkel: "Försenade", avancerad: "Förfallna" },
    aiMatched: { enkel: "AI-matchade", avancerad: "AI-matchade" },
    ofReceived: { enkel: "av mottagna", avancerad: "av mottagna" },
    invoices: { enkel: "fakturor", avancerad: "fakturor" },

    empty: { enkel: "Inga fakturor att betala", avancerad: "Inga leverantörsfakturor" },
    search: { enkel: "Sök fakturor...", avancerad: "Sök leverantörsfakturor..." },

    viewInvoice: { enkel: "Visa faktura", avancerad: "Visa faktura" },
    markAsPaid: { enkel: "Betald", avancerad: "Markera betald" },
    downloadPdf: { enkel: "Ladda ner", avancerad: "Ladda ner PDF" },
    setStatus: { enkel: "Ändra status", avancerad: "Sätt status" },
  },

  // ============================================================================
  // Receipts / Underlag
  // ============================================================================
  receipts: {
    title: { enkel: "Kvitton", avancerad: "Underlag" },
    subtitle: { enkel: "Spara kvitton så du har koll på inköpen.", avancerad: "Ladda upp och matcha med transaktioner." },
    upload: { enkel: "Ladda upp kvitto", avancerad: "Ladda upp underlag" },
    scan: { enkel: "Fotografera kvitto", avancerad: "Skanna underlag" },
    match: { enkel: "Koppla till betalning", avancerad: "Matcha med transaktion" },

    // Table headers
    supplier: { enkel: "Butik/Företag", avancerad: "Leverantör" },
    date: { enkel: "Datum", avancerad: "Datum" },
    amount: { enkel: "Belopp", avancerad: "Belopp" },
    category: { enkel: "Typ", avancerad: "Kategori" },
    status: { enkel: "Status", avancerad: "Status" },

    // Status
    statusVerified: { enkel: "Klar", avancerad: "Verifierad" },
    statusPending: { enkel: "Väntar", avancerad: "Väntar" },
    statusProcessing: { enkel: "Läser in...", avancerad: "Bearbetar" },
    statusNeedsReview: { enkel: "Kolla över", avancerad: "Granskning krävs" },
    statusProcessed: { enkel: "Klar", avancerad: "Behandlad" },
    statusRejected: { enkel: "Nekad", avancerad: "Avvisad" },

    // Stats
    unmatched: { enkel: "Ej kopplade", avancerad: "Omatchade" },
    matched: { enkel: "Kopplade", avancerad: "Matchade" },

    empty: { enkel: "Inga kvitton ännu", avancerad: "Inga underlag" },
    emptyDesc: { enkel: "Ladda upp kvitton för att spara dem", avancerad: "Underlag visas här när de laddas upp" },
    search: { enkel: "Sök kvitton...", avancerad: "Sök underlag..." },

    // Bulk actions
    receipts: { enkel: "kvitton", avancerad: "underlag" },
    allReceipts: { enkel: "Alla kvitton", avancerad: "Alla underlag" },
    receiptsDeleted: { enkel: "Kvitton borttagna", avancerad: "Underlag raderade" },
    receiptsDeletedDesc: { enkel: "kvitton har tagits bort", avancerad: "underlag har raderats" },
    receiptsArchived: { enkel: "Kvitton arkiverade", avancerad: "Underlag arkiverade" },
    receiptsArchivedDesc: { enkel: "kvitton har arkiverats", avancerad: "underlag har arkiverats" },
    preparingDownload: { enkel: "Förbereder", avancerad: "Förbereder" },
    receiptDeleted: { enkel: "Kvitto borttaget", avancerad: "Underlag raderat" },
    totalReceipts: { enkel: "Alla kvitton", avancerad: "Totalt underlag" },
    matchedReceipts: { enkel: "Kopplade", avancerad: "Matchade" },
    unmatchedReceipts: { enkel: "Ej kopplade", avancerad: "Omatchade" },
    totalAmount: { enkel: "Totalt belopp", avancerad: "Total summa" },
    linkedToTransaction: { enkel: "Kopplade till betalning", avancerad: "Kopplade till transaktion" },
    notLinked: { enkel: "Ej kopplade", avancerad: "Ej kopplade" },
    uploadReceipt: { enkel: "Ladda upp kvitto", avancerad: "Ladda upp underlag" },
    details: { enkel: "Kvittoinfo", avancerad: "Underlagsdetaljer" },
    linkedTransaction: { enkel: "Kopplad betalning", avancerad: "Kopplad transaktion" },
    notLinkedYet: { enkel: "Ej kopplad ännu", avancerad: "Ej kopplad" },
    hasAttachment: { enkel: "Bilaga", avancerad: "Bilaga" },
  },

  // ============================================================================
  // Reports
  // ============================================================================
  reports: {
    title: { enkel: "Rapporter", avancerad: "Rapporter" },
    vatReport: { enkel: "Momsdeklaration", avancerad: "Momsdeklaration" },
    incomeReport: { enkel: "Inkomstdeklaration", avancerad: "Inkomstdeklaration" },
    annualReport: { enkel: "Årsredovisning", avancerad: "Årsredovisning" },
    yearEnd: { enkel: "Årsbokslut", avancerad: "Årsbokslut" },
    profitLoss: { enkel: "Resultaträkning", avancerad: "Resultaträkning" },
    balanceSheet: { enkel: "Balansräkning", avancerad: "Balansräkning" },

    generate: { enkel: "Skapa rapport", avancerad: "Generera" },
    download: { enkel: "Ladda ner", avancerad: "Ladda ner" },
    submit: { enkel: "Skicka in", avancerad: "Skicka till Skatteverket" },

    // Momsdeklaration
    nextDeclaration: { enkel: "Nästa momsrapport", avancerad: "Nästa deklaration" },
    vatToPay: { enkel: "Moms att betala", avancerad: "Moms att betala" },
    inputVat: { enkel: "Moms att få tillbaka", avancerad: "Ingående moms" },
    salesVat: { enkel: "Moms på försäljning", avancerad: "Utgående moms" },
    deductible: { enkel: "Får dras av", avancerad: "Avdragsgill" },
    vatPeriods: { enkel: "Momsperioder", avancerad: "Momsperioder" },
    aiVatReport: { enkel: "AI-momsrapport", avancerad: "AI-momsdeklaration" },
    aiVatDesc: { enkel: "Beräknas automatiskt från din bokföring.", avancerad: "Beräknas automatiskt från bokföringens momskonton (2610, 2640)." },

    // Årsbokslut
    fiscalYear: { enkel: "Räkenskapsår", avancerad: "Räkenskapsår" },
    companyType: { enkel: "Typ av företag", avancerad: "Bolagsform" },
    reportStatus: { enkel: "Status", avancerad: "Status" },
    workInProgress: { enkel: "Under arbete", avancerad: "Under arbete" },
    simplified: { enkel: "Förenklat bokslut", avancerad: "Förenklat årsbokslut" },
    aiYearEnd: { enkel: "AI-bokslut", avancerad: "AI-årsbokslut" },
    aiYearEndDesc: { enkel: "Skapas automatiskt från din bokföring.", avancerad: "Genereras automatiskt från bokföringen enligt BFL." },
    deadline: { enkel: "Deadline", avancerad: "Deadline" },

    // DataTable titles
    profitLossSimplified: { enkel: "Resultaträkning (förenklad)", avancerad: "Resultaträkning (förenklad)" },
    balanceSheetSimplified: { enkel: "Balansräkning (förenklad)", avancerad: "Balansräkning (förenklad)" },
    tablePost: { enkel: "Post", avancerad: "Post" },
    tableAmount: { enkel: "Belopp", avancerad: "Belopp" },
  },

  // ============================================================================
  // Payroll / Löner
  // ============================================================================
  payroll: {
    title: { enkel: "Löner", avancerad: "Löner" },
    payslip: { enkel: "Lönebesked", avancerad: "Lönebesked" },
    agi: { enkel: "Arbetsgivarinfo", avancerad: "AGI" },
    dividend: { enkel: "Utdelning", avancerad: "Utdelning" },
    selfEmploymentTax: { enkel: "Egenavgifter", avancerad: "Egenavgifter" },
    ownerWithdrawal: { enkel: "Delägaruttag", avancerad: "Delägaruttag" },

    createPayslip: { enkel: "Skapa lönebesked", avancerad: "Skapa lönebesked" },
    grossSalary: { enkel: "Lön före skatt", avancerad: "Bruttolön" },
    netSalary: { enkel: "Lön efter skatt", avancerad: "Nettolön" },
    tax: { enkel: "Skatt", avancerad: "Preliminärskatt" },
    employerFees: { enkel: "Arbetsgivaravgifter", avancerad: "Arbetsgivaravgifter" },

    // Utdelning
    dividendAmount: { enkel: "Utdelningsbelopp", avancerad: "Utdelningsbelopp" },
    dividendPerShare: { enkel: "Per aktie", avancerad: "Per aktie" },
    eligibleAmount: { enkel: "Tillåtet belopp", avancerad: "Tillåtet belopp" },
    taxRate: { enkel: "Skattesats", avancerad: "Skattesats" },
    dividendYear: { enkel: "År", avancerad: "Beskattningsår" },
    remainingAllowance: { enkel: "Kvar att dela ut", avancerad: "Resterande utrymme" },
    registerDividend: { enkel: "Registrera utdelning", avancerad: "Registrera utdelning" },
    calculateDividend: { enkel: "Beräkna utdelning", avancerad: "Beräkna utdelning" },
    aiDividend: { enkel: "AI-utdelningsguide", avancerad: "AI-utdelningsberäkning" },
    aiDividendDesc: { enkel: "Beräkna optimal utdelning automatiskt.", avancerad: "Beräkna optimal utdelning baserat på gränsbelopp och 3:12-regler." },
    dividendHistory: { enkel: "Utdelningshistorik", avancerad: "Utdelningshistorik" },

    // AGI
    agiReport: { enkel: "Arbetsgivarinfo", avancerad: "Arbetsgivardeklaration" },
    employeeCount: { enkel: "Antal anställda", avancerad: "Antal anställda" },
    totalSalaries: { enkel: "Totala löner", avancerad: "Totalt utbetalda löner" },
    totalTaxes: { enkel: "Total skatt", avancerad: "Totalt inbetald skatt" },
    totalFees: { enkel: "Avgifter", avancerad: "Arbetsgivaravgifter" },

    // Lonebesked
    payslips: { enkel: "Lönebesked", avancerad: "Lönebesked" },
    employee: { enkel: "Anställd", avancerad: "Anställd" },
    paymentDate: { enkel: "Utbetalningsdag", avancerad: "Utbetalningsdatum" },
    period: { enkel: "Period", avancerad: "Löneperiod" },
  },

  // ============================================================================
  // Owners / Ägare
  // ============================================================================
  owners: {
    title: { enkel: "Ägarinfo", avancerad: "Ägare & Styrning" },
    shareRegister: { enkel: "Aktiebok", avancerad: "Aktiebok" },
    shareholders: { enkel: "Ägare", avancerad: "Delägare" },
    memberRegister: { enkel: "Medlemmar", avancerad: "Medlemsregister" },
    boardMinutes: { enkel: "Styrelseanteckningar", avancerad: "Styrelseprotokoll" },
    agm: { enkel: "Årsmöte (AB)", avancerad: "Bolagsstämma" },
    annualMeeting: { enkel: "Årsmöte", avancerad: "Årsmöte" },

    // Aktiebok
    totalShares: { enkel: "Alla aktier", avancerad: "Totalt antal aktier" },
    totalVotes: { enkel: "Röster", avancerad: "Totalt antal röster" },
    shareValue: { enkel: "Värde", avancerad: "Aktiekapital" },
    shareholderCount: { enkel: "Antal ägare", avancerad: "Antal delägare" },
    ownershipShare: { enkel: "Ägarandel", avancerad: "Ägarandel" },
    shares: { enkel: "Aktier", avancerad: "Aktier" },
    votes: { enkel: "Röster", avancerad: "Röster" },
    acquisitionDate: { enkel: "Köpdatum", avancerad: "Anskaffningsdatum" },
    acquisitionPrice: { enkel: "Köppris", avancerad: "Anskaffningsvärde" },
    transactions: { enkel: "Händelser", avancerad: "Transaktioner" },
    newIssue: { enkel: "Nyemission", avancerad: "Nyemission" },
    transfer: { enkel: "Överlåtelse", avancerad: "Överlåtelse" },
    addTransaction: { enkel: "Lägg till", avancerad: "Ny transaktion" },
    generateShareCert: { enkel: "Skapa aktiebrev", avancerad: "Generera aktiebrev" },
    shareholdersTable: { enkel: "Ägare", avancerad: "Aktieägare" },
    transactionsTable: { enkel: "Händelser", avancerad: "Aktietransaktioner" },
    searchOwners: { enkel: "Sök ägare...", avancerad: "Sök ägare..." },
    searchTransactions: { enkel: "Sök händelse...", avancerad: "Sök transaktion..." },

    // Delagare
    shareholderName: { enkel: "Namn", avancerad: "Namn" },
    personalId: { enkel: "Personnummer", avancerad: "Personnummer" },
    orgNumber: { enkel: "Orgnummer", avancerad: "Organisationsnummer" },
    address: { enkel: "Adress", avancerad: "Adress" },

    // Delagaruttag
    withdrawal: { enkel: "Uttag", avancerad: "Delägaruttag" },
    withdrawalAmount: { enkel: "Belopp", avancerad: "Uttagsbelopp" },
    withdrawalDate: { enkel: "Datum", avancerad: "Utttagsdatum" },

    // Egenavgifter
    selfEmploymentTotal: { enkel: "Avgifter totalt", avancerad: "Egenavgifter totalt" },
    pensionFee: { enkel: "Pensionsavgift", avancerad: "Pensionsavgift" },
    healthFee: { enkel: "Sjukförsäkring", avancerad: "Sjukförsäkringsavgift" },
    parentFee: { enkel: "Föräldraförsäkring", avancerad: "Föräldraförsäkringsavgift" },
  },

  // ============================================================================
  // AI / Suggestions
  // ============================================================================
  ai: {
    suggestion: { enkel: "Förslag", avancerad: "AI-förslag" },
    suggestions: { enkel: "förslag", avancerad: "AI-förslag" },
    confidence: { enkel: "Säkerhet", avancerad: "Konfidens" },
    approve: { enkel: "Godkänn", avancerad: "Acceptera förslag" },
    approveAll: { enkel: "Godkänn alla", avancerad: "Acceptera alla förslag" },
    reject: { enkel: "Nej tack", avancerad: "Avvisa" },
    edit: { enkel: "Ändra", avancerad: "Redigera förslag" },
    categorizedAs: { enkel: "Verkar vara", avancerad: "Kategoriserad som" },
    suggestedAccount: { enkel: "Föreslagen typ", avancerad: "Föreslaget konto" },
    reason: { enkel: "Varför?", avancerad: "Motivering" },
    categorization: { enkel: "AI-förslag", avancerad: "AI-kategorisering" },
  },

  // ============================================================================
  // Bookkeeping Terms
  // ============================================================================
  bookkeeping: {
    debit: { enkel: "In på kontot", avancerad: "Debet" },
    credit: { enkel: "Ut från kontot", avancerad: "Kredit" },
    journal: { enkel: "Alla händelser", avancerad: "Dagbok" },
    ledger: { enkel: "Huvudbok", avancerad: "Huvudbok" },
    verification: { enkel: "Verifikation", avancerad: "Verifikation" },
    verifications: { enkel: "Verifikationer", avancerad: "Verifikationer" },
    fiscalYear: { enkel: "Räkenskapsår", avancerad: "Räkenskapsår" },
    assets: { enkel: "Det du äger", avancerad: "Tillgångar" },
    liabilities: { enkel: "Det du är skyldig", avancerad: "Skulder" },
    equity: { enkel: "Eget kapital", avancerad: "Eget kapital" },
    revenue: { enkel: "Intäkter", avancerad: "Intäkter" },
    expenses: { enkel: "Kostnader", avancerad: "Kostnader" },
    profit: { enkel: "Det du tjänat", avancerad: "Resultat" },
    loss: { enkel: "Förlust", avancerad: "Förlust" },
    balance: { enkel: "Pengar kvar", avancerad: "Saldo" },
    vat: { enkel: "Moms", avancerad: "Mervärdesskatt" },
    vatIn: { enkel: "Moms du betalat", avancerad: "Ingående moms" },
    vatOut: { enkel: "Moms du fått in", avancerad: "Utgående moms" },
    vatToPay: { enkel: "Moms att betala", avancerad: "Moms att betala" },
  },

  // ============================================================================
  // Common Actions
  // ============================================================================
  actions: {
    save: { enkel: "Spara", avancerad: "Spara" },
    cancel: { enkel: "Avbryt", avancerad: "Avbryt" },
    delete: { enkel: "Ta bort", avancerad: "Radera" },
    edit: { enkel: "Ändra", avancerad: "Redigera" },
    view: { enkel: "Visa", avancerad: "Visa" },
    download: { enkel: "Ladda ner", avancerad: "Ladda ner" },
    upload: { enkel: "Ladda upp", avancerad: "Ladda upp" },
    search: { enkel: "Sök", avancerad: "Sök" },
    filter: { enkel: "Filtrera", avancerad: "Filter" },
    sort: { enkel: "Sortera", avancerad: "Sortera" },
    refresh: { enkel: "Uppdatera", avancerad: "Uppdatera" },
    close: { enkel: "Stäng", avancerad: "Stäng" },
    back: { enkel: "Tillbaka", avancerad: "Tillbaka" },
    next: { enkel: "Nästa", avancerad: "Nästa" },
    previous: { enkel: "Föregående", avancerad: "Föregående" },
    confirm: { enkel: "Bekräfta", avancerad: "Bekräfta" },
    create: { enkel: "Skapa", avancerad: "Skapa" },
    add: { enkel: "Lägg till", avancerad: "Lägg till" },
    remove: { enkel: "Ta bort", avancerad: "Ta bort" },
    select: { enkel: "Välj", avancerad: "Välj" },
    selectAll: { enkel: "Välj alla", avancerad: "Markera alla" },
    deselectAll: { enkel: "Avmarkera alla", avancerad: "Avmarkera alla" },
    export: { enkel: "Exportera", avancerad: "Exportera" },
    import: { enkel: "Importera", avancerad: "Importera" },
    print: { enkel: "Skriv ut", avancerad: "Skriv ut" },
    copy: { enkel: "Kopiera", avancerad: "Kopiera" },
    duplicate: { enkel: "Kopiera", avancerad: "Duplicera" },
    archive: { enkel: "Arkivera", avancerad: "Arkivera" },
    restore: { enkel: "Återställ", avancerad: "Återställ" },
    openMenu: { enkel: "Öppna meny", avancerad: "Öppna meny" },
    viewDetails: { enkel: "Visa mer", avancerad: "Visa detaljer" },
    new: { enkel: "Ny", avancerad: "Ny" },
    clearFilter: { enkel: "Ta bort filter", avancerad: "Rensa filter" },
    send: { enkel: "Skicka", avancerad: "Skicka" },
    downloading: { enkel: "Laddar ner...", avancerad: "Laddar ner..." },
  },

  // ============================================================================
  // Common Labels
  // ============================================================================
  labels: {
    name: { enkel: "Namn", avancerad: "Namn" },
    email: { enkel: "E-post", avancerad: "E-post" },
    phone: { enkel: "Telefon", avancerad: "Telefon" },
    address: { enkel: "Adress", avancerad: "Adress" },
    date: { enkel: "Datum", avancerad: "Datum" },
    time: { enkel: "Tid", avancerad: "Tid" },
    amount: { enkel: "Belopp", avancerad: "Belopp" },
    total: { enkel: "Totalt", avancerad: "Totalt" },
    subtotal: { enkel: "Delsumma", avancerad: "Delsumma" },
    description: { enkel: "Beskrivning", avancerad: "Beskrivning" },
    notes: { enkel: "Anteckningar", avancerad: "Anteckningar" },
    comment: { enkel: "Kommentar", avancerad: "Kommentar" },
    type: { enkel: "Typ", avancerad: "Typ" },
    category: { enkel: "Typ", avancerad: "Kategori" },
    status: { enkel: "Status", avancerad: "Status" },
    reference: { enkel: "Referens", avancerad: "Referens" },
    attachment: { enkel: "Bilaga", avancerad: "Bilaga" },
    attachments: { enkel: "Bilagor", avancerad: "Bilagor" },
    lastUpdated: { enkel: "Senast uppdaterad", avancerad: "Senast uppdaterad" },
    createdAt: { enkel: "Skapad", avancerad: "Skapad" },
    company: { enkel: "Företag", avancerad: "Företag" },
    orgNumber: { enkel: "Orgnummer", avancerad: "Organisationsnummer" },
    filterByStatus: { enkel: "Filtrera på status", avancerad: "Filtrera på status" },
    sortBy: { enkel: "Sortera", avancerad: "Sortera efter" },
    actions: { enkel: "Åtgärder", avancerad: "Åtgärder" },
    supplier: { enkel: "Från", avancerad: "Leverantör" },
    account: { enkel: "Konto", avancerad: "Konto" },
  },

  // ============================================================================
  // Stats / Dashboard
  // ============================================================================
  stats: {
    toRecord: { enkel: "Att sortera", avancerad: "Att bokföra" },
    recorded: { enkel: "Klara", avancerad: "Bokförda" },
    thisMonth: { enkel: "Denna månad", avancerad: "Denna period" },
    thisYear: { enkel: "I år", avancerad: "Innevarande år" },
    thisPeriod: { enkel: "Denna period", avancerad: "Denna period" },
    income: { enkel: "Pengar in", avancerad: "Intäkter" },
    expenses: { enkel: "Pengar ut", avancerad: "Kostnader" },
    profit: { enkel: "Vinst", avancerad: "Resultat" },
    balance: { enkel: "På kontot", avancerad: "Saldo" },
    unpaidInvoices: { enkel: "Obetalda fakturor", avancerad: "Utestående fakturor" },
    overdueInvoices: { enkel: "Försenade fakturor", avancerad: "Förfallna fakturor" },
    vatToPay: { enkel: "Moms att betala", avancerad: "Utgående moms" },
    vatToReceive: { enkel: "Moms att få tillbaka", avancerad: "Ingående moms" },
    totalTransactions: { enkel: "Antal betalningar", avancerad: "Totalt transaktioner" },
    totalInvoices: { enkel: "Antal fakturor", avancerad: "Totalt fakturor" },
    totalReceipts: { enkel: "Antal kvitton", avancerad: "Totalt kvitton" },
    pendingReview: { enkel: "Att granska", avancerad: "Väntar på granskning" },
    outstanding: { enkel: "Obetalda", avancerad: "Utestående" },
    overdue: { enkel: "Försenade", avancerad: "Förfallna" },
    paid: { enkel: "Betalda", avancerad: "Betalt" },
    toPay: { enkel: "Att betala", avancerad: "Att betala" },
    needsAttention: { enkel: "Behöver åtgärdas", avancerad: "Kräver uppmärksamhet" },
    approved: { enkel: "Godkända", avancerad: "Attesterade" },
  },

  // ============================================================================
  // Settings
  // ============================================================================
  settings: {
    title: { enkel: "Inställningar", avancerad: "Inställningar" },
    account: { enkel: "Mitt konto", avancerad: "Konto" },
    company: { enkel: "Företaget", avancerad: "Företagsinformation" },
    integrations: { enkel: "Kopplingar", avancerad: "Integrationer" },
    billing: { enkel: "Betalning", avancerad: "Fakturering" },
    notifications: { enkel: "Aviseringar", avancerad: "Notiser" },
    appearance: { enkel: "Utseende", avancerad: "Utseende" },
    language: { enkel: "Språk", avancerad: "Språk & region" },
    accessibility: { enkel: "Tillgänglighet", avancerad: "Tillgänglighet" },
    security: { enkel: "Säkerhet", avancerad: "Säkerhet & sekretess" },

    modeTitle: { enkel: "Hur vill du använda appen?", avancerad: "Läge" },
    modeEasy: { enkel: "Enkel", avancerad: "Enkel" },
    modeAdvanced: { enkel: "Avancerad", avancerad: "Avancerad" },
    modeEasyDesc: { enkel: "Enkla ord och förklaringar", avancerad: "Grundläggande funktioner" },
    modeAdvancedDesc: { enkel: "Bokföringstermer", avancerad: "Alla funktioner" },

    // Company Tab
    companyInfo: { enkel: "Företaget", avancerad: "Företagsinformation" },
    companyInfoDesc: { enkel: "Uppdatera ditt företags uppgifter.", avancerad: "Uppdatera ditt företags uppgifter och inställningar." },
    companyType: { enkel: "Typ av företag", avancerad: "Företagsform" },
    companyTypeDesc: { enkel: "Välj typ för rätt funktioner.", avancerad: "Välj din företagsform för att anpassa funktioner och rapporter." },
    dataExport: { enkel: "Data & Export", avancerad: "Data & Export" },
    dataExportDesc: { enkel: "Ladda ner din bokföring.", avancerad: "Hantera din företagsdata och exportera vid behov." },
    exportSIE: { enkel: "Ladda ner", avancerad: "Exportera SIE" },

    // Integrations Tab
    integrationsSettings: { enkel: "Kopplingar", avancerad: "Integrationer" },
    integrationsDesc: { enkel: "Anslut andra tjänster.", avancerad: "Anslut externa tjänster och verktyg." },

    // Email Tab
    emailSettings: { enkel: "E-post", avancerad: "E-postinställningar" },
    emailDesc: { enkel: "Hur e-post skickas.", avancerad: "Hantera hur e-post skickas från systemet." },
    senderName: { enkel: "Avsändarnamn", avancerad: "Avsändarnamn" },
    replyAddress: { enkel: "Svarsadress", avancerad: "Svarsadress" },
    textModeSection: { enkel: "Textläge", avancerad: "Textläge" },
    textModeDesc: { enkel: "Hur ord visas i appen.", avancerad: "Välj hur terminologin visas i appen." },

    // Account Tab
    accountSettings: { enkel: "Kontoinställningar", avancerad: "Kontoinställningar" },
    accountDesc: { enkel: "Hantera ditt konto och profil.", avancerad: "Hantera ditt konto och profil." },
    profilePicture: { enkel: "Profilbild", avancerad: "Profilbild" },
    changePicture: { enkel: "Ändra bild", avancerad: "Ändra bild" },
    pictureHint: { enkel: "JPG, PNG eller GIF. Max 2MB.", avancerad: "JPG, PNG eller GIF. Max 2MB." },

    // Billing Tab
    billingSettings: { enkel: "Betalning", avancerad: "Fakturering" },
    billingDesc: { enkel: "Hantera din prenumeration.", avancerad: "Hantera din prenumeration och betalningsmetoder." },
    currentPlan: { enkel: "Din plan", avancerad: "Nuvarande plan" },
    paymentMethod: { enkel: "Betalning", avancerad: "Betalningsmetod" },
    billingHistory: { enkel: "Betalningshistorik", avancerad: "Faktureringshistorik" },
    expires: { enkel: "Utgår", avancerad: "Utgår" },
    active: { enkel: "Aktiv", avancerad: "Aktiv" },
    changePlan: { enkel: "Byt plan", avancerad: "Uppgradera" },

    // Notifications Tab
    notificationsSettings: { enkel: "Notiser", avancerad: "Notiser" },
    notificationsDesc: { enkel: "Anpassa hur och när du får notiser.", avancerad: "Anpassa hur och när du får notiser." },
    emailNotifications: { enkel: "E-postnotiser", avancerad: "E-postnotiser" },
    pushNotifications: { enkel: "Notiser", avancerad: "Push-notiser" },
    newInvoices: { enkel: "Nya fakturor", avancerad: "Nya fakturor" },
    newInvoicesDesc: { enkel: "När du får en ny faktura", avancerad: "När du får en ny faktura" },
    paymentReminders: { enkel: "Betalningspåminnelser", avancerad: "Betalningspåminnelser" },
    paymentRemindersDesc: { enkel: "Påminnelser om förfallna betalningar", avancerad: "Påminnelser om förfallna betalningar" },
    monthlyReports: { enkel: "Månadsrapporter", avancerad: "Månadsrapporter" },
    monthlyReportsDesc: { enkel: "Sammanfattning av månadens ekonomi", avancerad: "Sammanfattning av månadens ekonomi" },
    importantDates: { enkel: "Viktiga datum", avancerad: "Viktiga datum" },
    importantDatesDesc: { enkel: "Påminnelser om moms m.m.", avancerad: "Påminnelser om momsdeklaration m.m." },
    mobileNotifications: { enkel: "Mobilnotiser", avancerad: "Mobilnotiser" },
    mobileNotificationsDesc: { enkel: "Få notiser på din mobil", avancerad: "Få notiser på din mobil" },

    // Appearance Tab
    appearanceSettings: { enkel: "Utseende", avancerad: "Utseende" },
    appearanceDesc: { enkel: "Anpassa hur appen ser ut.", avancerad: "Anpassa hur appen ser ut." },
    theme: { enkel: "Utseende", avancerad: "Tema" },
    themeLight: { enkel: "Ljust", avancerad: "Ljust" },
    themeDark: { enkel: "Mörkt", avancerad: "Mörkt" },
    themeSystem: { enkel: "Automatiskt", avancerad: "System" },
    density: { enkel: "Storlek", avancerad: "Täthet" },
    densityCompact: { enkel: "Kompakt", avancerad: "Kompakt" },
    densityNormal: { enkel: "Normal", avancerad: "Normal" },
    densityComfortable: { enkel: "Bekväm", avancerad: "Bekväm" },
    sidebar: { enkel: "Sidomeny", avancerad: "Sidopanel" },
    compactSidebar: { enkel: "Komprimerad sidomeny", avancerad: "Komprimerad sidopanel" },
    compactSidebarDesc: { enkel: "Visa endast ikoner", avancerad: "Visa endast ikoner i sidopanelen" },

    // Language Tab
    languageSettings: { enkel: "Språk", avancerad: "Språk & region" },
    languageDesc: { enkel: "Anpassa språk och format.", avancerad: "Anpassa språk, valuta och datumformat." },
    selectLanguage: { enkel: "Välj språk", avancerad: "Välj språk" },
    selectCurrency: { enkel: "Välj valuta", avancerad: "Välj valuta" },
    selectDateFormat: { enkel: "Välj datumformat", avancerad: "Välj datumformat" },
    selectFirstDay: { enkel: "Välj första dag", avancerad: "Välj första dag" },
    sender: { enkel: "Avsändare", avancerad: "Avsändare" },
    emailSignature: { enkel: "Signatur", avancerad: "E-postsignatur" },
    signaturePlaceholder: { enkel: "Med vänliga hälsningar,\nMitt Företag AB", avancerad: "Med vänliga hälsningar,\nMitt Företag AB" },

    // Accessibility Tab
    accessibilitySettings: { enkel: "Tillgänglighet", avancerad: "Tillgänglighet" },
    accessibilityDesc: { enkel: "Anpassa genvägar och hjälpmedel.", avancerad: "Anpassa tangentbordsgenvägar och hjälpmedel." },
    shortcuts: { enkel: "Genvägar", avancerad: "Tangentbordsgenvägar" },
    shortcutSearch: { enkel: "Öppna sök", avancerad: "Öppna sök" },
    shortcutNewInvoice: { enkel: "Ny faktura", avancerad: "Ny faktura" },
    shortcutSettings: { enkel: "Inställningar", avancerad: "Inställningar" },
    shortcutOverview: { enkel: "Gå till översikt", avancerad: "Gå till översikt" },
    helpers: { enkel: "Hjälpmedel", avancerad: "Hjälpmedel" },
    reduceMotion: { enkel: "Mindre rörelse", avancerad: "Reducera rörelse" },
    reduceMotionDesc: { enkel: "Minska animationer", avancerad: "Minska animationer i gränssnittet" },
    highContrast: { enkel: "Hög kontrast", avancerad: "Högkontrastläge" },
    highContrastDesc: { enkel: "Bättre läsbarhet", avancerad: "Öka kontrasten för bättre läsbarhet" },

    // Security Tab
    securitySettings: { enkel: "Säkerhet", avancerad: "Säkerhet & sekretess" },
    securityDesc: { enkel: "Hantera dina säkerhetsinställningar.", avancerad: "Hantera dina säkerhetsinställningar." },
    twoFactor: { enkel: "Extra säkerhet", avancerad: "Tvåfaktorsautentisering" },
    twoFactorEnabled: { enkel: "2FA är aktiverat", avancerad: "2FA är aktiverat" },
    twoFactorDesc: { enkel: "Extra skydd aktiverat", avancerad: "Autentiseringsapp kopplad" },
    activeSessions: { enkel: "Inloggningar", avancerad: "Aktiva sessioner" },
    privacy: { enkel: "Sekretess", avancerad: "Sekretess" },
    analyticsData: { enkel: "Analysdata", avancerad: "Analysdata" },
    analyticsDataDesc: { enkel: "Hjälp oss förbättra appen", avancerad: "Hjälp oss förbättra genom att dela anonym användningsdata" },
    marketing: { enkel: "Marknadsföringsmeddelanden", avancerad: "Marknadsföringsmeddelanden" },
    marketingDesc: { enkel: "Få tips via e-post", avancerad: "Ta emot tips och uppdateringar via e-post" },
    manage: { enkel: "Hantera", avancerad: "Hantera" },
  },

  // ============================================================================
  // Errors & Empty States
  // ============================================================================
  errors: {
    generic: { enkel: "Något gick fel", avancerad: "Ett fel uppstod" },
    notFound: { enkel: "Hittades inte", avancerad: "Resursen kunde inte hittas" },
    unauthorized: { enkel: "Du har inte tillgång", avancerad: "Ej behörig" },
    validation: { enkel: "Kontrollera uppgifterna", avancerad: "Valideringsfel" },
    network: { enkel: "Ingen internetanslutning", avancerad: "Nätverksfel" },
    tryAgain: { enkel: "Försök igen", avancerad: "Försök igen" },
    noMatchingInvoices: { enkel: "Inga fakturor hittades", avancerad: "Inga fakturor matchar din sökning" },
    noMatchingReceipts: { enkel: "Inga kvitton hittades", avancerad: "Inga kvitton matchar din sökning" },
    noMatchingTransactions: { enkel: "Inga betalningar hittades", avancerad: "Inga transaktioner matchar din sökning" },
  },

  // ============================================================================
  // Confirmations
  // ============================================================================
  confirm: {
    delete: { enkel: "Vill du ta bort detta?", avancerad: "Bekräfta borttagning" },
    deleteDesc: { enkel: "Det går inte att ångra", avancerad: "Denna åtgärd kan inte ångras" },
    unsavedChanges: { enkel: "Du har osparade ändringar", avancerad: "Osparade ändringar" },
    unsavedChangesDesc: { enkel: "Vill du lämna utan att spara?", avancerad: "Ändringar kommer att förloras" },
    yes: { enkel: "Ja", avancerad: "Ja" },
    no: { enkel: "Nej", avancerad: "Nej" },
    areYouSure: { enkel: "Är du säker?", avancerad: "Är du säker?" },
    cannotUndo: { enkel: "Det går inte att ångra detta", avancerad: "Denna åtgärd kan inte ångras. Objektet kommer att raderas permanent." },
  },

  // ============================================================================
  // Tax Planning: Periodiseringsfonder
  // ============================================================================
  periodiseringsfonder: {
    title: { enkel: "Periodiseringsfonder", avancerad: "Periodiseringsfonder" },
    description: { enkel: "Spara pengar och skjut upp skatten", avancerad: "Hantera skattemässiga avsättningar (max 25%, återför inom 6 år)" },
    activeFonder: { enkel: "Aktiva fonder", avancerad: "Aktiva fonder" },
    totalReserved: { enkel: "Totalt sparat", avancerad: "Totalt avsatt" },
    deferredTax: { enkel: "Sparad skatt", avancerad: "Uppskjuten skatt" },
    expiresWithin: { enkel: "Löper ut snart", avancerad: "Löper ut inom 12 mån" },
    createFond: { enkel: "Skapa fond", avancerad: "Skapa fond" },
    dissolveFond: { enkel: "Återför fond", avancerad: "Återför fond" },
    taxYear: { enkel: "År", avancerad: "Beskattningsår" },
    amount: { enkel: "Belopp", avancerad: "Belopp" },
    dissolved: { enkel: "Återfört", avancerad: "Återfört" },
    remaining: { enkel: "Kvar", avancerad: "Kvarvarande" },
    expiresAt: { enkel: "Löper ut", avancerad: "Löper ut" },
    status: { enkel: "Status", avancerad: "Status" },
    statusActive: { enkel: "Aktiv", avancerad: "Aktiv" },
    statusPartial: { enkel: "Delvis återförd", avancerad: "Delvis återförd" },
    statusDissolved: { enkel: "Återförd", avancerad: "Återförd" },
    statusExpiring: { enkel: "Löper ut snart", avancerad: "Löper ut snart" },
    taxSavings: { enkel: "Skattebespaing", avancerad: "Skattebespaing" },
    mustDissolve: { enkel: "Måste återföras senast", avancerad: "Måste återföras senast" },
    noFonder: { enkel: "Inga fonder skapade ännu", avancerad: "Inga periodiseringsfonder skapade ännu" },
    // Dialog: Create
    newFondTitle: { enkel: "Ny fond", avancerad: "Ny periodiseringsfond" },
    newFondDesc: { enkel: "Spara undan vinst för att skjuta upp skatten. Max 25% av årets vinst.", avancerad: "Avsätt vinst för att skjuta upp skatten. Max 25% av årets vinst (AB)." },
    amountSek: { enkel: "Belopp (kr)", avancerad: "Belopp (SEK)" },
    taxSavingsPreview: { enkel: "Skattebespaing", avancerad: "Skattebespaing" },
    mustDissolveBy: { enkel: "Måste återföras senast", avancerad: "Måste återföras senast" },
    loading: { enkel: "Laddar...", avancerad: "Laddar..." },
    // Dialog: Dissolve
    dissolveTitle: { enkel: "Återför fond", avancerad: "Återför periodiseringsfond" },
    dissolveDesc: { enkel: "Återför fonden från", avancerad: "Återför fonden från" },
    dissolveDescFull: { enkel: "Lämna tomt för att återföra hela fonden.", avancerad: "Lämna belopp tomt för att återföra hela fonden." },
    remainingAmount: { enkel: "Kvarvarande belopp", avancerad: "Kvarvarande belopp" },
    amountToDissolve: { enkel: "Belopp att återföra (valfritt)", avancerad: "Belopp att återföra (valfritt)" },
    fullAmountPlaceholder: { enkel: "Hela beloppet", avancerad: "Hela beloppet" },
    confirmDissolve: { enkel: "Återför", avancerad: "Återför" },
  },

  // ============================================================================
  // Tax Planning: Förmåner (Benefits)
  // ============================================================================
  formaner: {
    title: { enkel: "Förmåner", avancerad: "Förmåner" },
    catalog: { enkel: "Alla förmåner", avancerad: "Förmånskatalog" },
    assigned: { enkel: "Tilldelade", avancerad: "Tilldelade förmåner" },
    taxFree: { enkel: "Skattefria", avancerad: "Skattefria förmåner" },
    taxable: { enkel: "Skattepliktiga", avancerad: "Skattepliktiga förmåner" },
    salarySacrifice: { enkel: "Löneväxling", avancerad: "Bruttolöneavdrag" },
    unused: { enkel: "Ej använda", avancerad: "Ej utnyttjade" },
    benefit: { enkel: "Förmån", avancerad: "Förmån" },
    category: { enkel: "Typ", avancerad: "Kategori" },
    maxAmount: { enkel: "Max belopp", avancerad: "Max belopp" },
    isTaxFree: { enkel: "Skattefri", avancerad: "Skattefri" },
    yes: { enkel: "Ja", avancerad: "Ja" },
    no: { enkel: "Nej", avancerad: "Nej" },
    basAccount: { enkel: "Konto", avancerad: "BAS-konto" },
    assign: { enkel: "Ge förmån", avancerad: "Tilldela" },
    employee: { enkel: "Anställd", avancerad: "Anställd" },
    formansvarde: { enkel: "Skattevärde", avancerad: "Förmånsvärde" },
    year: { enkel: "År", avancerad: "År" },
    noBenefitsAssigned: { enkel: "Inga förmåner tilldelade ännu", avancerad: "Inga förmåner tilldelade ännu" },
    taxFreeUpTo: { enkel: "Skattefri upp till", avancerad: "Skattefri förmån upp till" },
    // Dialog: Assign
    assignTitle: { enkel: "Ge förmån", avancerad: "Tilldela förmån" },
    amountSek: { enkel: "Belopp (kr)", avancerad: "Belopp (SEK)" },
    cancel: { enkel: "Avbryt", avancerad: "Avbryt" },
    confirmAssign: { enkel: "Ge förmån", avancerad: "Tilldela förmån" },
    taxFreeNote: { enkel: "✓ Skattefri upp till", avancerad: "✓ Skattefri förmån upp till" },
    perYear: { enkel: "/år", avancerad: "/år" },
    loading: { enkel: "Laddar...", avancerad: "Laddar..." },
    assignedBenefitsTitle: { enkel: "Tilldelade förmåner", avancerad: "Tilldelade förmåner" },
  },

  // ============================================================================
  // Tax Planning: Investments
  // ============================================================================
  investments: {
    title: { enkel: "Investeringar", avancerad: "Investeringar" },
    properties: { enkel: "Fastigheter", avancerad: "Fastigheter" },
    shares: { enkel: "Aktier", avancerad: "Aktieinnehav" },
    crypto: { enkel: "Krypto", avancerad: "Kryptovalutor" },
    totalPortfolio: { enkel: "Totalt värde", avancerad: "Totalt portföljvärde" },
    addProperty: { enkel: "Lägg till fastighet", avancerad: "Lägg till fastighet" },
    addShares: { enkel: "Lägg till aktier", avancerad: "Lägg till aktieinnehav" },
    name: { enkel: "Namn", avancerad: "Namn" },
    type: { enkel: "Typ", avancerad: "Typ" },
    purchasePrice: { enkel: "Köppris", avancerad: "Anskaffning" },
    bookValue: { enkel: "Värde nu", avancerad: "Bokfört värde" },
    depreciation: { enkel: "Avskrivning", avancerad: "Avskrivning" },
    company: { enkel: "Bolag", avancerad: "Bolag" },
    sharesCount: { enkel: "Antal", avancerad: "Antal" },
    currentValue: { enkel: "Nuvarande värde", avancerad: "Nuvarande värde" },
    gainLoss: { enkel: "Vinst/förlust", avancerad: "Vinst/förlust" },
    currency: { enkel: "Valuta", avancerad: "Valuta" },
    amount: { enkel: "Antal", avancerad: "Antal" },
    building: { enkel: "Byggnad", avancerad: "Byggnad" },
    land: { enkel: "Mark", avancerad: "Mark" },
    investmentProperty: { enkel: "Hyresfastighet", avancerad: "Förvaltningsfastighet" },
    buildingValue: { enkel: "Byggnadsvärde", avancerad: "Byggnadsvärde" },
    landValue: { enkel: "Markvärde", avancerad: "Markvärde" },
    depreciationRate: { enkel: "Avskrivning per år", avancerad: "Avskrivningstakt" },
    companyName: { enkel: "Bolagsnamn", avancerad: "Bolagsnamn" },
    orgNumber: { enkel: "Orgnummer", avancerad: "Organisationsnummer" },
    noProperties: { enkel: "Inga fastigheter", avancerad: "Inga fastigheter registrerade" },
    noShares: { enkel: "Inga aktier", avancerad: "Inga aktieinnehav registrerade" },
    noCrypto: { enkel: "Ingen krypto", avancerad: "Inga kryptovalutor registrerade" },
    // Dialog & Actions
    add: { enkel: "Lägg till", avancerad: "Lägg till" },
    addPropertyTitle: { enkel: "Lägg till fastighet", avancerad: "Lägg till fastighet" },
    addSharesTitle: { enkel: "Lägg till aktier", avancerad: "Lägg till aktieinnehav" },
    addPropertyDesc: { enkel: "Registrera en ny fastighet.", avancerad: "Registrera en ny fastighet i anläggningsregistret" },
    addSharesDesc: { enkel: "Registrera ett nytt aktieinnehav.", avancerad: "Registrera ett nytt aktieinnehav" },
    cancel: { enkel: "Avbryt", avancerad: "Avbryt" },
    remove: { enkel: "Ta bort", avancerad: "Ta bort" },
    loading: { enkel: "Laddar...", avancerad: "Laddar..." },
    perYear: { enkel: "/år", avancerad: "/år" },
    sharesCountLabel: { enkel: "Antal aktier", avancerad: "Antal aktier" },
    purchasePriceLabel: { enkel: "Köppris (kr)", avancerad: "Anskaffningsvärde (SEK)" },
  },
} as const

// Type helpers
export type TranslationKey = keyof typeof translations
export type Translations = typeof translations
