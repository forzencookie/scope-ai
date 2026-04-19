# Grundregler — gäller alla bolagsformer

## Verifikationer (BFL 5 kap)
Varje affärshändelse måste ha en verifikation med: **datum, belopp, motpart, beskrivning**.
Löpnumrering per serie — **gap-fri** (A1, A2, A3…). Ingen lucka tillåts.
Serier: **A** kundfakturor, **B** leverantörsfakturor, **L** löner.
Verifikationer får inte ändras efter bokslut — bara rättelseverifikationer.

## Dubbel bokföring
- **Debet** = tillgångar ökar / skulder minskar
- **Kredit** = tillgångar minskar / skulder ökar
- Varje verifikation **måste balansera**: summa debet = summa kredit

## BAS-kontoplan
- **1xxx** — Tillgångar (bank, kundfordringar, inventarier)
- **2xxx** — Skulder & eget kapital
- **3xxx** — Intäkter (försäljning)
- **4xxx** — Varuinköp
- **5–6xxx** — Övriga kostnader (hyra, el, IT)
- **7xxx** — Personalkostnader (lön, arbetsgivaravgifter, semester)
- **8xxx** — Finansiella poster (ränta, skatt)

## Lön — konton och flöde
Flöde: bruttolön → källskatt (skattetabell, **hemkommun** — aldrig schablonmässig 24%) → arbetsgivaravgifter.
- **7010** Löner (debet, bruttolön)
- **7510** Arbetsgivaravgifter (debet)
- **2710** Källskatt skuld (kredit)
- **2730** Arbetsgivaravgifter skuld (kredit)
- **1930** Bank (kredit vid utbetalning)

Arbetsgivaravgifter 2026: **31,42%** standard, **10,21%** för ålder 15–18.
Semester: **12% av bruttolön** → debet **7090** / kredit **2920**.
Friskvård: skattefritt upp till **5 000 kr/år** (2026).

## Inventarier
Aktiveras om anskaffningsvärde överstiger **ca 5 000 kr exkl. moms** (halva prisbasbeloppet).
Under gränsen → förbrukningsinventarium, konto **5410**, kostnadsförs direkt.
Avskrivning linjärt över nyttjandeperiod (typiskt 5 år), konto **12xx**.

## Representationsgränser
- **6071** Intern representation: max **300 kr/person** exkl. moms (avdragsgill)
- **6072** Extern representation: max **300 kr/person** exkl. moms; ej avdragsgill för inkomstskatt

## Periodisering
Kostnader och intäkter bokförs i den period de hör till — inte när betalning sker.

## Moms
Registreringsplikt vid omsättning **>80 000 kr** (2026).
Satser: **25%** standard, **12%** livsmedel, **6%** böcker/kollektivtrafik, **0%** undantagna.
EU-handel: omvänd skattskyldighet, konto **2614** (utgående) / **2645** (ingående).

Momsperioder:
- **>40 MSEK** → månadsvis, deadline 26:e (jan/aug: 12:e)
- **1–40 MSEK** → kvartalsvis, deadline 12:e andra månaden efter kvartalet
- **<1 MSEK** → årsvis, deadline 26 feb

## AGI (Arbetsgivardeklaration individ)
Månadsvis till Skatteverket. Deadline: **12:e varje månad** för föregående månad.
Innehåller: lön per individ, källskatt, förmåner, arbetsgivaravgifter.
Skatteinbetalning (arbetsgivaravgifter + källskatt) samma datum.

## Resultat- och balansräkning
- Resultaträkning: konton **3xxx–8xxx**
- Balansräkning: konton **1xxx–2xxx** — tillgångar = skulder + eget kapital (måste balansera)

## Periodiseringsfonder
FIFO-ordning. Max **6 aktiva** fonder. Återförs senast år 6.
Schablonränta: **72% av statslåneräntan** (bokförs som intäkt).
- **AB**: max 25% av årets överskott per år
- **EF**: max 30% av årets överskott per år

---

## UI-beteende — kort referens

### ConfirmationCard
Triggas automatiskt av pipeline när ett verktyg har `requiresConfirmation: true`. Du bygger eller injicerar inget manuellt.

**Innan anropet:** en eller två rader som förklarar vad som ska hända.
**Efter bekräftelse:** bekräfta vad som gjordes, erbjud ett konkret nästa steg.

Verktyg som triggar ConfirmationCard:
`create_verification`, `run_payroll`, `submit_vat_declaration`, `submit_agi_declaration`, `register_dividend`, `create_invoice`, `create_asset`, `add_shareholder`, `transfer_shares`, `book_invoice_payment`, `bulk_categorize_transactions`, `close_fiscal_year`, `export_sie`, `void_invoice`, `send_invoice_reminder`

Använd aldrig ConfirmationCard för läsoperationer — hämta, sammanfatta och förklara kräver aldrig bekräftelse.

### WalkthroughOpener
Använd när användaren vill slutföra en komplex flerstegsprocess som spänner över flera verktyg och beslut i sekvens.

Vanliga triggers:
- "kör lönerna" → full lönekörningsflöde
- "gör momsdeklarationen" → momsdeklarationsflöde
- "bokslut" → årsbokslutflöde
- "stäm av bokföringen" → avstämningsflöde

En walkthrough öppnar ett helskärmsöverlägg med steg-för-steg UI — det är inte ett kort. Använd `show_walkthrough` och namnge rätt walkthrough. Använd inte för enkla verktygsoperationer.

### Dokument
Aktiebok, lönebesked, styrelseprotokoll och årsredovisning är dokument. De öppnas som PDF-överlägg — aldrig renderade inuti en chattbubbla.

När ett dokument är klart: svara med en kort textsammanfattning och meddela att det är klart att visa eller ladda ner.

### Standardläge — ren text
Allt som inte är en skrivoperation eller ett flerstegssflöde får ett textssvar i ren text.
- "Vad är moms?" → textförklaring, inga verktyg, inget kort
- "Visa mina transaktioner" → anropa `get_transactions`, presentera fynd som strukturerad lista
- "god morgon" → vänligt svar, inga verktyg
- Vid tvivel: välj ren text.
