// =============================================================================
// Skills — Pre-prepared prompts for the skill picker (@-menu)
//
// A skill is a specific Swedish instruction that tells Scooby exactly what
// the user wants, so Scooby can act immediately without guessing.
// =============================================================================

export type SkillCategory = "bokforing" | "rapporter" | "loner" | "agare" | "skatt" | "allmant"

export interface Skill {
    id: string
    label: string
    description: string
    category: SkillCategory
    icon: string
    keywords: string[]
    prompt: string
}

export const skills: Skill[] = [
    // -------------------------------------------------------------------------
    // Bokföring
    // -------------------------------------------------------------------------
    {
        id: "fakturor",
        label: "Fakturor",
        description: "Kundfakturor, PDF-export och påminnelser",
        category: "bokforing",
        icon: "FileText",
        keywords: ["faktura", "kund", "invoice", "obetald", "förfallen"],
        prompt: "Visa mig mina obetalda fakturor och låt mig veta om det finns något som behöver åtgärdas — förfallna betalningar, saknade uppgifter eller fakturor som bör följas upp.",
    },
    {
        id: "transaktioner",
        label: "Transaktioner",
        description: "Bokförda in- och utbetalningar",
        category: "bokforing",
        icon: "CreditCard",
        keywords: ["transaktion", "betalning", "bank", "in", "ut"],
        prompt: "Visa mig de senaste transaktionerna och markera eventuella ej bokförda eller okategoriserade poster som behöver hanteras.",
    },
    {
        id: "verifikationer",
        label: "Verifikationer",
        description: "Bokföringsordrar och verifikat",
        category: "bokforing",
        icon: "ScrollText",
        keywords: ["verifikat", "journal", "kontering", "bokföringsorder"],
        prompt: "Visa mig de senaste verifikationerna och förklara om det finns någon kontering som ser felaktig ut eller behöver korrigeras.",
    },
    {
        id: "inventarier",
        label: "Inventarier",
        description: "Anläggningstillgångar och avskrivningar",
        category: "bokforing",
        icon: "BookOpen",
        keywords: ["inventarie", "avskrivning", "tillgång", "anläggningstillgång"],
        prompt: "Lista alla anläggningstillgångar med aktuellt bokfört värde och avskrivningsstatus. Flagga om någon tillgång är fullt avskriven eller bör justeras.",
    },

    // -------------------------------------------------------------------------
    // Rapporter
    // -------------------------------------------------------------------------
    {
        id: "resultatrakning",
        label: "Resultaträkning",
        description: "Intäkter, kostnader och rörelseresultat",
        category: "rapporter",
        icon: "TrendingUp",
        keywords: ["resultat", "vinst", "förlust", "p&l", "intäkt", "kostnad"],
        prompt: "Generera resultaträkning för innevarande räkenskapsår och kommentera de viktigaste posterna — var kommer intäkterna ifrån och vilka är de största kostnaderna?",
    },
    {
        id: "balansrakning",
        label: "Balansräkning",
        description: "Tillgångar, skulder och eget kapital",
        category: "rapporter",
        icon: "PieChart",
        keywords: ["balans", "tillgångar", "skulder", "eget kapital"],
        prompt: "Generera balansräkning per dagens datum och förklara om det finns poster som sticker ut — ovanligt höga skulder, svagt eget kapital eller tillgångar som bör granskas.",
    },
    {
        id: "arsredovisning",
        label: "Årsredovisning",
        description: "Sammanställning för räkenskapsåret",
        category: "rapporter",
        icon: "BookOpen",
        keywords: ["årsredovisning", "bokslut", "annual report"],
        prompt: "Hjälp mig att förbereda årsredovisningen för det senaste räkenskapsåret — vad behöver sammanställas och vilka steg återstår?",
    },

    // -------------------------------------------------------------------------
    // Skatt
    // -------------------------------------------------------------------------
    {
        id: "momsdeklaration",
        label: "Momsdeklaration",
        description: "Moms att betala, ingående och utgående",
        category: "skatt",
        icon: "Receipt",
        keywords: ["moms", "vat", "skatteverket", "mva", "utgående", "ingående"],
        prompt: "Kör momsrapport för senaste perioden och visa mig ingående moms, utgående moms och nettot att betala eller få tillbaka. Flagga om något ser konstigt ut.",
    },
    {
        id: "k10",
        label: "K10",
        description: "3:12-regler, gränsbelopp och utdelning",
        category: "skatt",
        icon: "Banknote",
        keywords: ["k10", "utdelning", "gränsbelopp", "3:12", "kvalificerade andelar"],
        prompt: "Beräkna mitt K10-gränsbelopp för innevarande år och förklara hur mycket jag kan ta i lågbeskattad utdelning enligt 3:12-reglerna.",
    },
    {
        id: "egenavgifter",
        label: "Egenavgifter",
        description: "Sociala avgifter för enskild firma",
        category: "skatt",
        icon: "Landmark",
        keywords: ["egenavgift", "ef", "enskild firma", "sociala avgifter"],
        prompt: "Beräkna mina egenavgifter för innevarande år baserat på det preliminära resultatet och förklara hur de redovisas.",
    },
    {
        id: "agi",
        label: "AGI",
        description: "Arbetsgivardeklaration på individnivå",
        category: "skatt",
        icon: "CalendarCheck",
        keywords: ["agi", "arbetsgivardeklaration", "skatteverket", "månadsuppgift"],
        prompt: "Förbered underlag för arbetsgivardeklarationen (AGI). Visa löner och förmåner per anställd för senaste perioden och bekräfta att allt stämmer innan jag skickar.",
    },
    {
        id: "ink2",
        label: "INK2",
        description: "Inkomstdeklaration för aktiebolag",
        category: "skatt",
        icon: "FileText",
        keywords: ["ink2", "inkomstdeklaration", "bolagsskatt", "deklaration"],
        prompt: "Hjälp mig förbereda INK2-deklarationen — visa skattemässigt resultat, eventuella justeringar och vad som behöver stämmas av mot bokslutet.",
    },

    // -------------------------------------------------------------------------
    // Löner
    // -------------------------------------------------------------------------
    {
        id: "lonekorning",
        label: "Lönekörning",
        description: "Kör löner, skattetabeller och nettolön",
        category: "loner",
        icon: "Banknote",
        keywords: ["lön", "lönekörning", "nettolön", "skatt", "bruttolön"],
        prompt: "Kör lönerna för innevarande period. Visa brutto, skatt och netto per anställd och bekräfta att arbetsgivaravgifterna beräknats korrekt.",
    },
    {
        id: "team",
        label: "Team",
        description: "Anställda, anställningsform och tjänstegrad",
        category: "loner",
        icon: "Users",
        keywords: ["anställd", "team", "personal", "tjänstegrad", "heltid"],
        prompt: "Visa mig en översikt över teamet — anställda, anställningsform, tjänstegrad och om det finns några uppgifter som saknas eller ser inaktuella ut.",
    },
    {
        id: "formaner",
        label: "Förmåner",
        description: "Bilförmån, friskvård och andra förmåner",
        category: "loner",
        icon: "Gift",
        keywords: ["förmån", "friskvård", "bilförmån", "naturaförmån"],
        prompt: "Visa registrerade förmåner per anställd — bilförmån, friskvård och övriga naturaförmåner. Kontrollera att förmånsvärdena är aktuella för innevarande år.",
    },
    {
        id: "delagaruttag",
        label: "Delägaruttag",
        description: "Uttag och lön för delägare i HB/KB",
        category: "loner",
        icon: "UserCog",
        keywords: ["delägaruttag", "handelsbolag", "uttag", "kommanditbolag"],
        prompt: "Visa delägaruttag och aktuellt saldo per delägare. Stämmer uttagen mot vad som planerats för perioden?",
    },

    // -------------------------------------------------------------------------
    // Ägare
    // -------------------------------------------------------------------------
    {
        id: "aktiebok",
        label: "Aktiebok",
        description: "Aktier, ägare och ägarförändringar",
        category: "agare",
        icon: "BookOpen",
        keywords: ["aktie", "ägare", "aktiebok", "ägarandel", "aktiekapital"],
        prompt: "Visa aktieboken med samtliga aktieägare, antal aktier och ägarandelar i procent. Har det skett några ägarförändringar som inte är registrerade?",
    },
    {
        id: "utdelning",
        label: "Utdelning",
        description: "Utdelningsbeslut och skatteberäkning",
        category: "agare",
        icon: "Banknote",
        keywords: ["utdelning", "dividend", "bolagsstämma", "utdelningsutrymme"],
        prompt: "Beräkna utdelningsutrymmet för innevarande år — hur mycket kan vi dela ut inom gränsbeloppet och vad beskattas i kapital kontra tjänst?",
    },
    {
        id: "delagare",
        label: "Delägare",
        description: "Delägarprofiler och ägarandel",
        category: "agare",
        icon: "UserCheck",
        keywords: ["delägare", "ägare", "partner", "bolagsavtal"],
        prompt: "Visa delägarprofiler med ägarandelar och kontaktuppgifter. Finns det något i bolagsavtalet eller ägarstrukturen som behöver uppdateras?",
    },
    {
        id: "bolagsstamma",
        label: "Bolagsstämma",
        description: "Stämmoprotokoll och bolagsbeslut",
        category: "agare",
        icon: "CalendarDays",
        keywords: ["bolagsstämma", "stämma", "protokoll", "stämmobeslut", "årsstämma"],
        prompt: "Visa senaste bolagsstämmoprotokollet och påminn mig om kommande stämma behöver planeras eller om det finns öppna stämmobeslut att följa upp.",
    },
    {
        id: "styrelseprotokoll",
        label: "Styrelseprotokoll",
        description: "Styrelsemöten och styrelsebeslut",
        category: "agare",
        icon: "CalendarDays",
        keywords: ["styrelse", "protokoll", "styrelsemöte", "styrelsebeslut"],
        prompt: "Lista senaste styrelsemötena med datum och beslut. Finns det aktionspunkter från protokollen som inte är avklarade?",
    },
    {
        id: "medlemsregister",
        label: "Medlemsregister",
        description: "Medlemmar i ekonomisk förening",
        category: "agare",
        icon: "Users",
        keywords: ["medlem", "förening", "ekonomisk förening", "insatser"],
        prompt: "Visa medlemsregistret med namn, insatser och inträdes-/utträdesdatum. Finns det insatser som ska betalas ut eller nya medlemmar att registrera?",
    },

    // -------------------------------------------------------------------------
    // Allmänt
    // -------------------------------------------------------------------------
    {
        id: "handelser",
        label: "Händelser & Deadlines",
        description: "Skattedeadlines och bokslut",
        category: "allmant",
        icon: "CalendarDays",
        keywords: ["deadline", "händelse", "månadsavslut", "skattedatum", "moms"],
        prompt: "Visa kommande deadlines och viktiga datum för företaget — moms, AGI, bolagsskatt, bokslut och annat som behöver hanteras de närmaste 60 dagarna.",
    },
    {
        id: "kund",
        label: "Kund",
        description: "Kundprofil, historik och fakturor",
        category: "allmant",
        icon: "Building2",
        keywords: ["kund", "klient", "customer", "kundhistorik"],
        prompt: "Visa kundprofil, fakturahistorik och aktuell skuld. Fråga mig vilken kund du ska titta på om det inte framgår av sammanhanget.",
    },
]

// -------------------------------------------------------------------------
// Category metadata
// -------------------------------------------------------------------------

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
    bokforing: "Bokföring",
    rapporter:  "Rapporter",
    loner:      "Löner & Personal",
    agare:      "Ägare & Styrning",
    skatt:      "Skatt & Deklarationer",
    allmant:    "Allmänt",
}

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
    "bokforing",
    "rapporter",
    "skatt",
    "loner",
    "agare",
    "allmant",
]
