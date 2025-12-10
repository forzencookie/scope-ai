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
import { Search, Settings, Download, Send, User, CheckCircle2, Clock, Calendar, Banknote, Wallet } from "lucide-react"
import { TableShell, HeaderCell, AmountText } from "@/components/table/table-shell"

const payslips = [
    { id: 1, employee: "Anna Andersson", period: "December 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "pending" },
    { id: 2, employee: "Erik Eriksson", period: "December 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "pending" },
    { id: 3, employee: "Anna Andersson", period: "November 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "sent" },
    { id: 4, employee: "Erik Eriksson", period: "November 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "sent" },
    { id: 5, employee: "Anna Andersson", period: "Oktober 2024", grossSalary: 45000, netSalary: 34200, tax: 10800, status: "sent" },
    { id: 6, employee: "Erik Eriksson", period: "Oktober 2024", grossSalary: 40000, netSalary: 30400, tax: 9600, status: "sent" },
]

export default function PayslipsPage() {
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
                                <BreadcrumbLink href="/payroll">Löner</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Lönespecifikationer</BreadcrumbPage>
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
                        <button className="px-4 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Skapa lönespec
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Aktuell period</p>
                            <p className="text-2xl font-semibold mt-1">December 2024</p>
                            <p className="text-sm text-muted-foreground mt-1">2 anställda</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Total bruttolön</p>
                            <p className="text-2xl font-semibold mt-1">85 000 kr</p>
                            <p className="text-sm text-muted-foreground mt-1">Denna månad</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Skatt att betala</p>
                            <p className="text-2xl font-semibold mt-1">20 400 kr</p>
                            <p className="text-sm text-amber-600 mt-1">Deadline: 12 jan 2025</p>
                        </div>
                    </div>

                    {/* Payslips Table */}
                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/40">
                            <h2 className="font-medium">Lönespecifikationer</h2>
                        </div>
                        <TableShell
                            header={
                                <tr className="border-b border-border/40 text-left text-muted-foreground">
                                    <HeaderCell label="Anställd" icon={<User className="h-3.5 w-3.5" />} minWidth="min-w-[200px]" />
                                    <HeaderCell label="Period" icon={<Calendar className="h-3.5 w-3.5" />} minWidth="min-w-[140px]" />
                                    <HeaderCell label="Bruttolön" icon={<Banknote className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                                    <HeaderCell label="Skatt" icon={<Banknote className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                                    <HeaderCell label="Nettolön" icon={<Wallet className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                                    <HeaderCell label="Status" icon={<CheckCircle2 className="h-3.5 w-3.5" />} minWidth="min-w-[130px]" />
                                    <HeaderCell label="Åtgärder" icon={<Download className="h-3.5 w-3.5" />} minWidth="min-w-[120px]" align="right" />
                                </tr>
                            }
                        >
                            {payslips.map((slip) => (
                                <tr key={slip.id} className="border-b border-border/40 hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <span className="font-medium">{slip.employee}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{slip.period}</td>
                                    <td className="px-4 py-3 text-right"><AmountText value={slip.grossSalary} /></td>
                                    <td className="px-4 py-3 text-right text-red-600">-{slip.tax.toLocaleString()} kr</td>
                                    <td className="px-4 py-3 text-right font-medium"><AmountText value={slip.netSalary} /></td>
                                    <td className="px-4 py-3">
                                        {slip.status === "pending" ? (
                                            <span className="inline-flex items-center gap-1.5 text-amber-600">
                                                <Clock className="h-3.5 w-3.5" />
                                                Väntar
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-green-600">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Skickad
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {slip.status === "pending" && (
                                                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </TableShell>
                    </div>
                </main>
            </div>
        </>
    )
}
