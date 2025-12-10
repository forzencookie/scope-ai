import { Suspense, lazy } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"

// Lazy load the table component for code splitting
const InvoicesTable = lazy(() => import("@/components/invoices-table").then(mod => ({ default: mod.InvoicesTable })))

function TableSkeleton() {
    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        </div>
    )
}

export default function InvoicesPage() {
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
                                <BreadcrumbLink href="/accounting">Bokföring</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Fakturor</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <BreadcrumbAIBadge />
            </header>
            <div className="flex-1 flex flex-col bg-background">
                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 overflow-hidden">
                    <Suspense fallback={<TableSkeleton />}>
                        <InvoicesTable />
                    </Suspense>
                </main>
            </div>
        </>
    )
}
