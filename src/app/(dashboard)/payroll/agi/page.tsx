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
    DataTable,
    DataTableHeader,
    DataTableHeaderCell,
    DataTableBody,
    DataTableRow,
    DataTableCell,
} from "@/components/ui/data-table"
import { Search, Settings, Download, Send, CheckCircle2, Clock, Sparkles, Calendar, Banknote, Users, Wallet, Calculator } from "lucide-react"

const agiReports = [
    { period: "December 2024", dueDate: "12 jan 2025", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "pending" },
    { period: "November 2024", dueDate: "12 dec 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
    { period: "Oktober 2024", dueDate: "12 nov 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
    { period: "September 2024", dueDate: "12 okt 2024", employees: 2, totalSalary: 85000, tax: 20400, contributions: 26690, status: "submitted" },
]

export default function AGIPage() {
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
                                <BreadcrumbPage>AGI</BreadcrumbPage>
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
                            Skapa AGI
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Nästa AGI</p>
                            <p className="text-2xl font-semibold mt-1">December 2024</p>
                            <p className="text-sm text-amber-600 mt-1">Deadline: 12 jan 2025</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Skatteavdrag</p>
                            <p className="text-2xl font-semibold mt-1">20 400 kr</p>
                            <p className="text-sm text-muted-foreground mt-1">Preliminärskatt</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Arbetsgivaravgifter</p>
                            <p className="text-2xl font-semibold mt-1">26 690 kr</p>
                            <p className="text-sm text-muted-foreground mt-1">31,42% av bruttolön</p>
                        </div>
                    </div>

                    {/* AI Notice */}
                    <div className="border border-border/50 rounded-lg p-4 flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">Automatisk AGI-hantering</p>
                            <p className="text-sm text-muted-foreground mt-1">Vår AI skapar arbetsgivardeklarationen automatiskt baserat på löneutbetalningar och beräknar korrekta skatteavdrag och arbetsgivaravgifter.</p>
                        </div>
                    </div>

                    {/* AGI Reports Table */}
                    <DataTable title="Arbetsgivardeklarationer (AGI)">
                        <DataTableHeader>
                            <DataTableHeaderCell icon={Calendar} label="Period" />
                            <DataTableHeaderCell icon={Clock} label="Deadline" />
                            <DataTableHeaderCell icon={Users} label="Anställda" />
                            <DataTableHeaderCell icon={Banknote} label="Bruttolön" />
                            <DataTableHeaderCell icon={Wallet} label="Skatteavdrag" />
                            <DataTableHeaderCell icon={Calculator} label="Arbetsgivaravgifter" />
                            <DataTableHeaderCell icon={CheckCircle2} label="Status" />
                            <DataTableHeaderCell label="" />
                        </DataTableHeader>
                        <DataTableBody>
                            {agiReports.map((report) => (
                                <DataTableRow key={report.period}>
                                    <DataTableCell bold>{report.period}</DataTableCell>
                                    <DataTableCell muted>{report.dueDate}</DataTableCell>
                                    <DataTableCell>{report.employees}</DataTableCell>
                                    <DataTableCell>{report.totalSalary.toLocaleString()} kr</DataTableCell>
                                    <DataTableCell>{report.tax.toLocaleString()} kr</DataTableCell>
                                    <DataTableCell>{report.contributions.toLocaleString()} kr</DataTableCell>
                                    <DataTableCell>
                                        {report.status === "pending" ? (
                                            <span className="inline-flex items-center gap-1.5 text-amber-600">
                                                <Clock className="h-3.5 w-3.5" />
                                                Väntar
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-green-600">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Inskickad
                                            </span>
                                        )}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <div className="flex items-center gap-1">
                                            <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                <Download className="h-4 w-4" />
                                            </button>
                                            {report.status === "pending" && (
                                                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </DataTableCell>
                                </DataTableRow>
                            ))}
                        </DataTableBody>
                    </DataTable>
                </main>
            </div>
        </>
    )
}
