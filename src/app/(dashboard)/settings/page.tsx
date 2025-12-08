import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Building2, Users, Puzzle, Plus } from "lucide-react"
import Link from "next/link"

const items = [
    {
        title: "Företags information",
        href: "/settings/company-info",
        icon: Building2
    },
    {
        title: "Team och anställda",
        href: "/settings/team",
        icon: Users
    },
    {
        title: "Integrationer",
        href: "/settings/integrations",
        icon: Puzzle
    },
]

export default function SettingsPage() {
    return (
        <div className="flex flex-col h-svh">
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
                                <BreadcrumbPage>Inställningar</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 flex flex-col items-center bg-background p-6 pt-10">
                <div className="w-full max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Header & Navigation */}
                        <div className="flex flex-col gap-8">
                            <div className="flex items-center gap-4">
                                <h1 className="text-3xl font-bold">Inställningar</h1>
                                <span className="text-4xl">⚙️</span>
                            </div>

                            <div className="space-y-1">
                                {items.map((item) => (
                                    <Link 
                                        key={item.href} 
                                        href={item.href} 
                                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-md transition-colors group"
                                    >
                                        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-medium border-b border-transparent group-hover:border-foreground/20 transition-colors">
                                            {item.title}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Info Cards */}
                        <div className="bg-muted/30 rounded-xl p-6 h-fit border border-border/50">
                            <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Översikt</h3>
                            <div className="space-y-4">
                                <div className="bg-background rounded-lg p-4 border border-border/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Team</span>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Active</span>
                                    </div>
                                    <div className="text-2xl font-bold">4 Anställda</div>
                                    <div className="text-xs text-muted-foreground mt-1">Senast uppdaterad: Igår</div>
                                </div>
                                
                                <div className="bg-background rounded-lg p-4 border border-border/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Integrationer</span>
                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">2 Aktiva</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-6 w-6 rounded bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-600">F</div>
                                        <div className="h-6 w-6 rounded bg-green-500/10 flex items-center justify-center text-xs font-bold text-green-600">S</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">Fortnox & Skatteverket</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
