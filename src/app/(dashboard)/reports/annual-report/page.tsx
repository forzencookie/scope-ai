import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Search, Settings, CheckCircle2, Clock, Download, FileText, Sparkles, Building2 } from "lucide-react"

const reportSections = [
    { name: "Förvaltningsberättelse", status: "complete", description: "Verksamhetsbeskrivning och väsentliga händelser" },
    { name: "Resultaträkning", status: "complete", description: "Intäkter, kostnader och årets resultat" },
    { name: "Balansräkning", status: "complete", description: "Tillgångar, skulder och eget kapital" },
    { name: "Noter", status: "incomplete", description: "Tilläggsupplysningar och redovisningsprinciper" },
    { name: "Underskrifter", status: "pending", description: "Styrelsens underskrifter" },
]

export default function AnnualReportPage() {
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
                                <BreadcrumbPage>Årsredovisning</BreadcrumbPage>
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
                            Generera årsredovisning
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Räkenskapsår</p>
                            <p className="text-2xl font-semibold mt-1">2024</p>
                            <p className="text-sm text-muted-foreground mt-1">2024-01-01 – 2024-12-31</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Bolagsform</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                <p className="text-lg font-semibold">Aktiebolag (AB)</p>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">K2-regelverk</p>
                        </div>
                        <div className="bg-card border border-border/40 rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-5 w-5 text-amber-500" />
                                <p className="text-lg font-semibold">Under arbete</p>
                            </div>
                            <p className="text-sm text-amber-600 mt-1">Deadline: 30 jun 2025</p>
                        </div>
                    </div>

                    {/* AI Notice */}
                    <div className="border border-border/50 rounded-lg p-4 flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">AI-genererad årsredovisning</p>
                            <p className="text-sm text-muted-foreground mt-1">Låt vår AI skapa en komplett årsredovisning enligt K2-regelverket baserat på din bokföring. Alla siffror hämtas automatiskt.</p>
                        </div>
                    </div>

                    {/* Report Sections */}
                    <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                            <h2 className="font-medium">Delar av årsredovisningen</h2>
                            <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                <Download className="h-4 w-4" />
                                Ladda ner utkast
                            </button>
                        </div>
                        <div className="divide-y divide-border/40">
                            {reportSections.map((section) => (
                                <div key={section.name} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{section.name}</p>
                                            <p className="text-sm text-muted-foreground">{section.description}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {section.status === "complete" ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                                Klar
                                            </span>
                                        ) : section.status === "incomplete" ? (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-amber-600">
                                                <Clock className="h-4 w-4" />
                                                Ofullständig
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                Väntar
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}
