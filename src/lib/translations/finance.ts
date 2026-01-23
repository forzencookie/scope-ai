export const transactions = {
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
}

export const invoices = {
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
}

export const assets = {
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
}

export const supplierInvoices = {
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
}

export const receipts = {
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
}
