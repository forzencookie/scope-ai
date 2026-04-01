"use client"

import { useState } from "react"
import Link from "next/link"
import {
    ArrowLeft,
    User,
    Building2,
    Puzzle,
    CreditCard,
    Paintbrush,
    Lock,
    Bell,
    Globe,
    Camera,
    Upload,
    Check,
    Moon,
    Sun,
    Monitor,
    ExternalLink,
    Shield,
    Smartphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type SettingsTab = "konto" | "foretag" | "integrationer" | "fakturering" | "utseende" | "sakerhet" | "notiser" | "sprak"

interface NavItem {
    id: SettingsTab
    label: string
    icon: typeof User
    badge?: string
}

const navItems: NavItem[] = [
    { id: "konto", label: "Konto", icon: User },
    { id: "foretag", label: "Foretagsinfo", icon: Building2 },
    { id: "utseende", label: "Utseende", icon: Paintbrush },
    { id: "notiser", label: "Notiser", icon: Bell },
    { id: "sprak", label: "Sprak & region", icon: Globe },
    { id: "fakturering", label: "Fakturering", icon: CreditCard, badge: "Pro" },
    { id: "integrationer", label: "Integrationer", icon: Puzzle, badge: "Snart" },
    { id: "sakerhet", label: "Sakerhet", icon: Lock },
]

function SettingsField({ label, value, description, type = "text" }: {
    label: string
    value: string
    description?: string
    type?: "text" | "email" | "readonly"
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
            <input
                type={type === "readonly" ? "text" : type}
                defaultValue={value}
                readOnly={type === "readonly"}
                className={cn(
                    "w-full rounded-md border-2 border-border/60 bg-background px-3 py-2 text-sm transition-colors",
                    "focus:outline-none focus:border-primary/50",
                    type === "readonly" && "bg-muted/30 text-muted-foreground cursor-not-allowed"
                )}
            />
            {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
    )
}

function SettingsToggle({ label, description, defaultChecked = false }: {
    label: string
    description?: string
    defaultChecked?: boolean
}) {
    const [checked, setChecked] = useState(defaultChecked)
    return (
        <div className="flex items-center justify-between py-3">
            <div>
                <p className="text-sm font-medium">{label}</p>
                {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <button
                onClick={() => setChecked(!checked)}
                className={cn(
                    "h-6 w-11 rounded-full transition-colors relative shrink-0",
                    checked ? "bg-primary" : "bg-muted"
                )}
            >
                <div className={cn(
                    "h-5 w-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                    checked ? "translate-x-5" : "translate-x-0.5"
                )} />
            </button>
        </div>
    )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-sm font-semibold mb-3">{children}</h3>
}

function SectionDivider() {
    return <div className="border-b my-6" />
}

// Tab content components
function KontoTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Konto</h2>
                <p className="text-sm text-muted-foreground">Hantera din profil och kontoinformation.</p>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center relative group cursor-pointer">
                    <span className="text-lg font-bold text-primary">AS</span>
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-5 w-5 text-white" />
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium">Anna Svensson</p>
                    <p className="text-xs text-muted-foreground">anna@scopeai.se</p>
                    <button className="text-xs text-primary hover:underline mt-1">Byt profilbild</button>
                </div>
            </div>

            <SectionDivider />

            <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Namn" value="Anna Svensson" />
                <SettingsField label="E-post" value="anna@scopeai.se" type="readonly" description="Kontakta support for att andra e-post." />
            </div>

            <SectionDivider />

            <div>
                <SectionTitle>Farliga atgarder</SectionTitle>
                <div className="rounded-lg border-2 border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-600">Radera konto</p>
                        <p className="text-[10px] text-muted-foreground">All data raderas permanent.</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-500/30 hover:bg-red-500/10">
                        Radera
                    </Button>
                </div>
            </div>
        </div>
    )
}

function ForetagTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Foretagsinformation</h2>
                <p className="text-sm text-muted-foreground">Uppgifter om ditt foretag for bokforing och rapporter.</p>
            </div>

            {/* Company logo */}
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-medium">Foretagslogotyp</p>
                    <p className="text-[10px] text-muted-foreground">Visas pa fakturor och rapporter. Max 2MB.</p>
                </div>
            </div>

            <SectionDivider />

            <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Foretagsnamn" value="Svensson & Co KB" />
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Foretagsform</label>
                    <div className="grid grid-cols-3 gap-2">
                        {["AB", "EF", "HB", "KB"].map(type => (
                            <button
                                key={type}
                                className={cn(
                                    "rounded-md border-2 py-1.5 text-xs font-medium transition-colors",
                                    type === "KB"
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border/60 text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Organisationsnummer" value="556677-8899" />
                <SettingsField label="Momsnummer" value="SE556677889901" />
            </div>

            <SectionDivider />

            <SectionTitle>Bokforingsmetod</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: "Fakturametoden", desc: "Periodiserar intakter/kostnader", selected: true },
                    { label: "Kontantmetoden", desc: "Bokfor vid betalning", selected: false },
                ].map(method => (
                    <button
                        key={method.label}
                        className={cn(
                            "rounded-lg border-2 p-3 text-left transition-colors",
                            method.selected
                                ? "border-primary bg-primary/5"
                                : "border-border/60 hover:border-primary/30"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{method.label}</span>
                            {method.selected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{method.desc}</p>
                    </button>
                ))}
            </div>

            <SectionDivider />

            <SectionTitle>Skatteinstallningar</SectionTitle>
            <div className="space-y-0 divide-y">
                <SettingsToggle label="F-skattsedel" description="Godkand for F-skatt" defaultChecked />
                <SettingsToggle label="Momsregistrerad" description="Registrerad for moms hos Skatteverket" defaultChecked />
                <SettingsToggle label="Har anstallda" description="Foretaget har registrerade anstallda" />
                <SettingsToggle label="Famansforetag (3:12)" description="Omfattas av famansforetagsreglerna" defaultChecked />
            </div>

            <SectionDivider />

            <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField label="Bankgiro" value="123-4567" />
                <SettingsField label="Plusgiro" value="" />
                <SettingsField label="Adress" value="Storgatan 12, 111 22 Stockholm" />
                <SettingsField label="Registreringsdatum" value="2020-03-15" />
            </div>

            <div className="flex justify-end pt-2">
                <Button size="sm">Spara anringar</Button>
            </div>
        </div>
    )
}

function UtseendeTab() {
    const [theme, setTheme] = useState<"light" | "dark" | "system">("dark")

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Utseende</h2>
                <p className="text-sm text-muted-foreground">Anpassa appens utseende.</p>
            </div>

            <SectionTitle>Tema</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: "light" as const, label: "Ljust", icon: Sun },
                    { id: "dark" as const, label: "Morkt", icon: Moon },
                    { id: "system" as const, label: "System", icon: Monitor },
                ].map(t => {
                    const Icon = t.icon
                    return (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            className={cn(
                                "rounded-lg border-2 p-4 text-center transition-colors",
                                theme === t.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border/60 hover:border-primary/30"
                            )}
                        >
                            <Icon className={cn("h-5 w-5 mx-auto mb-2", theme === t.id ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-sm font-medium">{t.label}</span>
                            {theme === t.id && <Check className="h-3.5 w-3.5 text-primary mx-auto mt-1" />}
                        </button>
                    )
                })}
            </div>

            <SectionDivider />

            <SectionTitle>Layout</SectionTitle>
            <div className="space-y-0 divide-y">
                <SettingsToggle label="Kompakt sidopanel" description="Visa bara ikoner i sidopanelen" />
                <SettingsToggle label="Animationer" description="Aktivera overgangsanimationer" defaultChecked />
            </div>
        </div>
    )
}

function NotiserTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Notiser</h2>
                <p className="text-sm text-muted-foreground">Valj vilka notiser du vill fa.</p>
            </div>

            <SectionTitle>E-postnotiser</SectionTitle>
            <div className="space-y-0 divide-y">
                <SettingsToggle label="Nya fakturor" description="Nar en ny faktura skapas" defaultChecked />
                <SettingsToggle label="Betalningspaminnelser" description="Nar en betalning forfallit" defaultChecked />
                <SettingsToggle label="Manadsrapporter" description="Summering av foretgets manad" defaultChecked />
                <SettingsToggle label="Skattedeadlines" description="Paminnelser infor viktiga datum" defaultChecked />
            </div>

            <SectionDivider />

            <SectionTitle>Push-notiser</SectionTitle>
            <div className="space-y-0 divide-y">
                <SettingsToggle label="Mobilnotiser" description="Fa push-notiser i appen" />
                <SettingsToggle label="Skrivbordsnotiser" description="Visa notiser i webblasaren" />
            </div>
        </div>
    )
}

function SprakTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Sprak & region</h2>
                <p className="text-sm text-muted-foreground">Sprak, valuta och regionala installningar.</p>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sprak</label>
                <select className="w-full rounded-md border-2 border-border/60 bg-background px-3 py-2 text-sm">
                    <option>Svenska</option>
                    <option>English</option>
                    <option>Norsk</option>
                    <option>Dansk</option>
                    <option>Suomi</option>
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Valuta</label>
                <select className="w-full rounded-md border-2 border-border/60 bg-background px-3 py-2 text-sm">
                    <option>SEK — Svensk krona</option>
                    <option>EUR — Euro</option>
                    <option>USD — US Dollar</option>
                    <option>NOK — Norsk krona</option>
                    <option>DKK — Dansk krona</option>
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tidszon</label>
                <select className="w-full rounded-md border-2 border-border/60 bg-background px-3 py-2 text-sm">
                    <option>Europe/Stockholm (CET)</option>
                    <option>Europe/London (GMT)</option>
                    <option>America/New_York (EST)</option>
                </select>
            </div>
        </div>
    )
}

function FaktureringTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Fakturering</h2>
                <p className="text-sm text-muted-foreground">Prenumeration, betalning och anvandning.</p>
            </div>

            {/* Current plan */}
            <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">Pro</h3>
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Aktiv</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">499 kr/man — Fornyar 1 april 2026</p>
                        </div>
                        <Button variant="outline" size="sm">
                            Hantera
                            <ExternalLink className="h-3 w-3 ml-1.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* AI Usage */}
            <div>
                <SectionTitle>AI-anvandning</SectionTitle>
                <div className="rounded-lg border-2 border-border/60 p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Anvant denna manad</span>
                        <span className="font-medium">342 / 500 meddelanden</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: "68%" }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        158 meddelanden kvar. Aterstalls 1 april.
                    </p>
                </div>
            </div>

            <SectionDivider />

            {/* Payment method */}
            <div>
                <SectionTitle>Betalningsmetod</SectionTitle>
                <div className="rounded-lg border-2 border-border/60 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-12 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            VISA
                        </div>
                        <div>
                            <p className="text-sm font-medium">**** **** **** 4242</p>
                            <p className="text-[10px] text-muted-foreground">Gar ut 12/27</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs">Andra</Button>
                </div>
            </div>

            <SectionDivider />

            {/* Billing history */}
            <div>
                <SectionTitle>Betalningshistorik</SectionTitle>
                <div className="space-y-2">
                    {[
                        { date: "2026-03-01", amount: "499 kr", status: "Betald" },
                        { date: "2026-02-01", amount: "499 kr", status: "Betald" },
                        { date: "2026-01-01", amount: "499 kr", status: "Betald" },
                    ].map((row, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 text-sm">
                            <span className="text-muted-foreground tabular-nums">{row.date}</span>
                            <span className="font-medium tabular-nums">{row.amount}</span>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                {row.status}
                            </Badge>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function IntegrationerTab() {
    const integrations = [
        { name: "BankID", desc: "Identifiering och signering", icon: Shield, status: "soon" },
        { name: "Skatteverket", desc: "Momsdeklaration, AGI", icon: Building2, status: "soon" },
        { name: "Bolagsverket", desc: "Arsredovisning", icon: Building2, status: "soon" },
        { name: "Bankkonto", desc: "Transaktionsimport", icon: CreditCard, status: "soon" },
        { name: "Bankgirot", desc: "Betalningsformedling", icon: CreditCard, status: "soon" },
        { name: "Swish", desc: "Mobilbetalningar", icon: Smartphone, status: "soon" },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Integrationer</h2>
                <p className="text-sm text-muted-foreground">Koppla externa tjanster till ditt konto.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {integrations.map(int => {
                    const Icon = int.icon
                    return (
                        <div key={int.name} className="rounded-lg border-2 border-border/60 p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{int.name}</p>
                                <p className="text-[10px] text-muted-foreground">{int.desc}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0">Snart</Badge>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function SakerhetTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-bold">Sakerhet & sekretess</h2>
                <p className="text-sm text-muted-foreground">Skydda ditt konto och hantera integritetsinstallningar.</p>
            </div>

            <SectionTitle>Tvafaktorsautentisering</SectionTitle>
            <div className="rounded-lg border-2 border-border/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">2FA</p>
                        <p className="text-[10px] text-muted-foreground">Lagg till ett extra lager av sakerhet</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-[10px]">Snart</Badge>
            </div>

            <SectionDivider />

            <SectionTitle>Aktiva sessioner</SectionTitle>
            <div className="rounded-lg border-2 border-border/60 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Monitor className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                            Denna enhet
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Aktiv</Badge>
                        </p>
                        <p className="text-[10px] text-muted-foreground">Chrome — macOS — Stockholm</p>
                    </div>
                </div>
            </div>

            <SectionDivider />

            <SectionTitle>Integritet</SectionTitle>
            <div className="space-y-0 divide-y">
                <SettingsToggle label="Analysdata" description="Hjalp oss forbattra genom anonym anvandningsdata" />
                <SettingsToggle label="Marknadsforing" description="Ta emot nyheter och erbjudanden via e-post" />
            </div>
        </div>
    )
}

export default function TestSettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>("konto")

    const tabContent: Record<SettingsTab, React.ReactNode> = {
        konto: <KontoTab />,
        foretag: <ForetagTab />,
        utseende: <UtseendeTab />,
        notiser: <NotiserTab />,
        sprak: <SprakTab />,
        fakturering: <FaktureringTab />,
        integrationer: <IntegrationerTab />,
        sakerhet: <SakerhetTab />,
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-5xl mx-auto p-6 md:p-10">
                <Link href="/test-ui" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Alla test-sidor
                </Link>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar navigation */}
                    <nav className="md:w-52 shrink-0">
                        <h1 className="text-lg font-bold tracking-tight mb-4">Installningar</h1>
                        <div className="space-y-0.5">
                            {navItems.map(item => {
                                const Icon = item.icon
                                const isActive = activeTab === item.id
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                                            isActive
                                                ? "bg-muted font-medium text-foreground"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                        {item.badge && (
                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 ml-auto shrink-0">
                                                {item.badge}
                                            </Badge>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </nav>

                    {/* Content area */}
                    <main className="flex-1 min-w-0 max-w-2xl">
                        {tabContent[activeTab]}
                    </main>
                </div>
            </div>
        </div>
    )
}
