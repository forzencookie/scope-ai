export const transactions = {
    title: "Transaktioner",
    subtitle: "Granska och bokför transaktioner.",
    allTransactions: "Alla transaktioner",
    newTransaction: "Ny transaktion",
    unbooked: "Obokförd",
    recorded: "Bokförda",
    ignored: "Ignorerade",
    all: "Alla",

    // Actions
    book: "Bokför",
    bookAll: "Bokför alla",
    bookSelected: "Bokför valda",
    ignore: "Ignorera",
    addReceipt: "Lägg till underlag",
    viewDetails: "Visa detaljer",

    // Table headers
    date: "Datum",
    description: "Beskrivning",
    amount: "Belopp",
    category: "Kategori",
    account: "Bokföringskonto",
    status: "Status",

    // Status labels
    statusUnbooked: "Obokförd",
    statusRecorded: "Bokförd",
    statusIgnored: "Ignorerad",

    // Empty state
    empty: "Inga transaktioner",
    emptyDesc: "Ladda upp dina transaktioner så sköter vi resten.",

    // Search
    search: "Sök transaktioner...",
}

export const invoices = {
    title: "Kundfakturor",
    subtitle: "Skapa, skicka och följ upp betalningar.",
    create: "Ny faktura",
    send: "Skicka",
    sendReminder: "Skicka betalningspåminnelse",
    markPaid: "Markera som betald",

    // Table headers
    invoiceNumber: "Fakturanummer",
    customer: "Kund",
    issueDate: "Fakturadatum",
    dueDate: "Förfallodatum",
    amount: "Belopp",
    status: "Status",

    // Status
    statusPaid: "Betald",
    statusSent: "Skickad",
    statusDraft: "Utkast",
    statusCancelled: "Makulerad",

    // Stats
    outstanding: "Utestående",
    overdue: "Förfallna",
    paidThisMonth: "Betalda denna period",

    // Empty
    empty: "Inga fakturor",
    emptyDesc: "Skapa fakturor för att fakturera kunder",

    search: "Sök fakturor...",

    // Bulk actions
    allInvoices: "Alla fakturor",
    invoicesDeleted: "Fakturor raderade",
    invoicesDeletedDesc: "fakturor har raderats",
    invoicesSent: "Fakturor skickade",
    invoicesSentDesc: "fakturor har skickats",
    preparingDownload: "Förbereder",
    invoiceDeleted: "Faktura raderad",
    invoiceDeletedDesc: "har raderats",
    reminderSent: "Påminnelse skickad",
    reminderSentDesc: "Betalningspåminnelse har skickats till",
    invoiceCreated: "Faktura skapad!",
    invoiceCreatedDesc: "Faktura till",
    hasBeenCreated: "har skapats",

    // Form
    createInvoice: "Skapa ny faktura",
    customerName: "Kund",
    enterCustomer: "Ange kundnamn...",
    customerRequired: "Kundnamn krävs",
    customerMinLength: "Kundnamn måste vara minst 2 tecken",
    amountRequired: "Belopp krävs",
    amountPositive: "Belopp måste vara större än 0",
    amountTooLarge: "Belopp är för stort",
    requiredFields: "* Obligatoriska fält",
    creating: "Skapar...",

    // Details dialog
    details: "Fakturadetaljer",
    outgoingInvoices: "Utgående Fakturor",
    lastUpdated: "Senaste uppdaterad:",
}

export const assets = {
    title: "Anläggningsregister",
    subtitle: "Inventarier och avskrivningar enligt plan.",
    addAsset: "Lägg till inventarie",
    newAsset: "Ny inventarie",
    newAssetDesc: "Lägg till en ny tillgång i anläggningsregistret.",

    // Table headers
    name: "Namn",
    category: "Kategori",
    purchaseDate: "Inköpsdatum",
    purchasePrice: "Anskaffningsvärde",
    currentValue: "Bokfört värde",
    usefulLife: "Livslängd",

    // Stats
    totalAssets: "Totala tillgångar",
    totalValue: "Totalt anskaffningsvärde",
    currentTotalValue: "Bokfört värde",
    depreciation: "Ackumulerade avskrivningar",

    // Empty
    empty: "Inga tillgångar registrerade",
}

export const supplierInvoices = {
    title: "Leverantörsfakturor",
    subtitle: "Godkänn, betala och håll koll på förfallodatum.",
    addInvoice: "Lägg till faktura",
    approve: "Attestera",
    pay: "Betala",
    reject: "Avvisa",

    // Table headers
    supplier: "Leverantör",
    invoiceNumber: "Fakturanummer",
    invoiceDate: "Fakturadatum",
    dueDate: "Förfallodatum",
    amount: "Belopp",
    ocr: "OCR-nummer",
    status: "Status",

    // Status
    statusReceived: "Mottagen",
    statusApproved: "Godkänd",
    statusPaid: "Betald",

    // Stats
    unpaid: "Obetalda fakturor",
    toApprove: "Att attestera",
    overdueAmount: "Förfallna",
    aiMatched: "AI-matchade",
    ofReceived: "av mottagna",
    invoices: "fakturor",

    empty: "Inga leverantörsfakturor",
    search: "Sök leverantörsfakturor...",

    viewInvoice: "Visa faktura",
    markAsPaid: "Markera betald",
    downloadPdf: "Ladda ner PDF",
    setStatus: "Sätt status",
}

export const receipts = {
    title: "Underlag",
    subtitle: "Ladda upp och matcha med transaktioner.",
    upload: "Ladda upp underlag",
    scan: "Skanna underlag",
    match: "Matcha med transaktion",

    // Table headers
    supplier: "Leverantör",
    date: "Datum",
    amount: "Belopp",
    category: "Kategori",
    status: "Status",

    // Status
    statusNew: "Ny",
    statusRecorded: "Bokförd",
    statusRejected: "Avvisad",

    // Stats
    unmatched: "Omatchade",
    matched: "Matchade",

    empty: "Inga underlag",
    emptyDesc: "Underlag visas här när de laddas upp",
    search: "Sök underlag...",

    // Bulk actions
    allReceipts: "Alla underlag",
    receiptsDeleted: "Underlag raderade",
    receiptsDeletedDesc: "underlag har raderats",
    receiptsArchived: "Underlag arkiverade",
    receiptsArchivedDesc: "underlag har arkiverats",
    preparingDownload: "Förbereder",
    receiptDeleted: "Underlag raderat",
    totalReceipts: "Totalt underlag",
    matchedReceipts: "Matchade",
    unmatchedReceipts: "Omatchade",
    totalAmount: "Total summa",
    linkedToTransaction: "Kopplade till transaktion",
    notLinked: "Ej kopplade",
    uploadReceipt: "Ladda upp underlag",
    details: "Underlagsdetaljer",
    linkedTransaction: "Kopplad transaktion",
    notLinkedYet: "Ej kopplad",
    hasAttachment: "Bilaga",
}
