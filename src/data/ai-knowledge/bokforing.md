# Bokforing - Kunskapsdokument

## BFL (Bokforingslagen)

### Verifikationer
- Varje affarshandelse MASTE ha en verifikation (BFL 5 kap)
- Verifikationen ska innehalla: datum, belopp, motpart, beskrivning
- Lopnumrering i serier: A (kundfakturor), B (leverantorsfakturor), L (loner), etc.
- **Gap-fri numrering** — A1, A2, A3... Inga luckor tillats
- Verifikationer far INTE andras efter bokslut — bara rattelseverifikationer

### Dubbel bokforing
- Alla foretagsformer utom de minsta EF (under 3 MSEK) maste anvanda dubbel bokforing
- Debet = tillgangar okar, skulder minskar
- Kredit = tillgangar minskar, skulder okar
- Varje verifikation MASTE vara balanserad: summa debet = summa kredit

### BAS Kontoplan
- 1xxx: Tillgangar (bank, kundfordringar, inventarier)
- 2xxx: Skulder & eget kapital (leverantorsskulder, moms, lon)
- 3xxx: Intakter (forsaljning)
- 4xxx: Varuinkop
- 5-6xxx: Ovriga kostnader (hyra, el, telefon, IT)
- 7xxx: Personalkostnader (lon, arbetsgivaravgifter, semester)
- 8xxx: Finansiella poster (ranta, skatt)

## Sidor i Scope

### Transaktioner
- Banktransaktioner synkade fran bank (eller manuellt inlagda)
- AI-matchning mot BAS konton
- Status: Obokford → Konterad → Bokford

### Fakturor (Leverantor)
- Leverantorsfakturor med forfallodag
- Konto 2440 (Leverantorsskulder) krediteras vid registrering
- Konto 2440 debiteras + 1930 krediteras vid betalning

### Kvitton
- Fotade/uppladdade kvitton
- OCR-lasning for belopp, datum, leverantor
- Kopplas till transaktion eller skapar ny verifikation

### Inventarier
- Tillgangar over halvar (5000 kr exkl moms)
- Konto 12xx (Maskiner/Inventarier)
- Avskrivning over nyttjandeperiod (typiskt 5 ar, ratlinjear)
- Restvarde vid forsaljning/skrotning

### Verifikationer
- Sammanstallning av alla bokforda poster
- Seri + lopnummer
- Kan exporteras som SIE4-fil

## Vanliga gotchas
- Representation (6071/6072): Max 300 kr/person exkl moms for intern, extern ar ej avdragsgill for inkomstskatt
- Forbrukningsinventarier (5410): Under halvarsbeloppet — kostnadsfor direkt
- Periodisering: Kostnader/intakter ska bokforas i ratt period, inte nar betalning sker
