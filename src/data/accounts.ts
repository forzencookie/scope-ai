// ============================================
// BAS-kontoplan (Swedish Chart of Accounts)
// Standard Swedish accounting chart based on BAS 2024
// ============================================

// Account class structure:
// 1xxx - Tillgångar (Assets)
// 2xxx - Eget kapital och skulder (Equity & Liabilities)
// 3xxx - Intäkter (Revenue)
// 4xxx - Kostnader för varor/material (Cost of goods)
// 5xxx - Övriga externa kostnader (Other external costs)
// 6xxx - Övriga externa kostnader forts. (Other external costs cont.)
// 7xxx - Personalkostnader (Personnel costs)
// 8xxx - Finansiella poster (Financial items)

export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type AccountType = 
  | 'asset'      // Tillgång
  | 'liability'  // Skuld
  | 'equity'     // Eget kapital
  | 'revenue'    // Intäkt
  | 'expense';   // Kostnad

export interface Account {
  number: string;
  name: string;
  description?: string;
  type: AccountType;
  class: AccountClass;
  // For grouping in UI
  group: string;
  subGroup?: string;
  // VAT related
  vatCode?: '25' | '12' | '6' | '0' | 'exempt';
  // Common/frequently used
  isCommon?: boolean;
}

// ============================================
// BAS Accounts - Most Common (~200 accounts)
// ============================================

export const basAccounts: Account[] = [
  // ============================================
  // 1xxx - TILLGÅNGAR (Assets)
  // ============================================
  
  // 10xx - Immateriella anläggningstillgångar
  { number: '1010', name: 'Balanserade utgifter för utvecklingsarbeten', type: 'asset', class: 1, group: 'Immateriella tillgångar' },
  { number: '1020', name: 'Koncessioner', type: 'asset', class: 1, group: 'Immateriella tillgångar' },
  { number: '1030', name: 'Patent', type: 'asset', class: 1, group: 'Immateriella tillgångar' },
  { number: '1040', name: 'Licenser', type: 'asset', class: 1, group: 'Immateriella tillgångar' },
  { number: '1050', name: 'Varumärken', type: 'asset', class: 1, group: 'Immateriella tillgångar' },
  { number: '1070', name: 'Goodwill', type: 'asset', class: 1, group: 'Immateriella tillgångar' },
  
  // 11xx - Byggnader och mark
  { number: '1110', name: 'Byggnader', type: 'asset', class: 1, group: 'Byggnader och mark' },
  { number: '1120', name: 'Byggnadsinventarier', type: 'asset', class: 1, group: 'Byggnader och mark' },
  { number: '1130', name: 'Mark', type: 'asset', class: 1, group: 'Byggnader och mark' },
  { number: '1150', name: 'Markanläggningar', type: 'asset', class: 1, group: 'Byggnader och mark' },
  
  // 12xx - Maskiner och inventarier
  { number: '1210', name: 'Maskiner och andra tekniska anläggningar', type: 'asset', class: 1, group: 'Maskiner och inventarier', isCommon: true },
  { number: '1220', name: 'Inventarier och verktyg', type: 'asset', class: 1, group: 'Maskiner och inventarier', isCommon: true },
  { number: '1230', name: 'Installationer', type: 'asset', class: 1, group: 'Maskiner och inventarier' },
  { number: '1240', name: 'Bilar och andra transportmedel', type: 'asset', class: 1, group: 'Maskiner och inventarier', isCommon: true },
  { number: '1250', name: 'Datorer', type: 'asset', class: 1, group: 'Maskiner och inventarier', isCommon: true },
  
  // 13xx - Finansiella anläggningstillgångar
  { number: '1310', name: 'Andelar i koncernföretag', type: 'asset', class: 1, group: 'Finansiella tillgångar' },
  { number: '1320', name: 'Andelar i intresseföretag', type: 'asset', class: 1, group: 'Finansiella tillgångar' },
  { number: '1350', name: 'Andelar i andra företag', type: 'asset', class: 1, group: 'Finansiella tillgångar' },
  { number: '1380', name: 'Andra långfristiga fordringar', type: 'asset', class: 1, group: 'Finansiella tillgångar' },
  
  // 14xx - Lager
  { number: '1410', name: 'Lager av råvaror', type: 'asset', class: 1, group: 'Lager', isCommon: true },
  { number: '1420', name: 'Lager av halvfabrikat', type: 'asset', class: 1, group: 'Lager' },
  { number: '1430', name: 'Lager av färdiga varor', type: 'asset', class: 1, group: 'Lager' },
  { number: '1440', name: 'Lager av handelsvaror', type: 'asset', class: 1, group: 'Lager', isCommon: true },
  { number: '1460', name: 'Pågående arbeten', type: 'asset', class: 1, group: 'Lager' },
  { number: '1470', name: 'Förskott till leverantörer', type: 'asset', class: 1, group: 'Lager' },
  
  // 15xx - Kundfordringar
  { number: '1510', name: 'Kundfordringar', type: 'asset', class: 1, group: 'Kundfordringar', isCommon: true },
  { number: '1512', name: 'Kundfordringar hos koncernföretag', type: 'asset', class: 1, group: 'Kundfordringar' },
  { number: '1515', name: 'Osäkra kundfordringar', type: 'asset', class: 1, group: 'Kundfordringar' },
  { number: '1519', name: 'Nedskrivning av kundfordringar', type: 'asset', class: 1, group: 'Kundfordringar' },
  
  // 16xx - Övriga kortfristiga fordringar
  { number: '1610', name: 'Fordringar hos anställda', type: 'asset', class: 1, group: 'Övriga fordringar' },
  { number: '1630', name: 'Skattefordringar', type: 'asset', class: 1, group: 'Övriga fordringar', isCommon: true },
  { number: '1640', name: 'Ingående moms', type: 'asset', class: 1, group: 'Övriga fordringar', isCommon: true },
  { number: '1650', name: 'Momsfordran', type: 'asset', class: 1, group: 'Övriga fordringar', isCommon: true },
  
  // 17xx - Förutbetalda kostnader
  { number: '1710', name: 'Förutbetalda hyreskostnader', type: 'asset', class: 1, group: 'Förutbetalda kostnader', isCommon: true },
  { number: '1720', name: 'Förutbetalda leasingavgifter', type: 'asset', class: 1, group: 'Förutbetalda kostnader' },
  { number: '1730', name: 'Förutbetalda försäkringspremier', type: 'asset', class: 1, group: 'Förutbetalda kostnader', isCommon: true },
  { number: '1790', name: 'Övriga förutbetalda kostnader', type: 'asset', class: 1, group: 'Förutbetalda kostnader' },
  
  // 18xx - Kortfristiga placeringar
  { number: '1810', name: 'Andelar i börsnoterade företag', type: 'asset', class: 1, group: 'Kortfristiga placeringar' },
  { number: '1820', name: 'Obligationer', type: 'asset', class: 1, group: 'Kortfristiga placeringar' },
  { number: '1880', name: 'Andra kortfristiga placeringar', type: 'asset', class: 1, group: 'Kortfristiga placeringar' },
  
  // 19xx - Kassa och bank
  { number: '1910', name: 'Kassa', type: 'asset', class: 1, group: 'Kassa och bank', isCommon: true },
  { number: '1920', name: 'PlusGiro', type: 'asset', class: 1, group: 'Kassa och bank', isCommon: true },
  { number: '1930', name: 'Företagskonto', type: 'asset', class: 1, group: 'Kassa och bank', isCommon: true },
  { number: '1940', name: 'Övriga bankkonton', type: 'asset', class: 1, group: 'Kassa och bank' },
  { number: '1950', name: 'Bankgiro', type: 'asset', class: 1, group: 'Kassa och bank', isCommon: true },
  
  // ============================================
  // 2xxx - EGET KAPITAL OCH SKULDER
  // ============================================
  
  // 20xx - Eget kapital
  { number: '2010', name: 'Eget kapital', type: 'equity', class: 2, group: 'Eget kapital', isCommon: true },
  { number: '2011', name: 'Aktiekapital', type: 'equity', class: 2, group: 'Eget kapital', isCommon: true },
  { number: '2012', name: 'Ej registrerat aktiekapital', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2013', name: 'Reservfond', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2019', name: 'Överkursfond', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2020', name: 'Fond för utvecklingsutgifter', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2050', name: 'Insatskapital', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2060', name: 'Eget kapital i EF', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2070', name: 'Eget kapital i HB/KB', type: 'equity', class: 2, group: 'Eget kapital' },
  
  // 20xx forts - Resultat
  { number: '2080', name: 'Balanserat resultat', type: 'equity', class: 2, group: 'Eget kapital', isCommon: true },
  { number: '2090', name: 'Årets resultat', type: 'equity', class: 2, group: 'Eget kapital', isCommon: true },
  { number: '2091', name: 'Redovisat resultat', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2093', name: 'Förändring av periodiseringsfond', type: 'equity', class: 2, group: 'Eget kapital' },
  { number: '2099', name: 'Årets resultat, helår', type: 'equity', class: 2, group: 'Eget kapital' },
  
  // 21xx - Obeskattade reserver
  { number: '2110', name: 'Periodiseringsfond', type: 'liability', class: 2, group: 'Obeskattade reserver' },
  { number: '2120', name: 'Periodiseringsfond, Taxering 2019', type: 'liability', class: 2, group: 'Obeskattade reserver' },
  { number: '2150', name: 'Ackumulerade överavskrivningar', type: 'liability', class: 2, group: 'Obeskattade reserver' },
  
  // 22xx - Avsättningar
  { number: '2210', name: 'Avsättningar för pensioner', type: 'liability', class: 2, group: 'Avsättningar' },
  { number: '2220', name: 'Avsättningar för garantier', type: 'liability', class: 2, group: 'Avsättningar' },
  { number: '2250', name: 'Övriga avsättningar', type: 'liability', class: 2, group: 'Avsättningar' },
  
  // 23xx - Långfristiga skulder
  { number: '2310', name: 'Obligations- och förlagslån', type: 'liability', class: 2, group: 'Långfristiga skulder' },
  { number: '2320', name: 'Konvertibla lån', type: 'liability', class: 2, group: 'Långfristiga skulder' },
  { number: '2330', name: 'Checkräkningskredit', type: 'liability', class: 2, group: 'Långfristiga skulder', isCommon: true },
  { number: '2350', name: 'Långfristiga skulder till kreditinstitut', type: 'liability', class: 2, group: 'Långfristiga skulder', isCommon: true },
  { number: '2390', name: 'Övriga långfristiga skulder', type: 'liability', class: 2, group: 'Långfristiga skulder' },
  { number: '2393', name: 'Lån från aktieägare', type: 'liability', class: 2, group: 'Långfristiga skulder' },
  
  // 24xx - Kortfristiga skulder till kreditinstitut
  { number: '2410', name: 'Kortfristiga skulder till kreditinstitut', type: 'liability', class: 2, group: 'Kortfristiga skulder' },
  { number: '2420', name: 'Förskott från kunder', type: 'liability', class: 2, group: 'Kortfristiga skulder', isCommon: true },
  { number: '2440', name: 'Leverantörsskulder', type: 'liability', class: 2, group: 'Kortfristiga skulder', isCommon: true },
  { number: '2445', name: 'Leverantörsskulder till koncernföretag', type: 'liability', class: 2, group: 'Kortfristiga skulder' },
  
  // 25xx - Skatteskulder
  { number: '2510', name: 'Skatteskulder', type: 'liability', class: 2, group: 'Skatteskulder', isCommon: true },
  { number: '2512', name: 'Beräknad inkomstskatt', type: 'liability', class: 2, group: 'Skatteskulder' },
  
  // 26xx - Moms och punktskatter
  { number: '2610', name: 'Utgående moms, 25%', type: 'liability', class: 2, group: 'Moms', vatCode: '25', isCommon: true },
  { number: '2620', name: 'Utgående moms, 12%', type: 'liability', class: 2, group: 'Moms', vatCode: '12', isCommon: true },
  { number: '2630', name: 'Utgående moms, 6%', type: 'liability', class: 2, group: 'Moms', vatCode: '6', isCommon: true },
  { number: '2640', name: 'Ingående moms', type: 'liability', class: 2, group: 'Moms', isCommon: true },
  { number: '2650', name: 'Redovisningskonto för moms', type: 'liability', class: 2, group: 'Moms', isCommon: true },
  
  // 27xx - Personalens skatter och avgifter
  { number: '2710', name: 'Personalskatt', type: 'liability', class: 2, group: 'Personalskatter', isCommon: true },
  { number: '2730', name: 'Arbetsgivaravgifter', type: 'liability', class: 2, group: 'Personalskatter', isCommon: true },
  { number: '2731', name: 'Avräkning lagstadgade sociala avgifter', type: 'liability', class: 2, group: 'Personalskatter' },
  { number: '2732', name: 'Avräkning särskild löneskatt', type: 'liability', class: 2, group: 'Personalskatter' },
  
  // 28xx - Övriga kortfristiga skulder
  { number: '2810', name: 'Avräkning för factoring', type: 'liability', class: 2, group: 'Övriga kortfristiga skulder' },
  { number: '2820', name: 'Kortfristiga skulder till anställda', type: 'liability', class: 2, group: 'Övriga kortfristiga skulder' },
  { number: '2850', name: 'Avräkning för skatter och avgifter', type: 'liability', class: 2, group: 'Övriga kortfristiga skulder' },
  { number: '2890', name: 'Övriga kortfristiga skulder', type: 'liability', class: 2, group: 'Övriga kortfristiga skulder' },
  { number: '2893', name: 'Skulder till aktieägare', type: 'liability', class: 2, group: 'Övriga kortfristiga skulder' },
  { number: '2898', name: 'Outtagen utdelning', type: 'liability', class: 2, group: 'Övriga kortfristiga skulder' },
  
  // 29xx - Upplupna kostnader och förutbetalda intäkter
  { number: '2910', name: 'Upplupna löner', type: 'liability', class: 2, group: 'Upplupna kostnader', isCommon: true },
  { number: '2920', name: 'Upplupna semesterlöner', type: 'liability', class: 2, group: 'Upplupna kostnader', isCommon: true },
  { number: '2930', name: 'Upplupna sociala avgifter', type: 'liability', class: 2, group: 'Upplupna kostnader', isCommon: true },
  { number: '2940', name: 'Upplupna räntekostnader', type: 'liability', class: 2, group: 'Upplupna kostnader' },
  { number: '2970', name: 'Förutbetalda hyresintäkter', type: 'liability', class: 2, group: 'Upplupna kostnader' },
  { number: '2990', name: 'Övriga upplupna kostnader', type: 'liability', class: 2, group: 'Upplupna kostnader' },
  
  // ============================================
  // 3xxx - RÖRELSEINTÄKTER (Revenue)
  // ============================================
  
  // 30xx-34xx - Försäljningsintäkter
  { number: '3000', name: 'Försäljning varor, 25% moms', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '25', isCommon: true },
  { number: '3001', name: 'Försäljning varor, 12% moms', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '12' },
  { number: '3002', name: 'Försäljning varor, 6% moms', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '6' },
  { number: '3003', name: 'Försäljning varor, momsfri', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '0' },
  { number: '3010', name: 'Försäljning tjänster, 25% moms', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '25', isCommon: true },
  { number: '3011', name: 'Försäljning tjänster, 12% moms', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '12' },
  { number: '3012', name: 'Försäljning tjänster, 6% moms', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '6' },
  { number: '3013', name: 'Försäljning tjänster, momsfri', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '0' },
  { number: '3040', name: 'Försäljning till EU', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '0', isCommon: true },
  { number: '3050', name: 'Försäljning utanför EU', type: 'revenue', class: 3, group: 'Försäljning', vatCode: '0', isCommon: true },
  
  // 35xx - Fakturerade kostnader
  { number: '3510', name: 'Fakturerade frakter', type: 'revenue', class: 3, group: 'Fakturerade kostnader' },
  { number: '3520', name: 'Fakturerade tull- och speditionskostnader', type: 'revenue', class: 3, group: 'Fakturerade kostnader' },
  { number: '3540', name: 'Fakturerat emballage', type: 'revenue', class: 3, group: 'Fakturerade kostnader' },
  
  // 36xx - Sidointäkter
  { number: '3600', name: 'Hyresintäkter', type: 'revenue', class: 3, group: 'Sidointäkter' },
  { number: '3610', name: 'Provisionsintäkter', type: 'revenue', class: 3, group: 'Sidointäkter' },
  
  // 37xx - Rabatter
  { number: '3730', name: 'Lämnade kassarabatter', type: 'revenue', class: 3, group: 'Rabatter' },
  { number: '3740', name: 'Öresutjämning', type: 'revenue', class: 3, group: 'Rabatter' },
  
  // 38xx - Aktiverat arbete
  { number: '3800', name: 'Aktiverat arbete för egen räkning', type: 'revenue', class: 3, group: 'Aktiverat arbete' },
  
  // 39xx - Övriga rörelseintäkter
  { number: '3900', name: 'Övriga rörelseintäkter', type: 'revenue', class: 3, group: 'Övriga intäkter', isCommon: true },
  { number: '3910', name: 'Hyresintäkter', type: 'revenue', class: 3, group: 'Övriga intäkter' },
  { number: '3920', name: 'Provisionsintäkter', type: 'revenue', class: 3, group: 'Övriga intäkter' },
  { number: '3960', name: 'Valutakursvinster', type: 'revenue', class: 3, group: 'Övriga intäkter' },
  { number: '3970', name: 'Erhållna bidrag', type: 'revenue', class: 3, group: 'Övriga intäkter' },
  { number: '3980', name: 'Erhållna skadestånd', type: 'revenue', class: 3, group: 'Övriga intäkter' },
  { number: '3990', name: 'Övriga ersättningar och intäkter', type: 'revenue', class: 3, group: 'Övriga intäkter' },
  
  // ============================================
  // 4xxx - KOSTNADER FÖR VAROR/MATERIAL
  // ============================================
  
  { number: '4000', name: 'Inköp av varor', type: 'expense', class: 4, group: 'Inköp varor', isCommon: true },
  { number: '4010', name: 'Inköp av varor inom Sverige', type: 'expense', class: 4, group: 'Inköp varor', isCommon: true },
  { number: '4040', name: 'Inköp av varor inom EU', type: 'expense', class: 4, group: 'Inköp varor' },
  { number: '4050', name: 'Inköp av varor utanför EU', type: 'expense', class: 4, group: 'Inköp varor' },
  { number: '4100', name: 'Inköp av råvaror', type: 'expense', class: 4, group: 'Inköp varor' },
  { number: '4200', name: 'Inköp av halvfabrikat', type: 'expense', class: 4, group: 'Inköp varor' },
  { number: '4500', name: 'Inköp av tjänster', type: 'expense', class: 4, group: 'Inköp tjänster', isCommon: true },
  { number: '4510', name: 'Inköp av tjänster inom Sverige', type: 'expense', class: 4, group: 'Inköp tjänster', isCommon: true },
  { number: '4531', name: 'Inköp av tjänster inom EU', type: 'expense', class: 4, group: 'Inköp tjänster' },
  { number: '4535', name: 'Inköp av tjänster utanför EU', type: 'expense', class: 4, group: 'Inköp tjänster' },
  { number: '4600', name: 'Legoarbeten och underentreprenader', type: 'expense', class: 4, group: 'Inköp tjänster' },
  
  // ============================================
  // 5xxx - ÖVRIGA EXTERNA KOSTNADER
  // ============================================
  
  // 50xx - Lokalkostnader
  { number: '5010', name: 'Lokalhyra', type: 'expense', class: 5, group: 'Lokalkostnader', isCommon: true },
  { number: '5020', name: 'El för lokaler', type: 'expense', class: 5, group: 'Lokalkostnader', isCommon: true },
  { number: '5030', name: 'Värme för lokaler', type: 'expense', class: 5, group: 'Lokalkostnader' },
  { number: '5040', name: 'Vatten och avlopp', type: 'expense', class: 5, group: 'Lokalkostnader' },
  { number: '5050', name: 'Städning och renhållning', type: 'expense', class: 5, group: 'Lokalkostnader' },
  { number: '5060', name: 'Reparation och underhåll av lokaler', type: 'expense', class: 5, group: 'Lokalkostnader' },
  { number: '5090', name: 'Övriga lokalkostnader', type: 'expense', class: 5, group: 'Lokalkostnader' },
  
  // 51xx - Fastighetskostnader
  { number: '5110', name: 'Tomträttsavgäld/arrende', type: 'expense', class: 5, group: 'Fastighetskostnader' },
  { number: '5120', name: 'El för fastigheter', type: 'expense', class: 5, group: 'Fastighetskostnader' },
  { number: '5170', name: 'Reparation och underhåll av fastigheter', type: 'expense', class: 5, group: 'Fastighetskostnader' },
  
  // 52xx - Hyra av anläggningstillgångar
  { number: '5210', name: 'Hyra av maskiner', type: 'expense', class: 5, group: 'Hyra av anläggningstillgångar' },
  { number: '5220', name: 'Hyra av inventarier', type: 'expense', class: 5, group: 'Hyra av anläggningstillgångar' },
  { number: '5250', name: 'Hyra av datorer', type: 'expense', class: 5, group: 'Hyra av anläggningstillgångar', isCommon: true },
  
  // 54xx - Förbrukningsinventarier
  { number: '5410', name: 'Förbrukningsinventarier', type: 'expense', class: 5, group: 'Förbrukningsmaterial', isCommon: true },
  { number: '5420', name: 'Programvaror', type: 'expense', class: 5, group: 'Förbrukningsmaterial', isCommon: true },
  { number: '5460', name: 'Förbrukningsmaterial', type: 'expense', class: 5, group: 'Förbrukningsmaterial', isCommon: true },
  
  // 55xx - Reparation och underhåll
  { number: '5510', name: 'Reparation och underhåll maskiner', type: 'expense', class: 5, group: 'Reparation och underhåll' },
  { number: '5520', name: 'Reparation och underhåll inventarier', type: 'expense', class: 5, group: 'Reparation och underhåll' },
  { number: '5550', name: 'Reparation och underhåll datorer', type: 'expense', class: 5, group: 'Reparation och underhåll' },
  
  // 56xx - Transport och resor
  { number: '5600', name: 'Bilkostnader', type: 'expense', class: 5, group: 'Transport', isCommon: true },
  { number: '5610', name: 'Personbilskostnader', type: 'expense', class: 5, group: 'Transport', isCommon: true },
  { number: '5611', name: 'Drivmedel', type: 'expense', class: 5, group: 'Transport', isCommon: true },
  { number: '5612', name: 'Försäkring och skatt', type: 'expense', class: 5, group: 'Transport' },
  { number: '5613', name: 'Reparation och underhåll', type: 'expense', class: 5, group: 'Transport' },
  { number: '5615', name: 'Leasingavgift bil', type: 'expense', class: 5, group: 'Transport', isCommon: true },
  { number: '5690', name: 'Övriga transportkostnader', type: 'expense', class: 5, group: 'Transport' },
  
  // 58xx - Resekostnader
  { number: '5800', name: 'Resekostnader', type: 'expense', class: 5, group: 'Resor', isCommon: true },
  { number: '5810', name: 'Biljetter', type: 'expense', class: 5, group: 'Resor', isCommon: true },
  { number: '5820', name: 'Hyrbilskostnader', type: 'expense', class: 5, group: 'Resor' },
  { number: '5830', name: 'Kost och logi', type: 'expense', class: 5, group: 'Resor', isCommon: true },
  { number: '5890', name: 'Övriga resekostnader', type: 'expense', class: 5, group: 'Resor' },
  
  // ============================================
  // 6xxx - ÖVRIGA EXTERNA KOSTNADER (forts.)
  // ============================================
  
  // 60xx - Försäljningskostnader
  { number: '6000', name: 'Försäljningskostnader', type: 'expense', class: 6, group: 'Försäljningskostnader' },
  { number: '6010', name: 'Marknadsföring', type: 'expense', class: 6, group: 'Försäljningskostnader', isCommon: true },
  { number: '6040', name: 'Representation', type: 'expense', class: 6, group: 'Försäljningskostnader', isCommon: true },
  { number: '6050', name: 'Reklamkostnader', type: 'expense', class: 6, group: 'Försäljningskostnader', isCommon: true },
  { number: '6060', name: 'Kataloger och prislistor', type: 'expense', class: 6, group: 'Försäljningskostnader' },
  { number: '6070', name: 'Utställningar och mässor', type: 'expense', class: 6, group: 'Försäljningskostnader' },
  { number: '6071', name: 'Utställning monterkostnader', type: 'expense', class: 6, group: 'Försäljningskostnader' },
  { number: '6072', name: 'Utställning representation', type: 'expense', class: 6, group: 'Försäljningskostnader' },
  
  // 61xx - Kontorsmaterial och trycksaker
  { number: '6100', name: 'Kontorsmaterial', type: 'expense', class: 6, group: 'Kontorsmaterial', isCommon: true },
  { number: '6110', name: 'Kontorsmaterial och trycksaker', type: 'expense', class: 6, group: 'Kontorsmaterial', isCommon: true },
  { number: '6150', name: 'Trycksaker', type: 'expense', class: 6, group: 'Kontorsmaterial' },
  
  // 62xx - Tele och post
  { number: '6200', name: 'Telefon och internet', type: 'expense', class: 6, group: 'Tele och post', isCommon: true },
  { number: '6210', name: 'Telekommunikation', type: 'expense', class: 6, group: 'Tele och post', isCommon: true },
  { number: '6211', name: 'Fast telefoni', type: 'expense', class: 6, group: 'Tele och post' },
  { number: '6212', name: 'Mobiltelefon', type: 'expense', class: 6, group: 'Tele och post', isCommon: true },
  { number: '6230', name: 'Datakommunikation', type: 'expense', class: 6, group: 'Tele och post', isCommon: true },
  { number: '6250', name: 'Porto', type: 'expense', class: 6, group: 'Tele och post', isCommon: true },
  
  // 63xx - Företagsförsäkringar
  { number: '6300', name: 'Företagsförsäkringar', type: 'expense', class: 6, group: 'Försäkringar', isCommon: true },
  { number: '6310', name: 'Försäkringspremier', type: 'expense', class: 6, group: 'Försäkringar', isCommon: true },
  
  // 64xx - Förvaltningskostnader
  { number: '6400', name: 'Förvaltningskostnader', type: 'expense', class: 6, group: 'Förvaltning' },
  { number: '6410', name: 'Styrelsearvoden', type: 'expense', class: 6, group: 'Förvaltning' },
  { number: '6420', name: 'Revisionsarvoden', type: 'expense', class: 6, group: 'Förvaltning', isCommon: true },
  { number: '6430', name: 'Managementtjänster', type: 'expense', class: 6, group: 'Förvaltning' },
  { number: '6490', name: 'Övriga förvaltningskostnader', type: 'expense', class: 6, group: 'Förvaltning' },
  
  // 65xx - Övriga externa tjänster
  { number: '6500', name: 'Övriga externa tjänster', type: 'expense', class: 6, group: 'Externa tjänster', isCommon: true },
  { number: '6530', name: 'Redovisningstjänster', type: 'expense', class: 6, group: 'Externa tjänster', isCommon: true },
  { number: '6540', name: 'IT-tjänster', type: 'expense', class: 6, group: 'Externa tjänster', isCommon: true },
  { number: '6550', name: 'Konsultarvoden', type: 'expense', class: 6, group: 'Externa tjänster', isCommon: true },
  { number: '6560', name: 'Serviceavgifter', type: 'expense', class: 6, group: 'Externa tjänster' },
  { number: '6570', name: 'Bankavgifter', type: 'expense', class: 6, group: 'Externa tjänster', isCommon: true },
  
  // 69xx - Övriga externa kostnader
  { number: '6900', name: 'Övriga externa kostnader', type: 'expense', class: 6, group: 'Övriga kostnader' },
  { number: '6970', name: 'Tidningar och böcker', type: 'expense', class: 6, group: 'Övriga kostnader' },
  { number: '6980', name: 'Föreningsavgifter', type: 'expense', class: 6, group: 'Övriga kostnader' },
  { number: '6990', name: 'Övriga externa kostnader', type: 'expense', class: 6, group: 'Övriga kostnader' },
  { number: '6991', name: 'Övriga externa kostnader, avdragsgilla', type: 'expense', class: 6, group: 'Övriga kostnader' },
  { number: '6992', name: 'Övriga externa kostnader, ej avdragsgilla', type: 'expense', class: 6, group: 'Övriga kostnader' },
  
  // ============================================
  // 7xxx - PERSONALKOSTNADER
  // ============================================
  
  // 70xx - Löner och ersättningar
  { number: '7010', name: 'Löner till kollektivanställda', type: 'expense', class: 7, group: 'Löner', isCommon: true },
  { number: '7011', name: 'Löner till tjänstemän', type: 'expense', class: 7, group: 'Löner', isCommon: true },
  { number: '7012', name: 'Löner till företagsledare', type: 'expense', class: 7, group: 'Löner', isCommon: true },
  { number: '7080', name: 'Semesterlöner', type: 'expense', class: 7, group: 'Löner' },
  { number: '7081', name: 'Förändring av semesterlöneskuld', type: 'expense', class: 7, group: 'Löner' },
  { number: '7082', name: 'Sjuklön', type: 'expense', class: 7, group: 'Löner' },
  { number: '7090', name: 'Förändring av löneskuld', type: 'expense', class: 7, group: 'Löner' },
  
  // 72xx - Arvoden
  { number: '7210', name: 'Styrelsearvoden', type: 'expense', class: 7, group: 'Arvoden' },
  { number: '7220', name: 'Arvoden till revisorer', type: 'expense', class: 7, group: 'Arvoden' },
  
  // 73xx - Kostnadsersättningar
  { number: '7300', name: 'Traktamenten', type: 'expense', class: 7, group: 'Ersättningar', isCommon: true },
  { number: '7310', name: 'Skattefria traktamenten', type: 'expense', class: 7, group: 'Ersättningar' },
  { number: '7320', name: 'Skattefria bilersättningar', type: 'expense', class: 7, group: 'Ersättningar' },
  { number: '7330', name: 'Övriga skattefria ersättningar', type: 'expense', class: 7, group: 'Ersättningar' },
  { number: '7350', name: 'Skattepliktiga traktamenten', type: 'expense', class: 7, group: 'Ersättningar' },
  { number: '7380', name: 'Kostnader för förmåner', type: 'expense', class: 7, group: 'Ersättningar' },
  { number: '7385', name: 'Friskvårdsbidrag', type: 'expense', class: 7, group: 'Ersättningar', isCommon: true },
  
  // 75xx - Sociala avgifter
  { number: '7510', name: 'Arbetsgivaravgifter', type: 'expense', class: 7, group: 'Sociala avgifter', isCommon: true },
  { number: '7511', name: 'Lagstadgade sociala avgifter', type: 'expense', class: 7, group: 'Sociala avgifter', isCommon: true },
  { number: '7519', name: 'Sociala avgifter för semester- och löneskuld', type: 'expense', class: 7, group: 'Sociala avgifter' },
  { number: '7530', name: 'Särskild löneskatt', type: 'expense', class: 7, group: 'Sociala avgifter' },
  { number: '7533', name: 'Särskild löneskatt på pensionskostnader', type: 'expense', class: 7, group: 'Sociala avgifter' },
  { number: '7550', name: 'Pensionskostnader', type: 'expense', class: 7, group: 'Sociala avgifter', isCommon: true },
  { number: '7570', name: 'Egenavgifter', type: 'expense', class: 7, group: 'Sociala avgifter', isCommon: true },
  { number: '7580', name: 'Gruppförsäkringspremier', type: 'expense', class: 7, group: 'Sociala avgifter' },
  
  // 76xx - Övriga personalkostnader
  { number: '7600', name: 'Övriga personalkostnader', type: 'expense', class: 7, group: 'Övriga personalkostnader' },
  { number: '7610', name: 'Utbildning', type: 'expense', class: 7, group: 'Övriga personalkostnader', isCommon: true },
  { number: '7620', name: 'Sjuk- och hälsovård', type: 'expense', class: 7, group: 'Övriga personalkostnader' },
  { number: '7630', name: 'Personalrepresentation', type: 'expense', class: 7, group: 'Övriga personalkostnader' },
  { number: '7690', name: 'Övriga personalkostnader', type: 'expense', class: 7, group: 'Övriga personalkostnader' },
  
  // 78xx - Avskrivningar
  { number: '7810', name: 'Avskrivningar på immateriella tillgångar', type: 'expense', class: 7, group: 'Avskrivningar' },
  { number: '7820', name: 'Avskrivningar på byggnader', type: 'expense', class: 7, group: 'Avskrivningar' },
  { number: '7830', name: 'Avskrivningar på maskiner och inventarier', type: 'expense', class: 7, group: 'Avskrivningar', isCommon: true },
  { number: '7832', name: 'Avskrivningar på inventarier', type: 'expense', class: 7, group: 'Avskrivningar', isCommon: true },
  { number: '7834', name: 'Avskrivningar på bilar', type: 'expense', class: 7, group: 'Avskrivningar' },
  { number: '7835', name: 'Avskrivningar på datorer', type: 'expense', class: 7, group: 'Avskrivningar' },
  
  // ============================================
  // 8xxx - FINANSIELLA POSTER
  // ============================================
  
  // 80xx-82xx - Finansiella intäkter
  { number: '8010', name: 'Utdelning på andelar i koncernföretag', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  { number: '8020', name: 'Utdelning på andelar i intresseföretag', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  { number: '8050', name: 'Utdelning på andra andelar', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  { number: '8110', name: 'Ränteintäkter från koncernföretag', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  { number: '8210', name: 'Utdelning på andelar', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  { number: '8220', name: 'Resultat vid försäljning av värdepapper', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  { number: '8250', name: 'Valutakursvinster', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  { number: '8310', name: 'Ränteintäkter', type: 'revenue', class: 8, group: 'Finansiella intäkter', isCommon: true },
  { number: '8311', name: 'Ränteintäkter från bank', type: 'revenue', class: 8, group: 'Finansiella intäkter', isCommon: true },
  { number: '8314', name: 'Skattefria ränteintäkter', type: 'revenue', class: 8, group: 'Finansiella intäkter' },
  
  // 83xx-84xx - Finansiella kostnader
  { number: '8410', name: 'Räntekostnader till kreditinstitut', type: 'expense', class: 8, group: 'Finansiella kostnader', isCommon: true },
  { number: '8420', name: 'Räntekostnader till koncernföretag', type: 'expense', class: 8, group: 'Finansiella kostnader' },
  { number: '8422', name: 'Dröjsmålsräntor på leverantörsskulder', type: 'expense', class: 8, group: 'Finansiella kostnader' },
  { number: '8423', name: 'Räntekostnader till skatteverket', type: 'expense', class: 8, group: 'Finansiella kostnader' },
  { number: '8450', name: 'Valutakursförluster', type: 'expense', class: 8, group: 'Finansiella kostnader' },
  
  // 87xx-88xx - Bokslutsdispositioner
  { number: '8710', name: 'Avsättning till periodiseringsfond', type: 'expense', class: 8, group: 'Bokslutsdispositioner' },
  { number: '8720', name: 'Återföring från periodiseringsfond', type: 'revenue', class: 8, group: 'Bokslutsdispositioner' },
  { number: '8810', name: 'Förändring av överavskrivningar', type: 'expense', class: 8, group: 'Bokslutsdispositioner' },
  { number: '8850', name: 'Förändring av ersättningsfond', type: 'expense', class: 8, group: 'Bokslutsdispositioner' },
  
  // 89xx - Skatter
  { number: '8910', name: 'Skatt på årets resultat', type: 'expense', class: 8, group: 'Skatter', isCommon: true },
  { number: '8920', name: 'Skatt på tidigare års resultat', type: 'expense', class: 8, group: 'Skatter' },
  { number: '8980', name: 'Övriga skatter', type: 'expense', class: 8, group: 'Skatter' },
  { number: '8999', name: 'Årets resultat', type: 'equity', class: 8, group: 'Resultat', isCommon: true },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get an account by number
 */
export function getAccount(accountNumber: string): Account | undefined {
  return basAccounts.find(a => a.number === accountNumber);
}

/**
 * Search accounts by name or number
 */
export function searchAccounts(query: string): Account[] {
  const lowerQuery = query.toLowerCase();
  return basAccounts.filter(a => 
    a.number.includes(query) || 
    a.name.toLowerCase().includes(lowerQuery) ||
    a.group.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all common/frequently used accounts
 */
export function getCommonAccounts(): Account[] {
  return basAccounts.filter(a => a.isCommon);
}

/**
 * Get accounts by class (1-8)
 */
export function getAccountsByClass(accountClass: AccountClass): Account[] {
  return basAccounts.filter(a => a.class === accountClass);
}

/**
 * Get accounts by type
 */
export function getAccountsByType(type: AccountType): Account[] {
  return basAccounts.filter(a => a.type === type);
}

/**
 * Get accounts grouped by their group name
 */
export function getAccountsGrouped(): Record<string, Account[]> {
  return basAccounts.reduce((acc, account) => {
    if (!acc[account.group]) {
      acc[account.group] = [];
    }
    acc[account.group].push(account);
    return acc;
  }, {} as Record<string, Account[]>);
}

/**
 * Get VAT accounts
 */
export function getVatAccounts(): Account[] {
  return basAccounts.filter(a => a.vatCode);
}

/**
 * Check if an account is a debit-increase account (assets & expenses)
 */
export function isDebitIncrease(account: Account): boolean {
  return account.type === 'asset' || account.type === 'expense';
}

/**
 * Check if an account is a credit-increase account (liabilities, equity & revenue)
 */
export function isCreditIncrease(account: Account): boolean {
  return account.type === 'liability' || account.type === 'equity' || account.type === 'revenue';
}

// ============================================
// Account Class Labels
// ============================================

export const accountClassLabels: Record<AccountClass, string> = {
  1: 'Tillgångar',
  2: 'Eget kapital och skulder',
  3: 'Rörelseintäkter',
  4: 'Kostnader för varor/material',
  5: 'Övriga externa kostnader',
  6: 'Övriga externa kostnader',
  7: 'Personalkostnader',
  8: 'Finansiella poster',
};

export const accountTypeLabels: Record<AccountType, string> = {
  asset: 'Tillgång',
  liability: 'Skuld',
  equity: 'Eget kapital',
  revenue: 'Intäkt',
  expense: 'Kostnad',
};
