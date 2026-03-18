# AI Tools Manual

Använd detta dokument för att hitta rätt verktyg för en uppgift. När du hittat ett verktyg du vill använda, anropa `search_tools` med verktygets namn för att få den fullständiga specifikationen (parametrar).

## Common

- **close_fiscal_year**: Stäng räkenskapsåret och skapa bokslutsposter. Överför årets resultat till eget kapital och skapar ingående balanser för nästa år. Kräver bekräftelse.
- **draft_annual_report**: Skapa utkast för årsredovisning (K2). Innehåller förvaltningsberättelse, resultaträkning, balansräkning och noter. Använd när användaren vill göra sin årsredovisning eller frågar om bokslut.
- **export_sie**: Exportera bokföringen som SIE-fil (svenskt standardformat). Använd för revision, byte av bokföringsprogram, eller när revisorn begär underlag. Kräver bekräftelse.
- **generate_financial_report**: Skapa en samlad finansiell rapport med resultat- och balansräkning för en period. Kan jämföra mot tidigare år.
- **generate_management_report**: Generera förvaltningsberättelse för årsredovisningen. AI skriver texten baserat på årets siffror. Använd när användaren behöver hjälp att skriva förvaltningsberättelsen.
- **get_balance_sheet**: Hämta balansräkning med tillgångar, skulder och eget kapital. Visar företagets ekonomiska ställning. Använd för att kolla soliditet, likviditet, eller svara på "hur mycket pengar har vi", "vad är vi skyldiga".
- **prepare_ink2**: Förbered inkomstdeklaration (INK2) för aktiebolag. Beräknar bolagsskatt och visar skatteoptimeringsförslag som periodiseringsfond. Använd när användaren vill deklarera eller frågar om skatt.
- **submit_vat_declaration**: Skicka momsdeklaration till Skatteverket för en period. Deadline: 12:e (26:e för stora företag). Visar förhandsgranskning innan bekräftelse. Vanliga frågor: "skicka momsen", "deklarera moms". Kräver bekräftelse.
- **add_memory**: Spara ett nytt minne om användaren. Använd för att komma ihåg viktiga beslut, preferenser, eller pågående överväganden som användaren nämner.
- **buy_ai_credits**: Hjälp användaren köpa fler AI-credits.
Använd detta verktyg när:
- Användaren vill köpa fler tokens/credits
- Användaren har slut på sin AI-budget
- Användaren frågar om priser för credits

Om användaren inte angett hur många tokens, visa tillgängliga paket.
Om användaren valt ett paket, returnera checkout-länken.
- **check_ai_usage**: Kontrollera användarens AI-tokenanvändning och returnera status.
Använd detta diskret för att:
- Påminna användaren när de når 50%, 75%, 90% av sin månadsgräns
- Informera om att de kan köpa fler credits vid behov
- Aldrig avbryta ett svar, bara nämna det i slutet av svaret

VIKTIGT: Var diskret. Lägg till påminnelsen naturligt i slutet av ditt svar, inte mitt i.
- **create_event**: Skapa en ny händelse eller påminnelse i kalendern.
- **export_to_calendar**: Exportera deadlines och händelser till extern kalender.
- **get_activity_summary**: Visa en sammanfattning av aktivitet för en period.
- **get_ai_usage_stats**: Hämta detaljerad statistik om användarens AI-tokenanvändning denna månad. Använd detta om användaren specifikt frågar om sin användning.
- **get_business_summary**: Ger en sammanfattning av hur det går för företaget under en viss period (dag, vecka eller månad). Visar resultat och viktiga händelser.
- **get_company_info**: Hämta information om företaget: namn, organisationsnummer, företagsform, räkenskapsår, momsinställningar.
- **get_company_statistics**: Hämta omfattande företagsstatistik: intäkter, kostnader, transaktioner, fakturor, anställda, etc.
- **get_company_stats**: Hämta en sammanfattning av företagets ekonomiska status.
- **get_dashboard_counts**: Hämta snabb översikt: antal transaktioner, fakturor, kvitton, anställda.
- **get_events**: Hämta händelser och aktivitetslogg. Kan filtreras på källa, kategori och datum.
- **get_knowledge**: Ladda detaljerad kunskap om ett amne. Anvand nar du behover specifika regler om bokforing, skatt, loner, bolagsratt, foretagstyper, eller arbetsfloden (skill_*). Tillgangliga amnen: bokforing, rapporter, loner, agare, handelser, skatt, foretagstyper, skill_bokforing, skill_loner, skill_skatt, skill_agare.
- **get_kpis**: Hämta nyckeltal (KPIs): bruttomarginal, rörelsemarginal, likviditet, skuldsättning.
- **get_monthly_breakdown**: Hämta månadsvis uppdelning av intäkter och kostnader.
- **get_notification_preferences**: Visa aktuella notifikationsinställningar för e-post och push.
- **get_subscription_status**: Visa aktuell prenumerationsstatus, användning och faktureringsinformation.
- **get_upcoming_deadlines**: Visa kommande deadlines för skatt, bokföring och bolagsärenden.
- **get_walkthrough_history**: Hämta sparade walkthroughs (genomgångar). Kan sökas på titel.
- **list_active_integrations**: Visa alla aktiva integrationer och deras status.
- **navigate_to**: Navigera användaren till en sida i dashboarden. Stödjer naturligt språk som "visa mina kvitton", "gå till löner", "öppna momsdeklarationen". Tillgängliga sidor: dashboard (Startsidan), bookkeeping (Bokföring), transactions (Transaktioner), invoices (Fakturor), receipts (Kvitton), inventory (Inventarier), verifications (Verifikationer), reports (Rapporter), income_statement (Resultaträkning), balance_sheet (Balansräkning), vat (Momsdeklaration), income_tax (Inkomstdeklaration), agi (AGI), annual_report (Årsredovisning), annual_accounts (Årsbokslut), k10 (K10), payroll (Löner), payslips (Lönekörning), benefits (Förmåner), team (Team & Rapportering), self_employment_fees (Egenavgifter), shareholder_withdrawal (Delägaruttag), owners (Ägare), share_register (Aktiebok), shareholders (Delägare), dividends (Utdelning), owner_info (Ägarinfo), member_registry (Medlemsregister), board_minutes (Styrelseprotokoll), general_meeting (Bolagsstämma), annual_meeting (Årsmöte), signatories (Firmatecknare), settings (Inställningar)
- **query_memories**: Sök i användarens minnesbank för att hitta relevant tidigare kontext. Använd när du misstänker att användaren har diskuterat ett ämne tidigare, eller för att personalisera svaret baserat på deras preferenser och tidigare beslut.
- **reconcile_status**: Skannar appdata efter inaktuella eller inkonsekventa tillstånd. Kontrollerar obokförda transaktioner, förfallna fakturor, omatchade kvitton, utkast-lönebesked och gamla väntande bokningar. Returnerar en lista med åtgärdsförslag.
- **search_tools**: Sök efter verktyg du kan använda. Beskriv vad du vill göra, t.ex. "skapa faktura", "kör lönerna", "beräkna skatt", "visa kvitton". Returnerar en lista med matchande verktyg som du sedan kan anropa.
- **show_preview**: Visa en förhandsgranskning av data direkt i chatten utan att navigera bort. Använd när användaren vill se en snabböversikt.
- **show_walkthrough**: Visa en sparad walkthrough (genomgång) genom att hämta den från händelsehistoriken.
- **update_notification_preferences**: Ändra en notifikationsinställning (e-post eller push).

## Bokforing

- **book_depreciation**: Bokför månatliga/årliga avskrivningar för inventarier. Skapar verifikation automatiskt. Använd vid månadsavslut eller bokslut. Kräver bekräftelse.
- **book_invoice_payment**: Registrera att en kundfaktura är betald. Skapar verifikation, uppdaterar kundreskontran, och markerar fakturan som betald. Använd när betalning kommit in på bankkontot. Kräver bekräftelse.
- **bulk_categorize_transactions**: Kategorisera flera transaktioner på en gång. Använd när användaren säger "kontera januari", "bokför allt", eller vill snabbt hantera återkommande transaktioner som hyra, löner, eller prenumerationer. Föreslår konton baserat på leverantörsnamn. Kräver bekräftelse.
- **calculate_depreciation**: Beräkna avskrivning för inventarier. Visar hur mycket som ska skrivas av varje månad/år och kvarvarande bokfört värde.
- **categorize_transaction**: Kategorisera en enskild banktransaktion till ett BAS-konto. Använd efter att ha identifierat vilken typ av kostnad/intäkt transaktionen representerar. T.ex. "Spotify 169 kr" → konto 6993 (IT-tjänster).
- **create_accrual**: Skapa periodavgränsningspost (upplupen kostnad/intäkt, förutbetald kostnad/intäkt).
- **create_asset**: Registrera en ny inventarie/anläggningstillgång. Skapar automatiskt avskrivningsplan baserat på ekonomisk livslängd. Använd när användaren köpt dator, maskin, bil, eller annan utrustning över halva prisbasbeloppet. Kräver bekräftelse.
- **create_invoice**: Skapa en ny kundfaktura. Beräknar moms automatiskt (25% standard). Använd när användaren vill fakturera en kund för utfört arbete eller sålda varor. Vanliga frågor: "skapa faktura", "fakturera Acme", "jag behöver skicka en faktura". Kräver bekräftelse.
- **create_receipt**: Registrera ett kvitto manuellt (om det inte laddades upp som bild). Använd för kvitton från kontantköp, lunch med kund, eller andra utgifter. Kräver bekräftelse.
- **create_transaction**: Skapa en manuell verifikation för poster som inte kommer via bank, t.ex. kontant betalning, ägarinsättning, periodisering, eller justering. Kräver bekräftelse.
- **create_verification**: Proposes a new manual journal entry (verification). Use this when user wants to book something manually. Requires balanced debit/credit rows.
- **dispose_asset**: Avyttra, sälj eller skrota en inventarie. Beräknar vinst/förlust vid försäljning och skapar korrekta bokföringsposter. Använd när användaren säljer bil, dator eller annan utrustning. Kräver bekräftelse.
- **get_account_balance**: Hämta saldo för ett specifikt bokföringskonto. Använd för att se aktuellt saldo på bankkonto, skattekonto, eller liknande.
- **get_accounts**: Hämta konton från BAS-kontoplanen. Kan filtrera på kontoklass (1=Tillgångar, 2=Skulder, 3=Intäkter, 4-8=Kostnader) och sökterm. Använd för att hitta rätt konto att bokföra på.
- **get_assets**: Hämta inventarier och anläggningstillgångar (maskiner, datorer, möbler etc). Visar inköpspris, kvarvarande värde och avskrivningsstatus.
- **get_balance_sheet_summary**: Hämta sammanfattning av balansräkningen: totala tillgångar, skulder, eget kapital och resultat. Använd för snabb överblick över bolagets ekonomiska ställning.
- **get_chart_of_accounts**: Hämta hela kontoplanen grupperad efter kontoklass. Använd för att se vilka konton som används eller för att exportera kontoplan.
- **get_customer_invoices**: Hämta skickade kundfakturor. Kan filtrera på status (utkast/skickad/betald/förfallen) eller kundnamn. Använd för att se fakturastatus, hitta specifika fakturor, eller följa upp betalningar. Vanliga frågor: "visa mina fakturor", "fakturor till Acme".
- **get_income_statement**: Hämta resultaträkning med intäkter, kostnader och årets resultat. Visar hur lönsamt företaget är. Vanliga frågor: "hur går det", "vad är vinsten", "resultat i år".
- **get_overdue_invoices**: Lista kundfakturor som passerat förfallodatum och inte betalats. Använd för uppföljning och beslut om påminnelser. Vanliga frågor: "har nån kund inte betalat", "vilka fakturor är förfallna", "obetalda fakturor".
- **get_receipts**: Hämta uppladdade kvitton. Kan filtrera på leverantör, status eller belopp. Använd för att hitta specifika kvitton eller se vilka som behöver hanteras.
- **get_supplier_invoices**: Hämta mottagna leverantörsfakturor (inkommande fakturor att betala). Kan filtrera på status eller leverantör. Använd för att se obetalda räkningar, förbereda betalningar, eller attestera fakturor.
- **get_transactions**: Hämta banktransaktioner för ett datumintervall. Använd för att visa kontoutdrag, hitta specifika betalningar, analysera utgifter, eller förbereda avstämning mot bokföring. Vanliga frågor: "visa mina transaktioner", "vad har jag köpt", "kontoutdrag januari".
- **get_transactions_missing_receipts**: Lista transaktioner över 500 kr som saknar bifogat kvitto. Använd för att följa upp dokumentation inför bokslut eller revision. Vanliga frågor: "vilka kvitton saknas", "vad måste jag ladda upp".
- **get_unmatched_receipts**: Lista kvitton som inte är kopplade till någon banktransaktion. Använd för att hitta kvitton som behöver matchas eller för att identifiera dubbletter.
- **get_verification_stats**: Hämta statistik om verifikationer - antal, senaste nummer, etc.
- **get_verifications**: Hämta verifikationer (bokföringsposter) från huvudboken. Kan filtreras på serie, datum och sökterm. Använd för att hitta specifika bokföringsposter eller förstå vad en viss post gäller.
- **match_payment_to_invoice**: Koppla en inbetalning till en kundfaktura för att markera fakturan som betald och bokföra betalningen korrekt. Använd när du ser en betalning på kontot och vill stänga motsvarande faktura. Kräver bekräftelse.
- **periodize_expense**: Periodisera en kostnad över flera månader. Skapar automatiska bokföringsposter.
- **reverse_verification**: Återför/ångra en verifikation genom att skapa en motbokning.
- **run_balance_sheet_audit**: Kör en komplett balanskontroll som kontrollerar balansräkningsprov, momsavstämning, kundfordringar, leverantörsskulder, löneavstämning, avskrivningar, eget kapital och periodiseringar. Samlar data från hela bokföringen och korsrefererar som en revisor.
- **run_income_statement_audit**: Kör en komplett resultatkontroll som analyserar intäkter, kostnader, bruttovinst, personalkostnader, avskrivningar och periodresultat. Jämför med tidigare perioder och identifierar avvikelser som en revisor.
- **send_invoice_reminder**: Skicka betalningspåminnelse på förfallen kundfaktura. Stödjer tre nivåer: första påminnelse, andra påminnelse, och inkassokrav. Kan lägga till dröjsmålsavgift (60 kr). Använd när kunden inte betalat i tid.
- **void_invoice**: Makulera en felaktig faktura genom att skapa kreditfaktura. Använd när faktura har fel belopp, fel kund, eller inte ska skickas. Kan inte ångras. Kräver bekräftelse.

## Loner

- **assign_benefit**: Tilldela en förmån till en anställd. Kräver bekräftelse.
- **calculate_self_employment_fees**: Beräkna egenavgifter för enskild näringsidkare eller handelsbolagsdelägare.
- **get_agi_reports**: Visa arbetsgivardeklarationer (AGI) som skickats eller är klara för inskickning. Innehåller summor för utbetald lön, skatt och arbetsgivaravgifter.
- **get_available_benefits**: Hämta tillgängliga personalförmåner (t.ex. friskvård, bilförmån).
- **get_benefit_details**: Get detailed information about a specific benefit type, including tax rules and limits.
- **get_employees**: Visa alla anställda med deras grundlön, anställningsform och roll. Använd för att få överblick eller inför lönekörning.
- **get_payslips**: Hämta genererade lönebesked för anställda. Kan filtrera på period eller person. Använd för att visa tidigare utbetalningar eller skapa underlag till AGI.
- **list_benefits**: List all available employee benefits (förmåner). Filter by company type if needed.
- **optimize_312**: Beräkna optimal fördelning mellan lön och utdelning enligt 3:12-reglerna för fåmansbolag.
- **register_employee**: Proposes registering a new employee. Returns a preview card for user confirmation.
- **register_owner_withdrawal**: Registrera ett delägaruttag (lön, utdelning eller privat uttag).
- **run_payroll**: Kör lönekörning för en månad. Beräknar nettolön, skatt och arbetsgivaravgifter. Skapar lönebesked för alla eller valda anställda. Vanliga frågor: "gör lönerna", "kör lönerna för mars", "betala ut löner". Kräver bekräftelse.
- **submit_agi_declaration**: Skicka arbetsgivardeklaration (AGI) till Skatteverket. Innehåller alla löner och skatteavdrag för perioden. Deadline: 12:e varje månad. Vanliga frågor: "skicka AGI", "skicka in löneuppgifter". Kräver bekräftelse.
- **suggest_unused_benefits**: Suggest tax-free benefits that an employee has not used yet this year.

## Parter

- **add_shareholder**: Lägg till en ny aktieägare i aktieboken. Kräver bekräftelse.
- **draft_board_minutes**: Skapa utkast till styrelseprotokoll eller årsstämmoprotokoll. Fyller i mallen med beslut och närvarande. Använd när användaren behöver protokoll.
- **get_annual_meeting_deadline**: Beräkna deadline för årsstämma baserat på räkenskapsårets slut.
- **get_board_meeting_minutes**: Hämta styrelseprotokoll. Kan filtrera på status.
- **get_board_members**: Hämta lista över styrelsemedlemmar (ordförande, VD, ledamöter, suppleanter).
- **get_company_meetings**: Hämta bolagsstämmor och styrelsemöten.
- **get_compliance_deadlines**: Visa kommande deadlines för bolagsrättsliga och skattemässiga förpliktelser baserat på räkenskapsår. Inkluderar moms, AGI, årsredovisning och bolagsstämma. Vanliga frågor: "när ska momsen in", "vad har jag för deadlines", "nästa förfallodag".
- **get_compliance_docs**: Hämta bolagsdokument som styrelseprotokoll, stämmoprotokoll eller aktieboken. Använd för att hitta tidigare beslut, kontrollera ägande, eller förbereda intyg.
- **get_members**: Hämta alla medlemmar i ekonomisk förening.
- **get_partners**: Hämta alla delägare i handelsbolag eller kommanditbolag.
- **get_share_register_summary**: Hämta sammanfattning av aktieboken: antal aktier, aktieägare, aktiekapital.
- **get_shareholders**: Hämta den aktuella aktieboken och lista över alla aktieägare.
- **get_signatories**: Visa firmatecknare för bolaget och deras behörigheter (ensam/tillsammans). Hämtas från Bolagsverket via API.
- **prepare_agm**: Förbered underlag och dagordning för årsstämma.
- **register_dividend**: Registrera ett utdelningsbeslut från bolagsstämma. Skapar underlag för K10 och Skatteverket. Vanliga frågor: "ta utdelning", "bestämde 100 000 i utdelning". Kräver bekräftelse.
- **transfer_shares**: Registrera en aktieöverlåtelse mellan parter. Uppdaterar aktieboken automatiskt.

## Planning

- **create_roadmap**: Skapa en ny affärsplan med steg. Använd för att bryta ner stora mål i hanterbara delar.
- **generate_roadmap**: Generate a structured step-by-step roadmap for a business goal (e.g., 'Start a company', 'Close fiscal year'). Creates a persistent plan in the database.
- **generate_roadmap_suggestions**: Generera AI-förslag på steg för att uppnå ett affärsmål. Returnerar en plan som kan användas med create_roadmap.
- **get_roadmaps**: Visa alla affärsplaner och deras framsteg.
- **update_roadmap_step**: Uppdatera status för ett steg i en affärsplan.

## Skatt

- **calculate_gransbelopp**: Beräkna gränsbeloppet för K10-deklaration (fåmansföretag). Visar hur mycket utdelning som kan beskattas som kapitalinkomst (20%) istället för tjänsteinkomst. Använder förenklingsregeln eller löneunderlag. Vanliga frågor: "hur mycket utdelning kan jag ta", "vad blir gränsbeloppet".
- **create_periodiseringsfond**: Create a new periodiseringsfond to defer tax. Max 25% of profit for AB, 30% for EF. Must be dissolved within 6 years.
- **dissolve_periodiseringsfond**: Dissolve (återför) a periodiseringsfond. Can be partial or full dissolution.
- **get_expiring_fonder**: Get periodiseringsfonder that are expiring within a specified number of months.
- **get_investment_summary**: Get a summary of all company investments: shares and holdings.
- **get_vat_report**: Visa momsdeklarationer med utgående och ingående moms. Beräknar nettobelopp att betala/få tillbaka. Använd för att förbereda momsredovisning. Vanliga frågor: "dags för momsen", "hur mycket moms ska jag betala", "momsrapporten".
- **list_periodiseringsfonder**: List all periodiseringsfonder (tax allocation reserves). Shows active fonder with amounts, years, and expiry dates.
- **list_share_holdings**: List all share holdings (aktieinnehav) in other companies.

