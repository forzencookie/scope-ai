# AI Conversation Scenarios

Realistic human–AI conversations showing how users interact with Scope's AI companion. Each scenario demonstrates when the AI should respond in chat (Mode A), show a dynamic walkthrough (Mode C), or show a fixed walkthrough (Mode B).

Users treat the AI as a knowledgeable companion — not an autocomplete robot. Most conversations start casual and escalate toward action.

---

## Bokföring

### Transaktioner

**Scenario 1 — New user, first time, confused**

```
Användare: hej jag är ny här, jag har kopplat mitt bankkonto men nu ser jag
           massa transaktioner som är röda eller gula, vad ska jag göra med dem?

AI:        Hej! De färgade statusarna betyder:
           • Röd/gul ("Ej bokförd") = transaktioner som behöver ett konto
           • Grön ("Bokförd") = klara, inget att göra

           Du har just nu 34 obokförda transaktioner. Jag kan hjälpa dig
           kontera dem — jag föreslår konton baserat på leverantörsnamn
           och belopp, sen godkänner du.

           Vill du att jag börjar med de senaste?

Användare: ja men jag fattar inte vad kontera betyder ens

AI:        Att kontera = att tala om vilken kategori en utgift eller intäkt
           tillhör. T.ex. "Spotify 169 kr" → konto 6993 (IT-tjänster).

           Det påverkar din resultaträkning och hur mycket skatt du betalar.
           Du behöver inte kunna kontonumren — jag föreslår och du säger ja
           eller nej.

           Ska vi köra?

Användare: okej kör

AI:        → [DYNAMIC WALKTHROUGH: konteringsförslag med timeline,
           osäkra först, godkänn-knapp]
```

**Modes used:** A → A → C

---

**Scenario 2 — Experienced user, quick action**

```
Användare: kontera januari

AI:        → [DYNAMIC WALKTHROUGH: 12 nya transaktioner, 9 auto-matchade,
           3 behöver input, godkänn alla-knapp]
```

**Modes used:** C (direct)

---

**Scenario 3 — Specific question, no walkthrough needed**

```
Användare: vad är transaktion #3891?

AI:        Transaktion #3891:
           • Spotify AB — 169,00 kr
           • Datum: 2026-01-15
           • Status: Bokförd → konto 6993 (Övriga externa tjänster)
           • Verifikation: V2026-0028
```

**Modes used:** A only

---

**Scenario 4 — Problem solving**

```
Användare: jag kan inte stänga januari, det står att jag har saker kvar

AI:        Du har 3 transaktioner som blockerar månadsavslutet:

           1. Swish 2 500 kr (12 jan) — saknar konto
           2. Överföring 15 000 kr (18 jan) — saknar dokumentation
           3. Bankavgift 45 kr (31 jan) — saknar konto

           Vill du att jag konterar #1 och #3? Nr 2 behöver ett kvitto
           eller en anteckning om vad överföringen gäller.

Användare: ja kontera dem, överföringen var hyra

AI:        Klart! Jag bokförde:
           • Swish 2 500 kr → 6991 (Övriga kostnader)
           • Bankavgift 45 kr → 6570 (Bankavgifter)
           • Överföring 15 000 kr → 5010 (Lokalhyra)

           Alla 3 är nu bokförda. Du kan stänga januari.
```

**Modes used:** A → A (with actions)

---

**Scenario 5 — Bulk import, needs hand-holding**

```
Användare: jag har en csv från banken, hur laddar jag upp den?

AI:        Klicka på "Ny transaktion" → välj fliken "Massimport".
           Ladda upp din CSV-fil — den ska ha kolumner för datum,
           beskrivning och belopp. Jag läser formatet automatiskt.

           Vilken bank använder du? Då kan jag säga om formatet
           brukar fungera direkt.

Användare: handelsbanken

AI:        Handelsbanken CSV brukar fungera rakt av. Ladda upp så
           tittar jag igenom den. Jag konterar det jag känner igen
           och flaggar det jag är osäker på.

Användare: [laddar upp fil]

AI:        → [DYNAMIC WALKTHROUGH: 47 transaktioner importerade,
           38 auto-konterade, 9 behöver granskning]
```

**Modes used:** A → A → C

---

### Fakturor

**Scenario 1 — Newbie wants to invoice a client**

```
Användare: jag har gjort ett jobb åt en kund och behöver skicka en faktura,
           hur gör jag?

AI:        Du skapar en kundfaktura. Jag behöver veta:

           1. Kundens namn och organisationsnummer (eller personnummer)
           2. Vad du fakturerar för (t.ex. "Konsulttjänster december")
           3. Belopp exklusive moms

           Har du de uppgifterna? Eller vill du att jag skapar en mall
           som du fyller i?

Användare: kunden heter acme ab, 559123-4567, konsulttjänster 50 000 kr

AI:        → [FIXED WALKTHROUGH: faktura-förhandsgranskning med
           kunduppgifter, rad "Konsulttjänster — 50 000 kr exkl moms",
           moms 12 500 kr, totalt 62 500 kr, betalningsvillkor 30 dagar,
           knappar: Skapa utkast / Skapa & skicka / Stäng]
```

**Modes used:** A → B

---

**Scenario 2 — Overdue invoices**

```
Användare: har nån kund inte betalat?

AI:        Ja, 2 fakturor är förfallna:

           • #1042 Acme AB — 45 000 kr, förföll 10 jan (22 dagar sen)
           • #1039 Beta AB — 12 500 kr, förföll 5 jan (27 dagar sen)

           Totalt 57 500 kr utestående. Vill du att jag skickar
           betalningspåminnelser?

Användare: ja skicka till båda

AI:        Påminnelser skickade till:
           ✓ Acme AB (acme@example.com)
           ✓ Beta AB (info@beta.se)

           Jag meddelar dig om de betalar inom 7 dagar.
```

**Modes used:** A → A (with actions)

---

**Scenario 3 — Supplier invoice scanning**

```
Användare: jag fick en faktura från min leverantör, kan du läsa den?

AI:        Ladda upp fakturan som PDF eller bild så skannar jag den.

Användare: [laddar upp PDF]

AI:        Jag läste ut följande:

           • Leverantör: Office Depot AB
           • Fakturanr: F-2026-0891
           • Datum: 2026-01-22
           • Belopp: 3 450,00 kr exkl moms
           • Moms (25%): 862,50 kr
           • Att betala: 4 312,50 kr
           • Förfaller: 2026-02-21

           Ser det rätt ut?

Användare: ja stämmer

AI:        Sparat! Fakturan ligger nu under Leverantörsfakturor → Mottagen.
           Ska jag bokföra den direkt? Jag föreslår konto 6110
           (Kontorsmaterial).
```

**Modes used:** A → A → A (with actions)

---

**Scenario 4 — Understanding invoice flow**

```
Användare: vad betyder attestera? jag ser det på en leverantörsfaktura

AI:        Attestera = godkänna att fakturan ska betalas. Det är en
           kontrollpunkt innan betalning:

           1. Faktura inkommer → "Mottagen"
           2. Du granskar och godkänner → "Attesterad"
           3. Du betalar → "Betald"

           Om du är ensam i bolaget kan du attestera direkt. I större
           bolag är det oftast chefen som attesterar andras inköp.
```

**Modes used:** A only

---

### Kvitton

**Scenario 1 — Lunch receipt with tax guidance**

```
Användare: jag åt lunch med en kund igår, ska jag spara kvittot?

AI:        Ja, om det var ett affärsmöte. Representation (kundmåltid) är
           avdragsgill med moms upp till 300 kr/person exkl dryck.

           Ladda upp kvittot så skannar jag det. Skriv gärna en kort
           anteckning om vem du träffade och varför — det krävs vid
           revision.

Användare: [laddar upp bild]

AI:        Jag läste:
           • Restaurang Norrlandsgatan — 890,00 kr
           • Datum: 2026-01-30
           • Moms: 106,80 kr

           Jag kategoriserar som 6071 (Representation). Du var 2 personer
           så avdraget gäller (445 kr/person < maxgräns).

           Vem träffade du?

Användare: erik johansson på acme ab, vi diskuterade nytt avtal

AI:        Noterat: "Kundmöte med Erik Johansson, Acme AB — avtalsförhandling."
           Kvittot är sparat och bokfört. ✓
```

**Modes used:** A → A → A (with actions)

---

**Scenario 2 — Pile of receipts**

```
Användare: jag har typ 15 kvitton från hela månaden som jag inte orkat
           ladda upp, kan vi ta alla nu?

AI:        Absolut. Ladda upp alla bilder eller PDF:er samtidigt så
           skannar jag dem i bulk. Jag sorterar ut vad jag kan läsa
           automatiskt och flaggar de jag behöver hjälp med.

Användare: [laddar upp 15 filer]

AI:        → [DYNAMIC WALKTHROUGH: photo-grid med 15 kvitton,
           12 fullständigt lästa, 3 behöver manuell input,
           godkänn alla-knapp]
```

**Modes used:** A → C

---

**Scenario 3 — Tax question about a purchase**

```
Användare: jag köpte ett skrivbord för 8000 kr, ska det bokföras som
           inventarie eller kostnad?

AI:        Det beror på beloppet och livslängden:

           • Under halva prisbasbeloppet (28 650 kr för 2026):
             Du FÅR kostnadsföra direkt (konto 5410 Förbrukningsinventarier)
           • Över det: ska bokföras som tillgång och skrivas av

           8 000 kr är under gränsen, så du kan kostnadsföra direkt.
           Men om du vill ha det som tillgång (för bättre balansräkning)
           går det också.

           Vad föredrar du?

Användare: kostnadsför direkt

AI:        Klart, jag bokför kvittot som 5410 (Förbrukningsinventarier),
           8 000 kr exkl moms. ✓
```

**Modes used:** A → A (with action)

---

**Scenario 4 — Missing receipts worry**

```
Användare: jag har tappat bort ett kvitto, vad händer nu?

AI:        Inget kvitto = inget momsavdrag vid revision. Men du har
           några alternativ:

           1. Be butiken om en kopia (de flesta kan skriva ut igen)
           2. Om det inte går: bokför kostnaden ändå men utan momsavdrag
           3. Skriv en egenupprättad handling med datum, belopp, vad
              du köpte och varför kvittot saknas

           Hur stort var beloppet? Om det är under 300 kr brukar
           Skatteverket inte bråka om det saknas enstaka kvitton.
```

**Modes used:** A only

---

### Inventarier

**Scenario 1 — New asset registration**

```
Användare: vi köpte en ny server för 45 000 kr, hur registrerar jag den?

AI:        Eftersom 45 000 kr överstiger halva prisbasbeloppet ska den
           bokföras som tillgång. Jag behöver veta:

           • Inköpsdatum
           • Ekonomisk livslängd (servrar brukar vara 5 år)

           Datum?

Användare: köpte den 15 januari, 5 år låter bra

AI:        Registrerat:
           • Server — 45 000 kr exkl moms
           • Inköp: 2026-01-15
           • Livslängd: 5 år
           • Årlig avskrivning: 9 000 kr (linjär)
           • Bokfört restvärde idag: 45 000 kr

           Första avskrivningen bokförs vid årsbokslutet. Vill du se hela
           avskrivningsplanen?

Användare: ja

AI:        → [FIXED WALKTHROUGH: avskrivningsplan med calculation-block,
           5 rader med ingående/avskrivning/utgående per år]
```

**Modes used:** A → A → B

---

**Scenario 2 — Selling an asset**

```
Användare: vi säljer vår gamla bil, den bokfördes för 180 000 men vi
           säljer för 95 000, hur hanterar jag det?

AI:        Vi behöver göra en utrangeringsbokning. Låt mig kolla
           bilens bokförda värde...

           Bil (reg ABC123):
           • Anskaffning: 180 000 kr (2022-06-01)
           • Ackumulerad avskrivning: 108 000 kr
           • Bokfört restvärde: 72 000 kr

           Försäljning 95 000 kr − restvärde 72 000 kr = vinst 23 000 kr.

           Vinsten bokförs på konto 3973 (Vinst vid avyttring av
           materiella anläggningstillgångar).

           Ska jag skapa verifikationen?

Användare: ja gör det

AI:        Klart! Verifikation V2026-0058 skapad:
           Debet  1930 Företagskonto           95 000 kr
           Debet  1219 Ack avskr bilar        108 000 kr
           Kredit 1210 Bilar                  180 000 kr
           Kredit 3973 Vinst avyttring         23 000 kr

           Bilen är borttagen ur tillgångsregistret.
```

**Modes used:** A → A (with actions)

---

### Verifikationer

**Scenario 1 — Understanding a verification**

```
Användare: jag ser verifikation V2026-0042 men fattar inte vad den gäller

AI:        Verifikation V2026-0042:
           • Datum: 2026-01-15
           • Beskrivning: "Hyra januari — Fastighets AB"

           Bokföring:
           Debet  5010 Lokalhyra          15 000,00 kr
           Kredit 1930 Företagskonto       15 000,00 kr

           Skapades automatiskt från transaktion #3847 (bankbetalning
           till Fastighets AB). Kvitto bifogat.
```

**Modes used:** A only

---

**Scenario 2 — Manual journal entry**

```
Användare: jag behöver bokföra en periodisering, hyran för februari
           betalades redan i januari

AI:        Då gör vi en förutbetald kostnad. Jag skapar verifikationen:

           V2026-0063 — "Periodisering hyra februari"
           Debet  1710 Förutbetalda kostnader    15 000 kr
           Kredit 5010 Lokalhyra                  15 000 kr

           Sen i februari återförs den automatiskt. Vill du att jag
           bokför?

Användare: ja men förklara varför vi gör detta

AI:        Bokföringsprincipen säger att kostnader ska bokföras i den
           period de hör till. Hyran för februari är en februarikostnad —
           även om pengarna lämnade kontot i januari.

           Genom periodiseringen:
           • Januari visar rätt kostnad (ingen dubbelhyra)
           • Februari visar sin hyra
           • Resultaträkningen blir korrekt per månad

           Ska jag bokföra nu?

Användare: ja kör

AI:        ✓ V2026-0063 bokförd. Automatisk återföring schemalagd 2026-02-01.
```

**Modes used:** A → A → A (with action)

---

### Månadsavslut

**Scenario 1 — First time closing a month**

```
Användare: jag ska stänga januari för första gången, vad behöver jag göra?

AI:        Månadsavslut innebär att du kontrollerar att allt stämmer
           innan du låser perioden. Fyra steg:

           1. **Bankavstämning** — kontrollera att saldot i bokföringen
              matchar ditt kontoutdrag
           2. **Momsredovisning** — se till att momsrapporten är klar
           3. **AGI** — om du har anställda, kolla att löner och avgifter
              är bokförda
           4. **Inga okonterade** — inga transaktioner kvar utan konto

           Du har just nu 3 okonterade transaktioner som blockerar.
           Vill du att vi fixar dem först?

Användare: ja

AI:        [hanterar transaktionerna i chat...]

           Klart! Alla transaktioner i januari är bokförda.
           Vill du att jag kör en avstämningskoll?

Användare: ja kör

AI:        → [FIXED WALKTHROUGH: checklist med bankavstämning ✓,
           momsredovisning ✓, AGI ✓, inga okonterade ✓,
           knapp: "Lås januari 2026"]
```

**Modes used:** A → A → B

---

**Scenario 2 — Discrepancy found**

```
Användare: jag försökte stänga men banksaldot stämmer inte

AI:        Låt mig kolla. Bokfört saldo konto 1930: 245 320,00 kr.
           Vad visar ditt kontoutdrag?

Användare: 246 120 kr

AI:        Differens: 800,00 kr (kontoutdraget visar mer).

           Det betyder att det sannolikt finns en insättning eller
           intäkt som inte är bokförd. Låt mig söka...

           Hittade: Swish-inbetalning 800,00 kr den 29 jan från
           "Karin Lindström" — inte bokförd.

           Ska jag bokföra den? Vet du vad den gäller?

Användare: det var betalning för faktura #1044

AI:        Perfekt. Jag bokför:
           Debet  1930 Företagskonto         800,00 kr
           Kredit 1510 Kundfordringar        800,00 kr

           Och markerar faktura #1044 som betald. ✓

           Bankavstämning stämmer nu. Vill du fortsätta med månadsstängningen?
```

**Modes used:** A → A → A → A (escalation to B when ready)

---

**Scenario 3 — Understanding what locking means**

```
Användare: vad händer egentligen om jag låser en månad? kan jag ångra det?

AI:        När du låser en månad:
           • Inga nya transaktioner kan bokföras i den perioden
           • Befintliga verifikationer kan inte ändras
           • Det skapar en revisionslogg ("januari låst av [dig] den [datum]")

           Du KAN låsa upp igen om det behövs — men det syns i loggen.
           Revisorer gillar att perioder låses löpande, det visar att
           bokföringen är ordnad.

           Tumregel: stäng varje månad inom 1-2 veckor efter månadsskifte.
```

**Modes used:** A only

---

## Rapporter

_[To be added]_

## Löner

_[To be added]_

## Ägare & Styrning

_[To be added]_

## Händelser

_[To be added]_

## Företagsstatistik

_[To be added]_
