"use client"

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
import { Search, Settings, Clock, Download, Sparkles, Send, FileText, FileBarChart, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const ink2Fields = [
    { field: "1.1", label: "Nettoomsättning", value: 1850000 },
    { field: "1.4", label: "Övriga rörelseintäkter", value: 0 },
    { field: "2.1", label: "Råvaror och förnödenheter", value: -320000 },
    { field: "2.4", label: "Övriga externa kostnader", value: -580000 },
    { field: "2.5", label: "Personalkostnader", value: -520000 },
    { field: "2.7", label: "Avskrivningar", value: -45000 },
    { field: "3.1", label: "Ränteintäkter", value: 2500 },
    { field: "3.3", label: "Räntekostnader", value: -8500 },
    { field: "4.1", label: "Bokfört resultat", value: 379000 },
]

export default function IncomeDeclarationPage() {
    return (
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
                                <BreadcrumbLink href="/reports">Rapporter</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Inkomstdeklaration</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <BreadcrumbAIBadge />
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
                            <Sparkles className="h-4 w-4" />
                            Generera med AI
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Beskattningsår</p>
                            <p className="text-2xl font-semibold mt-1">2024</p>
                            <p className="text-sm text-muted-foreground mt-1">Inkomstdeklaration 2</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Bokfört resultat</p>
                            <p className="text-2xl font-semibold mt-1">379 000 kr</p>
                            <p className="text-sm text-green-600 mt-1">Före skattemässiga justeringar</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <p className="text-lg font-semibold">Utkast</p>
                            </div>
                            <p className="text-sm text-amber-600 mt-1">Deadline: 1 jul 2025</p>
                        </div>
                    </div>

                    {/* INK2 Table */}
                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                            <h2 className="font-medium">INK2 – Fält</h2>
                            <div className="flex items-center gap-2">
                                <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                    <Download className="h-4 w-4" />
                                    Exportera SRU
                                </button>
                                <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground ml-4">
                                    <Send className="h-4 w-4" />
                                    Skicka till Skatteverket
                                </button>
                            </div>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b border-border/40 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium w-24"><span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" />Fält</span></th>
                                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><FileBarChart className="h-3.5 w-3.5" />Beskrivning</span></th>
                                    <th className="px-4 py-3 font-medium text-right"><span className="flex items-center justify-end gap-2"><Wallet className="h-3.5 w-3.5" />Belopp</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ink2Fields.map((item) => (
                                    <tr key={item.field} className="border-b border-border/40 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-mono text-muted-foreground">{item.field}</td>
                                        <td className="px-4 py-3">{item.label}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${item.value < 0 ? 'text-red-600' : ''}`}>
                                            {item.value.toLocaleString('sv-SE')} kr
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>
            </div>
        </>
    )
}
