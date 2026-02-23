# Skatt - Kunskapsdokument

## K10 / 3:12-regler (Famansaktiebolag)
- Galler foretag dar 4 eller farre delagare ager >50% av rosterna
- Syftar att dela utdelning i kapitalinkomst (30%) vs tjansteinkomst (~50-55%)

### Gransbelopp (3 metoder, valj hogsta)
1. **Forenklingsregeln**: 2.75 inkomstbasbelopp (2026: ca 204 000 kr)
   - Delas pa antal aktier, kan bara anvandas i ETT bolag
2. **Lonbaserad**: 50% av totala loner i bolaget + 50% av loner over 8 IBB per anstalld
   - Krav: Agaren sjalv tar minst 6 IBB + 5% av lonerna (alternativt 10 IBB)
3. **Kapitalbaserad**: Statslanerantan + 9% pa anskaffningsvarde

### Sparat utdelningsutrymme
- Oanvant gransbelopp sparas till nasta ar
- Uppraknas med statslanerantan + 3%

### Utdelning over gransbelopp
- Upp till gransbelopp: 20% skatt (kapital)
- Over gransbelopp: Beskattas som tjanst (upp till 90 IBB)
- Over 90 IBB: Kapitalinkomst igen

## Moms (detaljerat)
- Registreringsplikt vid >80 000 kr omsattning (2026)
- Undantag: sjukvard, utbildning, fastighetsuthyrning (kan valja frivillig skattskyldighet)
- Omvand skattskyldighet: byggbranschen, elektronik till aterfordsaljare
- EU-forsaljning: Reverse charge (konto 2614/2645)

### Momsperioder
| Omsattning | Period | Deadline |
|---|---|---|
| >40 MSEK | Manad | 26:e nasta manad (12:e for jan/aug) |
| 1-40 MSEK | Kvartal | 12:e andra manaden efter kvartal |
| <1 MSEK | Ar | 26:e feb aret efter |

## Kommunalskatt & Skattetabeller
- Skatt pa lon baseras pa **hemkommun**, INTE foretags-kommun
- Total kommunalskatt: ca 29-35% beroende pa kommun
- Skattetabeller fran Skatteverket: kolumn baserad pa kyrkoavgift (ja/nej)
- Tabellavdrag ger automatiskt grundavdrag
- Scope anvander skattetabeller fran `tax-service` — EJ schablon 24%

## Periodiseringsfonder
- AB: Max 25% av overskottet per ar, max 6 fonder (6 ar)
- EF: Max 30% av overskottet, max 6 fonder
- Aterforing senast ar 6 (FIFO-ordning)
- Schablonranta pa fonden: 72% av statslanerantan

## Egenavgifter (EF/HB/KB)
- Rate 2026: 28.97% av nettointakten
- Inkluderar: sjukforsakring, foraldraforsakring, pension, arbetsmarknadsavgift
- Betalas via F-skatt (preliminar)
- Slutavrakning vid deklaration

## F-skatt & SA-skatt
- **F-skatt**: Foretaget betalar egen skatt (ingen kallskatt av uppdragsgivare)
- **SA-skatt**: Kombinerad F- och A-skatt (anstallda med bisyssla)
- FA-skattsedel: Visar att mottagaren har F-skatt → uppdragsgivaren slipper arbetsgivaravgifter
