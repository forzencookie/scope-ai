"use client"

import { useState } from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage, BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    TrendingUp, 
    Calculator, 
    Sparkles, 
    AlertTriangle, 
    CheckCircle2, 
    Expand,
    Coins,
    PiggyBank,
    ArrowRight,
    Info,
    Plus,
    Calendar,
    FileText,
    Download,
    User,
    Percent,
    BarChart3,
    HelpCircle,
    Clock,
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// Shareholders
const shareholders = [
    { id: 1, name: "Anna Andersson", shares: 800, percentage: 80, role: "VD & Grundare" },
    { id: 2, name: "Erik Eriksson", shares: 200, percentage: 20, role: "Styrelseledamot" },
]

// Dividend history
const dividendHistory = [
    { year: "2024", amount: 150000, taxRate: "20%", tax: 30000, netAmount: 120000, status: "planned", date: "2024-12-15" },
    { year: "2023", amount: 120000, taxRate: "20%", tax: 24000, netAmount: 96000, status: "paid", date: "2023-12-20" },
    { year: "2022", amount: 100000, taxRate: "20%", tax: 20000, netAmount: 80000, status: "paid", date: "2022-12-18" },
    { year: "2021", amount: 95000, taxRate: "20%", tax: 19000, netAmount: 76000, status: "paid", date: "2021-12-22" },
    { year: "2020", amount: 80000, taxRate: "20%", tax: 16000, netAmount: 64000, status: "paid", date: "2020-12-15" },
]

// K10 declarations
const k10Declarations = [
    { year: "2024", status: "draft", deadline: "2025-05-02", gransbelopp: 195250, usedAmount: 150000, savedAmount: 45250 },
    { year: "2023", status: "submitted", deadline: "2024-05-02", gransbelopp: 187550, usedAmount: 120000, savedAmount: 67550 },
    { year: "2022", status: "submitted", deadline: "2023-05-02", gransbelopp: 177100, usedAmount: 100000, savedAmount: 77100 },
]

// Terms explanations
const terms = {
    gransbelopp: "Gränsbeloppet är det maximala beloppet som kan tas ut som utdelning med 20% kapitalskatt. Beräknas enligt schablonmetoden (2,75 × inkomstbasbelopp) eller huvudregeln (lönebaserat).",
    k10: "K10-blanketten används för att deklarera kvalificerade andelar i fåmansföretag. Här beräknas gränsbelopp och hur utdelningen ska beskattas.",
    sparadUtrymme: "Outnyttjat gränsbelopp från tidigare år som kan sparas och användas för framtida utdelningar. Uppräknas årligen med statslåneräntan + 3%.",
    treToTolv: "3:12-reglerna är särskilda skatteregler för delägare i fåmansföretag. De styr hur utdelning och kapitalvinst ska beskattas - antingen som kapital (20%) eller tjänst (upp till 52%).",
    schablonmetoden: "Enkel beräkningsmetod för gränsbelopp: 2,75 × inkomstbasbeloppet. För 2024 är detta 2,75 × 74 300 = 204 325 kr (för 100% ägarandel).",
    huvudregeln: "Alternativ beräkningsmetod baserad på löneunderlag i företaget. Fördelaktig om företaget har anställda med höga löner.",
}

export default function DividendsPage() {
    const [plannedDividend, setPlannedDividend] = useState(150000)
    const [showCalculator, setShowCalculator] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<"schablon" | "huvudregel">("schablon")

    const ibb2024 = 74300 // Inkomstbasbelopp 2024
    const schablonBelopp = Math.round(2.75 * ibb2024)
    const sparatUtrymme = 45250
    const totalGransbelopp = schablonBelopp + sparatUtrymme

    const isWithinLimit = plannedDividend <= totalGransbelopp
    const taxAmount = Math.round(plannedDividend * 0.20)
    const netAmount = plannedDividend - taxAmount

    const excessAmount = plannedDividend > totalGransbelopp ? plannedDividend - totalGransbelopp : 0
    const excessTax = Math.round(excessAmount * 0.52) // Approximate tjänstebeskattning

    return (
        <TooltipProvider>
            <>
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/payroll">Löner</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Utdelning</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>
                <div className="flex-1 flex flex-col bg-background">
                    {/* Page Content */}
                    <main className="flex-1 flex flex-col p-6 gap-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold flex items-center gap-2">
                                    <Coins className="h-6 w-6" />
                                    Utdelning
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Planera och beräkna utdelning enligt 3:12-reglerna
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Calculator className="h-4 w-4 mr-2" />
                                            Beräkna utdelning
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-lg">
                                        <DialogHeader>
                                            <DialogTitle>Beräkna utdelning 2024</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Välj beräkningsmetod</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={() => setSelectedMethod("schablon")}
                                                        className={`p-3 rounded-lg border text-left transition-colors ${
                                                            selectedMethod === "schablon" 
                                                                ? "border-primary bg-primary/5" 
                                                                : "border-border/50 hover:bg-muted/30"
                                                        }`}
                                                    >
                                                        <p className="font-medium">Schablonmetoden</p>
                                                        <p className="text-xs text-muted-foreground mt-1">2,75 × IBB = {schablonBelopp.toLocaleString()} kr</p>
                                                    </button>
                                                    <button 
                                                        onClick={() => setSelectedMethod("huvudregel")}
                                                        className={`p-3 rounded-lg border text-left transition-colors ${
                                                            selectedMethod === "huvudregel" 
                                                                ? "border-primary bg-primary/5" 
                                                                : "border-border/50 hover:bg-muted/30"
                                                        }`}
                                                    >
                                                        <p className="font-medium">Huvudregeln</p>
                                                        <p className="text-xs text-muted-foreground mt-1">Baserat på löneunderlag</p>
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium mb-2 block">Planerad utdelning</label>
                                                <div className="relative">
                                                    <Input 
                                                        type="number"
                                                        value={plannedDividend}
                                                        onChange={(e) => setPlannedDividend(Number(e.target.value))}
                                                        className="pr-12"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kr</span>
                                                </div>
                                            </div>
                                            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Gränsbelopp</span>
                                                    <span className="font-medium">{schablonBelopp.toLocaleString()} kr</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">+ Sparat utrymme</span>
                                                    <span className="font-medium">{sparatUtrymme.toLocaleString()} kr</span>
                                                </div>
                                                <Separator />
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">Totalt gränsbelopp</span>
                                                    <span className="font-medium text-green-600">{totalGransbelopp.toLocaleString()} kr</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-muted-foreground">Kapitalskatt (20%)</span>
                                                    <span className="text-sm font-medium text-red-600">-{taxAmount.toLocaleString()} kr</span>
                                                </div>
                                                {excessAmount > 0 && (
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Tjänsteskatt på överskott</span>
                                                        <span className="text-sm font-medium text-red-600">-{excessTax.toLocaleString()} kr</span>
                                                    </div>
                                                )}
                                                <Separator />
                                                <div className="flex justify-between">
                                                    <span className="font-medium">Netto efter skatt</span>
                                                    <span className="font-medium text-green-600">{(plannedDividend - taxAmount - excessTax).toLocaleString()} kr</span>
                                                </div>
                                            </div>
                                            {!isWithinLimit && (
                                                <div className="border border-border/50 rounded-lg p-3 flex items-start gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Utdelningen överstiger gränsbeloppet med {excessAmount.toLocaleString()} kr. 
                                                        Detta belopp beskattas som tjänst (~52%).
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <DialogClose asChild>
                                                <Button variant="outline">Avbryt</Button>
                                            </DialogClose>
                                            <Button>Spara planering</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Button variant="outline">
                                    <FileText className="h-4 w-4 mr-2" />
                                    K10-blankett
                                </Button>
                            </div>
                        </div>

                        {/* 3:12 Rules Info */}
                        <div className="border border-border/50 rounded-lg p-4 flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">3:12-reglerna</p>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>{terms.treToTolv}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Som fåmansföretagare gäller särskilda regler. Utdelning inom gränsbeloppet beskattas med 20% kapitalskatt. 
                                    Utdelning över gränsbeloppet beskattas som tjänst (upp till 52%).
                                </p>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-card border border-border/40 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Gränsbelopp 2024</p>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>{terms.gransbelopp}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <p className="text-2xl font-semibold">{schablonBelopp.toLocaleString()} kr</p>
                                <p className="text-xs text-muted-foreground mt-1">Schablonmetoden (2,75 × {ibb2024.toLocaleString()} kr)</p>
                            </div>
                            <div className="bg-card border border-border/40 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Sparat utrymme</p>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>{terms.sparadUtrymme}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <p className="text-2xl font-semibold text-blue-600">{sparatUtrymme.toLocaleString()} kr</p>
                                <p className="text-xs text-muted-foreground mt-1">Från tidigare år</p>
                            </div>
                            <div className="bg-card border border-border/40 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Coins className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Planerad utdelning</p>
                                </div>
                                <p className="text-2xl font-semibold">{plannedDividend.toLocaleString()} kr</p>
                                <p className={`text-xs mt-1 ${isWithinLimit ? "text-green-600" : "text-amber-600"}`}>
                                    {isWithinLimit ? "✓ Inom gränsbeloppet" : "⚠ Överstiger gränsbeloppet"}
                                </p>
                            </div>
                            <div className="bg-card border border-border/40 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">Skatt på utdelning</p>
                                </div>
                                <p className="text-2xl font-semibold text-red-600">{taxAmount.toLocaleString()} kr</p>
                                <p className="text-xs text-muted-foreground mt-1">20% kapitalskatt</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Shareholders */}
                            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                                    <h2 className="font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Delägare
                                    </h2>
                                </div>
                                <div className="divide-y divide-border/40">
                                    {shareholders.map((sh) => (
                                        <div key={sh.id} className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{sh.name}</p>
                                                <p className="text-sm text-muted-foreground">{sh.role}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{sh.percentage}%</p>
                                                <p className="text-sm text-muted-foreground">{sh.shares} aktier</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-3 border-t border-border/40 bg-muted/30">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Utdelning per 100 aktier</span>
                                        <span className="font-medium">{(plannedDividend / 10).toLocaleString()} kr</span>
                                    </div>
                                </div>
                            </div>

                            {/* K10 Declarations */}
                            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                                    <h2 className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        K10-deklarationer
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>{terms.k10}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </h2>
                                </div>
                                <div className="divide-y divide-border/40">
                                    {k10Declarations.map((k10) => (
                                        <div key={k10.year} className="p-4 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                                            <div>
                                                <p className="font-medium">Inkomstår {k10.year}</p>
                                                <p className="text-sm text-muted-foreground">Deadline: {k10.deadline}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {k10.status === "draft" ? (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                                                        Utkast
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                                                        Inlämnad
                                                    </span>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Dividend History */}
                            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                                    <h2 className="font-medium flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Utdelningshistorik
                                    </h2>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                                <Expand className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Utdelningshistorik</DialogTitle>
                                            </DialogHeader>
                                            <div className="max-h-[60vh] overflow-y-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-muted/50">
                                                        <tr className="border-b border-border/40 text-left text-muted-foreground">
                                                            <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />År</span></th>
                                                            <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Datum</span></th>
                                                            <th className="px-4 py-3 font-medium text-right"><span className="flex items-center justify-end gap-2"><Coins className="h-3.5 w-3.5" />Belopp</span></th>
                                                            <th className="px-4 py-3 font-medium text-right"><span className="flex items-center justify-end gap-2"><Percent className="h-3.5 w-3.5" />Skatt</span></th>
                                                            <th className="px-4 py-3 font-medium text-right"><span className="flex items-center justify-end gap-2"><PiggyBank className="h-3.5 w-3.5" />Netto</span></th>
                                                            <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" />Status</span></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dividendHistory.map((div) => (
                                                            <tr key={div.year} className="border-b border-border/40 hover:bg-muted/30">
                                                                <td className="px-4 py-3 font-medium">{div.year}</td>
                                                                <td className="px-4 py-3 text-muted-foreground">{div.date}</td>
                                                                <td className="px-4 py-3 text-right">{div.amount.toLocaleString()} kr</td>
                                                                <td className="px-4 py-3 text-right text-red-600">-{div.tax.toLocaleString()} kr</td>
                                                                <td className="px-4 py-3 text-right text-green-600">{div.netAmount.toLocaleString()} kr</td>
                                                                <td className="px-4 py-3">
                                                                    {div.status === "planned" ? (
                                                                        <span className="inline-flex items-center gap-1.5 text-amber-600">
                                                                            <Calendar className="h-3.5 w-3.5" />
                                                                            Planerad
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 text-green-600">
                                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                                            Utbetald
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                <div className="divide-y divide-border/40">
                                    {dividendHistory.slice(0, 4).map((div) => (
                                        <div key={div.year} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                            <div>
                                                <p className="font-medium">{div.year}</p>
                                                <p className="text-sm text-muted-foreground">{div.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium">{div.amount.toLocaleString()} kr</p>
                                                {div.status === "planned" ? (
                                                    <p className="text-xs text-amber-600">Planerad</p>
                                                ) : (
                                                    <p className="text-xs text-green-600">Utbetald</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </>
        </TooltipProvider>
    )
}
