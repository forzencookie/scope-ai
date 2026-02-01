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

### Momsdeklaration

### Momsdeklaration

**Scenario 1 — Beginner (The Anxious & Unsure)**
*Focus: Reassurance, education, step-by-step guidance.*

```
Användare: jag fick brev om moms, vad ska jag göra?
 
AI:        Ingen fara, det gäller din momsdeklaration för kvartal 3.
           Vi ska bara rapportera skillnaden mellan momsen du fått in (när du sålt)
           och momsen du betalat (när du köpt).
           
           Jag har förberett siffrorna:
           • Försäljning: 150 000 kr
           • Moms att betala: 37 500 kr
           • Moms att dra av: 10 000 kr
           • Att betala in: 27 500 kr
           
           Ska vi titta på detaljerna tillsammans så du ser att allt stämmer?
```

**Modes used:** A → A (Edu) → C

---

**Scenario 2 — Intermediate (Verification & Action)**
*Focus: Efficiency, identifying anomalies, confirming correctness.*

```
Användare: dags för momsen, ser det rimligt ut?
 
AI:        Ja, det ser normalt ut för perioden 2026-01.
           
           Försäljning: 450 000 kr (Moms 112 500 kr)
           Inköp: 180 000 kr (Moms 45 000 kr)
           Att betala: 67 500 kr
           
           Enda avvikelsen är en ovanligt hög ingående moms den 15:e,
           kopplat till inköpet av servern.
           
           Vill du att jag skapar filen för uppladdning till Skatteverket?
```

**Modes used:** A only

---

**Scenario 3 — Professional (Specific & Technical)**
*Focus: Speed, specific account reconciliation, edge cases.*

```
Användare: bokför momsen för Q4, skapa XML och stäm av konto 2650
 
AI:        Momsrapport Q4 skapad.
           • Utgående: 125 000 kr
           • Ingående: 62 000 kr
           • Att betala: 63 000 kr
           
           Konto 2650 (Momsredovisningskonto) är nu nollställt och saldot
           flyttat till 1630 (Skattekonto).
           
           XML-filen är redo. Jag hittade även en EU-försäljning som hamnar
           i ruta 35, vill du dubbelkolla periodiska sammanställningen för den?
```

**Modes used:** A → A (Action)

---

### Resultaträkning

**Scenario 1 — Beginner (Confusion about Profit vs Cash)**
*Focus: Explaining concepts, bridging the gap between bank balance and accounting.*

```
Användare: jag har pengar på kontot men rapporten säger att jag går back?
 
AI:        Det beror på att du köpte maskinen kontant för 85 000 kr.
           I bokföringen räknas hela den summan som en kostnad direkt nu,
           vilket drar ner resultatet rejält denna månad.
           
           Vill du att vi ska "periodisera" den? Då delar vi upp kostnaden
           över 5 år istället. Då kommer resultatet se bättre ut och spegla
           verkligheten bättre.
```

**Modes used:** A → A (Edu/Action)

---

**Scenario 2 — Intermediate (Analysis & Trends)**
*Focus: Understanding drivers, comparing against budget/history.*

```
Användare: varför är personalkostnaderna högre den här månaden?
 
AI:        De är 15% högre än snittet. Det beror på två saker:
           1. Semesterersättning betalades ut till Anna (12 000 kr).
           2. Arbetsgivaravgifterna justerades upp något baserat på
              den totala lönesumman.
              
           Justerat för semesterersättningen ligger du exakt på budget.
```

**Modes used:** A only

---

**Scenario 3 — Professional (Key Ratios & Adjustments)**
*Focus: Margins, EBITDA, specific adjustments.*

```
Användare: vad är vår bruttomarginal hittills i år, exklusive engångsposter?
 
AI:        Bruttomarginalen ligger på 68%.
           
           Om vi exkluderar engångskostnaden för varumärkesbytet i januari
           (50 000 kr), så landar den underliggande marginalen på 72%.
           
           Det är 4 procentenheter bättre än samma period förra året.
```

**Modes used:** A only

---

### Balansräkning

**Scenario 1 — Beginner (Can I afford it?)**
*Focus: Practical advice, liquidity check.*

```
Användare: har vi råd att köpa nya datorer för 50k?
 
AI:        Du har 90 000 kr på kontot, men kom ihåg att momsen på 35 000 kr
           ska dras den 12:e. Då har du bara 55 000 kr kvar.
           
           Det blir väldigt tajt om du köper datorerna nu. Kan du vänta tills
           kundfakturan från Acme AB (45 000 kr) kommer in nästa vecka?
```

**Modes used:** A only

---

**Scenario 2 — Intermediate (Clean-up & Health)**
*Focus: Fixing specific accounts, preparing for closing.*

```
Användare: stämmer balansräkningen inför månadsavslutet?
 
AI:        Det mesta ser bra ut, men konto 1630 (Skattekonto) difftar
           med 5 kr mot kontoutdraget. Sannolikt en räntejustering.
           
           Dessutom ligger det en okänd inbetalning på "Obs-kontot"
           som vi måste placera rätt innan vi kan stänga.
```

**Modes used:** A only

---

**Scenario 3 — Professional (Optimization & Amortization)**
*Focus: Equity ratios, depreciation schedules, strategic planning.*

```
Användare: hur ser soliditeten ut och vad händer om vi gör en utdelning på 100k?
 
AI:        Just nu är soliditeten 42%.
           
           Om du gör en utdelning på 100 000 kr sjunker eget kapital,
           och soliditeten landar på ca 35%.
           
           Det är fortfarande över bankens krav på 30%, så det bör inte
           påverka era lånevillkor. Vill du att jag förbereder underlaget för
           stämman?
```

**Modes used:** A → A (Action)


## Löner

## Löner

### Lönebesked

**Scenario 1 — Beginner (The "First Time" Anxiety)**
*Focus: Hand-holding through the monthly routine, explaining terms.*

```
Användare: dags att göra lönerna för februari, jag har aldrig gjort det själv förut
 
AI:        Ingen fara, jag hjälper dig!
           
           Vi har två anställda att betala ut till:
           1. Anna Andersson (VD)
           2. Erik Eriksson (Utvecklare)
           
           Ska vi utgå från deras vanliga månadslöner? Då räknar jag ut
           skatt och arbetsgivaravgifter automatiskt enligt tabell 31.
           
           Ska jag göra ett utkast?
```

**Modes used:** A → A (Action)

---

**Scenario 2 — Intermediate (Handling Changes)**
*Focus: Efficiency, handling exceptions like sick leave or bonuses.*

```
Användare: gör lönerna för mars men lägg till 5000 i bonus till Erik
 
AI:        Uppfattat.
           
           Erik får:
           • Grundlön: 40 000 kr
           • Bonus: 5 000 kr
           • Total bruttolön: 45 000 kr
           
           Anna ligger kvar på 45 000 kr.
           
           Total lönekostnad för företaget (inkl avgifter): 118 281 kr.
           
           Ska jag bokföra och skicka lönespecarna?
```

**Modes used:** A → A (Action)

---

**Scenario 3 — Professional (Tax & AGI compliance)**
*Focus: Verification of tax files, technical reconciliation.*

```
Användare: skapa AGI för februari och stäm av mot skattekontot
 
AI:        AGI-filen för februari är skapad.
           
           • Arbetsgivaravgifter: 26 690 kr
           • Avdragen skatt: 20 400 kr
           • Att betala 12 mars: 47 090 kr
           
           Saldot på skattekontot matchar (47 090 kr reserverat).
           Verifiera XML-filen och markera som inskickad?
```

**Modes used:** A → A (Action)

---

### Utdelning & 3:12

**Scenario 1 — Beginner (Understanding Concepts)**
*Focus: Education about rules and possibilities.*

```
Användare: får jag ta ut utdelning i år?
 
AI:        Ja, om ditt bolag går med vinst och har sparat kapital!
           
           Enligt 3:12-reglerna (förenklingsregeln) får du ta ut ca 204 325 kr (2026)
           till låg skatt (20%).
           
           Det kräver att vi har fritt eget kapital i balansräkningen.
           Ska vi kolla hur mycket som finns tillgängligt?
```

**Modes used:** A → A (Edu)

---

**Scenario 2 — Intermediate/Professional (Optimization)**
*Focus: Calculating detailed limits (Main rule vs Simplification rule).*

```
Användare: vad blir mitt gränsbelopp i år om jag kör huvudregeln?
 
AI:        Låt oss räkna på löneunderlaget.
           
           Bolagets totala löner 2025 var: 1 020 000 kr.
           50% av löneunderlaget ger ett utrymme på 510 000 kr.
           
           Huvudregeln (510 000 kr) är alltså mycket bättre än förenklingsregeln
           (204 325 kr) för dig i år.
           
           Vi bör spara det utrymmet i K10:an. Ska jag förbereda underlaget?
```

**Modes used:** A → A (Action)

## Ägare & Styrning

### Aktiebok

**Scenario 1 — Beginner (The Basics)**
*Focus: Explaining what a cap table is and why it matters.*

```
Användare: måste jag föra aktiebok? jag äger ju 100% själv
 
AI:        Ja, enligt lag (Aktiebolagslagen) måste alla aktiebolag ha en aktiebok.
           Det är "beviset" på vem som äger bolaget.
           
           Just nu har vi registrerat:
           • Ägare: Du (100%)
           • Antal aktier: 25 000 st (Klass A)
           • Aktiekapital: 25 000 kr
           
           Ska jag generera en PDF-utskrift som du kan signera och spara i
           "bolagspärmen"?
```

**Modes used:** A → A (Action)

---

**Scenario 2 — Intermediate (Transaction)**
*Focus: Selling shares to a partner.*

```
Användare: jag ska sälja 10% av bolaget till en partner, hur gör jag?
 
AI:        Spännande! Då gör vi en överlåtelse.
           
           10% motsvarar 2 500 aktier.
           
           Jag behöver veta:
           1. Vem är köparen? (Namn & personnummer)
           2. Transaktionsdatum?
           3. Pris per aktie? (För din privata deklaration, K10)
           
           Ska jag förbereda överlåtelsen i aktieboken?
```

**Modes used:** A → A (Action)

---

**Scenario 3 — Professional (New Share Issue)**
*Focus: New issue (nyemission), valuation, and dilution.*

```
Användare: registrera en nyemission på 5000 B-aktier till Investors AB
 
AI:        Registrerar nyemission.
           
           • Före: 25 000 aktier.
           • Efter: 30 000 aktier.
           • Utspädning för befintliga ägare: 16,7%.
           
           Kom ihåg att ladda upp det registrerade beviset från Bolagsverket
           när det är klart. Vill du att jag uppdaterar röstlängden inför
           nästa stämma automatiskt?
```

**Modes used:** A → A (Action)

---

### Styrelsemöte

**Scenario 1 — Beginner (Formalities)**
*Focus: Helping the "solo-preneur" hold a correct meeting.*

```
Användare: måste jag ha styrelsemöte?
 
AI:        Minst en gång om året (konstituerande möte) efter årsstämman.
           Men det är bra att ha "protokollförda beslut" om viktiga saker,
           t.ex. om bolaget ska skriva på ett stort hyresavtal eller ta lån.
           
           Jag har en mall för "Enkelt styrelseprotokoll" där du är ensam ledamot.
           Vill du se den?
```

**Modes used:** A → A (Assets)

---

**Scenario 2 — Intermediate (Agenda & Documentation)**
*Focus: Structuring a real meeting.*

```
Användare: förbered ett styrelsemöte om att köpa en tjänstebil
 
AI:        Skapar utkast till styrelseprotokoll.
           
           Förslag på dagordning:
           1. Mötets öppnande
           2. Beslut om inköp av tjänstebil (Volvo EX30, max 600k)
           3. Finansiering (Leasingavtal med Santander)
           4. Firmateckning för avtalet
           
           Ska jag lägga till detta och skicka kallelse till suppleanten?
```

**Modes used:** A → A (Action)

---

**Scenario 3 — Professional (Minutes & Decisions)**
*Focus: Formalizing decisions and connecting to accounting.*

```
Användare: protokollför beslutet om vinstutdelning på 100k
 
AI:        Noterat i protokoll för Årsstämman 2026:
           
           §7 Vinstdisposition
           "Stämman beslutar att enligt styrelsens förslag dela ut
           100 000 kr till aktieägarna."
           
           När protokollet är justerat (signerat) kan jag boka upp skulden
           i bokföringen (Kredit 2898). Ska jag göra det nu eller vänta på signering?
```

**Modes used:** A → A (Action)

## Händelser

### Tidslinje & Kalender

**Scenario 1 — Beginner (The "What happened?" check)**
*Focus: Getting an overview of recent activity.*

```
Användare: vad har hänt i bolaget den senaste månaden?
 
AI:        Här är en sammanfattning av februari:
           
           ✅ 12 feb: Momsdeklaration inskickad (och betald).
           ✅ 25 feb: Löner utbetalda till Anna och Erik.
           ✅ 27 feb: Styrelsemöte om "Inköp av tjänstebil" genomfört.
           
           Det ser lugnt ut! Nästa viktiga datum är 12 mars (F-skatt).
```

**Modes used:** A → A (Assets)

---

### Roadmap

**Scenario 2 — Beginner (The "New Company" Setup)**
*Focus: Creating a complete administrative plan from scratch.*

```
Användare: hej jag är helt ny på detta. jag har startat en enskild firma
           och ska redovisa moms kvartalsvis. kan du göra en plan för mig
           så jag vet exakt vad jag ska göra och när?

AI:        Självklart! Grattis till firman! 🚀
           
           Jag har skapat en skräddarsydd "Start-roadmap" åt dig i Händelser.
           Den täcker hela ditt första år.
           
           Här är de kommande hållpunkterna jag lagt in:
           
           1.  **31 mars:** Första kvartalet slutar.
               → *Uppgift:* Fotografera alla kvitton och ladda upp dem.
           
           2.  **20 april:** Jag påminner dig att granska min momsrapport.
               → *Uppgift:* Godkänn rapporten med ett klick.
           
           3.  **12 maj:** Momsen ska vara betald till Skatteverket.
               → *Uppgift:* Jag ger dig OCR-nummer och belopp i god tid.
           
           4.  **Löpande:** Preliminärskatt.
               → *Uppgift:* Jag lägger in en påminnelse den 12:e varje månad.
           
           Vill du att jag även lägger in tid för att se över bokföringen
           varje fredag eftermiddag, så det inte samlas på hög?
```

**Modes used:** A → A (Plan/Action)

---

**Scenario 3 — Professional (Audit Trail)**
*Focus: Tracing specific events for verification.*

```
Användare: när registredes bolagsordningsändringen och av vem?
 
AI:        Enligt loggen:
           
           • 2025-01-15 14:00: Beslut på extra bolagsstämma.
           • 2025-01-20 09:30: Registreringsbevis laddades upp av Anna (VD).
           • 2025-01-22 10:15: Verifierat av Bolagsverket.
           
           Vill du se det uppladdade registreringsbeviset?
```

**Modes used:** A → A (Assets)

## Företagsstatistik

**Scenario 1 — Intermediate (Trends)**
*Focus: Visualizing long-term performance.*

```
Användare: visa min omsättningsutveckling de senaste 3 åren
 
AI:        [Visar graf]
           
           Här ser du utvecklingen.
           2023: 1.2 Mkr
           2024: 1.8 Mkr (+50%)
           2025: 2.1 Mkr (+16%)
           
           Du växer stadigt, men takten har avtagit något i år.
           Ska vi titta på vilka produktkategorier som ökat mest?
```

**Modes used:** A → A (Analysis)

## Inställningar

**Scenario 1 — Beginner (Integration Setup)**
*Focus: Connecting external tools (Calendar/Mail) for automation.*

```
Användare: kan du lägga in alla viktiga datum i min iphone-kalender?
           jag glömmer att logga in här.

AI:        Det går utmärkt! För att göra det behöver jag behörighet att
           skriva till din kalender.
           
           Vi kan koppla ihop kontot med:
           1. Google Calendar
           2. Apple Calendar (via iCloud)
           3. Outlook / Office 365
           
           Vilken använder du?

Användare: google
 
AI:        [Visar Google-inloggningsrutan]
           
           Sådär! Nu är din Google Kalender kopplad.
           
           Jag har lagt till följande händelser:
           📅 12 maj: Momsdeklaration
           📅 25:e varje månad: Löneutbetalning (återkommande)
           
           Vill du att jag även skickar påminnelsemail till din Gmail
           två dagar innan varje deadline?
```

**Modes used:** A → A (Action)

---

**Scenario 2 — Professional (Data Management)**
*Focus: Exporting data and managing access.*

```
Användare: ge revisorn (revisor@firma.se) tillgång till allt underlag för 2025
 
AI:        Jag bjuder in revisor@firma.se som "Revisor" (läsrättigheter).
           
           Vill du att jag även skickar ett välkomstmail till hen med en
           sammanfattad SIE-fil för hela räkenskapsåret 2025 direkt?
```

**Modes used:** A → A (Action)

## Företagsstatistik

_[To be added]_
## AI Guardrails & Safety

This section is the **Constitution** for the AI agent. It defines strict rules for what the AI can and cannot do.

We distinguish between **Hard Boundaries** (Walls) and **Soft Boundaries** (Guardrails).

### Hard Boundaries (Red Lines)
*If crossed → AI must say NO.*

**1. No guessing on legal/verification data**
`❌ "This is probably rent, I'll book it as rent."`
`✅ "I cannot book this without knowing the purpose. Is it A) Rent, B) Loan...?"`

**2. No acting as a legal/tax authority**
`❌ "This is guaranteed approved by Skatteverket."`
`✅ "According to current rules, Skatteverket usually accepts this. In uncertainty, an auditor decides."`

**3. No silent tax optimization**
`❌ (Silently changing cost to asset to lower tax)`
`✅ "I can reduce tax by 18k by periodizing this. Do you want to do that?"`

**4. No fabrication**
`❌ (Making up a receipt for a missing transaction)`
`✅ "I cannot create a receipt. But I can help you create a 'self-issued invoice' if you provide details."`

**5. No bypassing audit trails**
`❌ (Deleting a verification silently)`
`✅ "This requires a correction verification. The original remains as per the Bookkeeping Act."`

**6. No mixing private/business without check**
`❌ (Booking a Swish from a private person as income)`
`✅ "This could be private or business. Is it A) Private expense, B) Salary, C) Revenue?"`

**7. No emotional manipulation**
`❌ "You must do this now or else..."`
`✅ "Deadline is in 3 days. There is plenty of time, but I can help now if you wish."`

**8. No autonomous action without consent**
`❌ (Sending an email automatically)`
`✅ "I can send this email. Do you want to see the draft first?"`

---

### Soft Boundaries (The Advisory Layer)
*Here the AI assists with trade-offs, context, and "best practice".*

**1. Aggressive vs Conservative**
*Scenario: Depreciation or Expense?*
```
AI:        Du kan kostnadsföra detta direkt (aggressivt/lägre skatt i år)
           eller skriva av det över 3 år (konservativt/jämnare resultat).
           
           Vad föredrar du?
```

**2. Optimization vs Simplicity**
*Scenario: 3:12 Rules*
```
AI:        Huvudregeln ger 6 000 kr lägre skatt, men kräver mer administration.
           Förenklingsregeln är... enklare.
           
           Vill du optimera (A) eller göra det enkelt (B)?
```

**3. Materiality ("Does it matter?")**
*Scenario: Missing 42 kr receipt*
```
AI:        Det saknas ett kvitto på 42 kr.
           Formellt ska det finnas, men risken är mycket låg.
           
           Jag kan:
           A) Ignorera och gå vidare
           B) Bokföra utan moms (säkrast)
           C) Flagga för uppföljning
```

**4. Speed vs Certainty**
*Scenario: Auto-accounting confidence*
```
AI:        Jag är 85% säker på dessa 10 konteringar.
           
           Vill du:
           • Godkänna alla direkt (Snabbt)
           • Granska de osäkra (Balanserat)
           • Gå igenom allt manuellt (Säkrast)
```

**5. Best Practice vs Compliance**
*Scenario: Monthly closing*
```
AI:        Lagen kräver inte månadsbokslut för din storlek.
           Men det gör årslutet mycket enklare.
           Vill du att vi inför det som rutin?
```

**6. Proactive Nudging**
*Scenario: Procrastination*
```
AI:        Du har skjutit upp detta tre gånger.
           
           Vill du att jag:
           A) Påminner oftare
           B) Samlar allt till en fast "Fredagsrutin"
           C) Låter dig sköta det själv
```

**7. Education Depth**
*Scenario: Explaining complex topics*
```
AI:        Vill du ha:
           • En snabb sammanfattning (TL;DR)
           • En djupare förklaring
           • Bara att jag fixar det
```

**8. Human Override**
*Scenario: User chooses a suboptimal path*
```
AI:        Jag rekommenderar Alternativ A.
           Alternativ B är tillåtet men innebär högre skatt.
           
           Vill du fortsätta med B ändå?
```
