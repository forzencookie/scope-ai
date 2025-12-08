"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage, BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Search, Settings, TrendingUp, Calculator, Sparkles, AlertTriangle, CheckCircle2, Expand } from "lucide-react"

const dividendHistory = [
    { year: "2024", amount: 150000, taxRate: "20%", tax: 30000, netAmount: 120000, status: "planned" },
    { year: "2023", amount: 120000, taxRate: "20%", tax: 24000, netAmount: 96000, status: "paid" },
    { year: "2022", amount: 100000, taxRate: "20%", tax: 20000, netAmount: 80000, status: "paid" },
    { year: "2021", amount: 95000, taxRate: "20%", tax: 19000, netAmount: 76000, status: "paid" },
    { year: "2020", amount: 80000, taxRate: "20%", tax: 16000, netAmount: 64000, status: "paid" },
    { year: "2019", amount: 75000, taxRate: "20%", tax: 15000, netAmount: 60000, status: "paid" },
    { year: "2018", amount: 60000, taxRate: "20%", tax: 12000, netAmount: 48000, status: "paid" },
]

// Table component to reuse in card and modal
function DividendTable({ data, maxRows }: { data: typeof dividendHistory; maxRows?: number }) {
    const displayData = maxRows ? data.slice(0, maxRows) : data
    
    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">År</th>
                    <th className="px-4 py-3 font-medium">Belopp</th>
                    <th className="px-4 py-3 font-medium">Skatt</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                </tr>
            </thead>
            <tbody>
                {displayData.map((div) => (
                    <tr key={div.year} className="border-b border-border/40 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{div.year}</td>
                        <td className="px-4 py-3">{div.amount.toLocaleString()} kr</td>
                        <td className="px-4 py-3 text-red-600">-{div.tax.toLocaleString()} kr</td>
                        <td className="px-4 py-3">
                            {div.status === "planned" ? (
                                <span className="inline-flex items-center gap-1.5 text-amber-600">
                                    <TrendingUp className="h-3.5 w-3.5" />
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
    )
}

export default function DividendsPage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
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
            </header>
            <div className="flex-1 flex flex-col bg-background">
                {/* Action Buttons Bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-card">
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                            <Search className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                            <Settings className="h-4 w-4" />
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            <Calculator className="h-4 w-4" />
                            Beräkna utdelning
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Gränsbelopp 2024</p>
                            <p className="text-2xl font-semibold mt-1">195 250 kr</p>
                            <p className="text-sm text-muted-foreground mt-1">Schablonmetoden (2,75 IBB)</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Planerad utdelning</p>
                            <p className="text-2xl font-semibold mt-1">150 000 kr</p>
                            <p className="text-sm text-green-600 mt-1">Inom gränsbeloppet</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Skatt på utdelning</p>
                            <p className="text-2xl font-semibold mt-1">30 000 kr</p>
                            <p className="text-sm text-muted-foreground mt-1">20% kapitalskatt</p>
                        </div>
                    </div>

                    {/* 3:12 Rules Info */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-900">3:12-reglerna</p>
                            <p className="text-sm text-amber-700 mt-1">Som fåmansföretagare gäller särskilda regler för utdelning. Utdelning inom gränsbeloppet beskattas med 20% kapitalskatt. Utdelning över gränsbeloppet beskattas som tjänst.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Dividend Calculator */}
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-medium">Utdelningskalkylator</h2>
                                <Sparkles className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted-foreground">Löneunderlag</label>
                                    <p className="text-lg font-semibold">1 020 000 kr</p>
                                    <p className="text-xs text-muted-foreground">Kontrolluppgiftsbaserat</p>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">Sparat utdelningsutrymme</label>
                                    <p className="text-lg font-semibold">45 000 kr</p>
                                    <p className="text-xs text-muted-foreground">Från tidigare år</p>
                                </div>
                                <div>
                                    <label className="text-sm text-muted-foreground">Totalt gränsbelopp</label>
                                    <p className="text-lg font-semibold text-green-600">240 250 kr</p>
                                    <p className="text-xs text-muted-foreground">Schablonbelopp + sparat</p>
                                </div>
                            </div>
                        </div>

                        {/* Dividend History */}
                        <div className="bg-card border border-border/40 rounded-lg overflow-hidden flex flex-col">
                            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                                <h2 className="font-medium">Utdelningshistorik</h2>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <Expand className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>Utdelningshistorik</DialogTitle>
                                        </DialogHeader>
                                        <div className="max-h-[60vh] overflow-y-auto">
                                            <DividendTable data={dividendHistory} />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            {/* Show only 4 rows max, overflow hidden */}
                            <div className="max-h-[200px] overflow-hidden">
                                <DividendTable data={dividendHistory} maxRows={4} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}
