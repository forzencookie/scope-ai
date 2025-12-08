import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage, BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, Settings, CheckCircle2, Clock, Download, Send } from "lucide-react"

const vatPeriods = [
    { period: "Q4 2024", dueDate: "12 feb 2025", status: "upcoming", salesVat: 125000, inputVat: 45000, netVat: 80000 },
    { period: "Q3 2024", dueDate: "12 nov 2024", status: "submitted", salesVat: 118500, inputVat: 42300, netVat: 76200 },
    { period: "Q2 2024", dueDate: "12 aug 2024", status: "submitted", salesVat: 132000, inputVat: 48500, netVat: 83500 },
    { period: "Q1 2024", dueDate: "12 maj 2024", status: "submitted", salesVat: 98000, inputVat: 35200, netVat: 62800 },
]

export default function VATDeclarationPage() {
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
                                <BreadcrumbLink href="/reports">Rapporter</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Momsdeklaration</BreadcrumbPage>
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
                        <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Skapa deklaration
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Nästa deklaration</p>
                            <p className="text-2xl font-semibold mt-1">Q4 2024</p>
                            <p className="text-sm text-muted-foreground mt-1">Deadline: 12 feb 2025</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Beräknad moms att betala</p>
                            <p className="text-2xl font-semibold mt-1">80 000 kr</p>
                            <p className="text-sm text-green-600 mt-1">Utgående: 125 000 kr</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Ingående moms</p>
                            <p className="text-2xl font-semibold mt-1">45 000 kr</p>
                            <p className="text-sm text-muted-foreground mt-1">Avdragsgill</p>
                        </div>
                    </div>

                    {/* VAT Periods Table */}
                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/40">
                            <h2 className="font-medium">Momsperioder</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/40 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">Period</th>
                                    <th className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">Deadline</th>
                                    <th className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">Utgående moms</th>
                                    <th className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">Ingående moms</th>
                                    <th className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">Att betala</th>
                                    <th className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">Status</th>
                                    <th className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {vatPeriods.map((item) => (
                                    <tr key={item.period} className="border-b border-border/40 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">{item.period}</td>
                                        <td className="px-4 py-3 text-muted-foreground border-r border-border/40 last:border-r-0">{item.dueDate}</td>
                                        <td className="px-4 py-3 border-r border-border/40 last:border-r-0">{item.salesVat.toLocaleString()} kr</td>
                                        <td className="px-4 py-3 border-r border-border/40 last:border-r-0">{item.inputVat.toLocaleString()} kr</td>
                                        <td className="px-4 py-3 font-medium border-r border-border/40 last:border-r-0">{item.netVat.toLocaleString()} kr</td>
                                        <td className="px-4 py-3 border-r border-border/40 last:border-r-0">
                                            {item.status === "upcoming" ? (
                                                <span className="inline-flex items-center gap-1.5 text-amber-600">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Kommande
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-green-600">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Inskickad
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 border-r border-border/40 last:border-r-0">
                                            <div className="flex items-center gap-1">
                                                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                {item.status === "upcoming" && (
                                                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                        <Send className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
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
