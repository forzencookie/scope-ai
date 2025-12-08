import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage, BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserPlus, FolderPlus, ListTodo, Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react"

import { TeamMemberCard, TeamMember } from "@/components/team-member-card"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"

// Dummy team members data
const teamMembers: TeamMember[] = [
    {
        id: "1",
        name: "Erik Lindqvist",
        role: "VD",
        status: "active",
        department: "Ledning",
        joiningDate: "15 jan, 2019",
        email: "erik.lindqvist@foretag.se",
        phone: "070-123 45 67",
    },
    {
        id: "2",
        name: "Anna Svensson",
        role: "Ekonomichef",
        status: "active",
        department: "Ekonomi",
        joiningDate: "3 mar, 2020",
        email: "anna.svensson@foretag.se",
        phone: "070-234 56 78",
    },
    {
        id: "3",
        name: "Johan Bergström",
        role: "Utvecklare",
        status: "remote",
        department: "IT",
        joiningDate: "20 aug, 2021",
        email: "johan.bergstrom@foretag.se",
        phone: "070-345 67 89",
    },
    {
        id: "4",
        name: "Maria Karlsson",
        role: "HR-chef",
        status: "active",
        department: "Personal",
        joiningDate: "8 jun, 2018",
        email: "maria.karlsson@foretag.se",
        phone: "070-456 78 90",
    },
    {
        id: "5",
        name: "Oscar Nilsson",
        role: "Säljare",
        status: "part-time",
        department: "Försäljning",
        joiningDate: "12 nov, 2022",
        email: "oscar.nilsson@foretag.se",
        phone: "070-567 89 01",
    },
    {
        id: "6",
        name: "Sofia Andersson",
        role: "Designer",
        status: "remote",
        department: "Marknadsföring",
        joiningDate: "5 feb, 2023",
        email: "sofia.andersson@foretag.se",
        phone: "070-678 90 12",
    },
    {
        id: "7",
        name: "Marcus Johansson",
        role: "Projektledare",
        status: "active",
        department: "Projekt",
        joiningDate: "28 sep, 2020",
        email: "marcus.johansson@foretag.se",
        phone: "070-789 01 23",
    },
    {
        id: "8",
        name: "Elin Pettersson",
        role: "Kundtjänst",
        status: "part-time",
        department: "Support",
        joiningDate: "17 apr, 2024",
        email: "elin.pettersson@foretag.se",
        phone: "070-890 12 34",
    },
]

export default function TeamPage() {
    console.log("Rendering TeamPage")
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
                                <BreadcrumbLink href="/settings">Inställningar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Team och anställda</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 flex flex-col bg-background">
                {/* Action Buttons Bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-card">
                    <div className="flex items-center gap-2">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                            <UserPlus className="h-4 w-4" />
                            Ny medlem
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted/50 transition-colors">
                            <FolderPlus className="h-4 w-4" />
                            Nytt projekt
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted/50 transition-colors">
                            <ListTodo className="h-4 w-4" />
                            Ny uppgift
                        </button>
                    </div>
                </div>

                {/* Page Content */}
                <main className="flex-1 flex flex-col items-center p-6">
                    <div className="w-full max-w-6xl space-y-6">
                        {/* Page Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-foreground">Medlemmar</h2>
                            <div className="flex items-center gap-2">
                                {/* Search */}
                                <InputGroup className="w-48">
                                    <InputGroupAddon>
                                        <InputGroupText>
                                            <Search />
                                        </InputGroupText>
                                    </InputGroupAddon>
                                    <InputGroupInput placeholder="Sök" />
                                </InputGroup>
                                {/* Filter */}
                                <button className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted/50 transition-colors">
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filter
                                </button>
                                {/* View Toggle */}
                                <div className="flex border border-border rounded-md overflow-hidden">
                                    <button className="p-2 bg-muted text-foreground">
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Team Members Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {teamMembers.map((member) => (
                                <TeamMemberCard key={member.id} member={member} />
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}
