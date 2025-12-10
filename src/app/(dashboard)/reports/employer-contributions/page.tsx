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
import { Search, Settings, CheckCircle2, Clock, Download, Users, Calendar, Banknote, Wallet } from "lucide-react"

const contributionPeriods = [
    { month: "December 2024", dueDate: "12 jan 2025", status: "upcoming", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "November 2024", dueDate: "12 dec 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "Oktober 2024", dueDate: "12 nov 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "September 2024", dueDate: "12 okt 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
    { month: "Augusti 2024", dueDate: "12 sep 2024", status: "submitted", grossSalary: 85000, contributions: 26690, employees: 2 },
]

export default function EmployerContributionsPage() {
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
                                <BreadcrumbPage>Arbetsgivaravgifter</BreadcrumbPage>
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
                            Beräkna avgifter
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Aktuell avgiftssats</p>
                            <p className="text-2xl font-semibold mt-1">31,42%</p>
                            <p className="text-sm text-muted-foreground mt-1">Standard arbetsgivaravgift</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Nästa betalning</p>
                            <p className="text-2xl font-semibold mt-1">26 690 kr</p>
                            <p className="text-sm text-amber-600 mt-1">Deadline: 12 jan 2025</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Anställda</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <p className="text-2xl font-semibold">2</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Aktiva anställda</p>
                        </div>
                    </div>

                    {/* Contributions Table */}
                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/40">
                            <h2 className="font-medium">Arbetsgivaravgifter per månad</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b border-border/40 text-left text-muted-foreground">
                                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" />Månad</span></th>
                                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />Deadline</span></th>
                                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Banknote className="h-3.5 w-3.5" />Bruttolön</span></th>
                                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" />Anställda</span></th>
                                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><Wallet className="h-3.5 w-3.5" />Avgift att betala</span></th>
                                    <th className="px-4 py-3 font-medium"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" />Status</span></th>
                                    <th className="px-4 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {contributionPeriods.map((item) => (
                                    <tr key={item.month} className="border-b border-border/40 hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{item.month}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.dueDate}</td>
                                        <td className="px-4 py-3">{item.grossSalary.toLocaleString()} kr</td>
                                        <td className="px-4 py-3">{item.employees}</td>
                                        <td className="px-4 py-3 font-medium">{item.contributions.toLocaleString()} kr</td>
                                        <td className="px-4 py-3">
                                            {item.status === "upcoming" ? (
                                                <span className="inline-flex items-center gap-1.5 text-amber-600">
                                                    <Clock className="h-3.5 w-3.5" />
                                                    Kommande
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-green-600">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Betald
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                                    <Download className="h-4 w-4" />
                                                </button>
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
