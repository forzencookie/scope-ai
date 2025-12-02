import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Main) - Takes 2/3 width */}
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Card 1 */}
                <Card className="aspect-video bg-muted/50" />
                {/* Card 2 */}
                <Card className="aspect-video bg-muted/50" />
                {/* Card 3 */}
                <Card className="aspect-video bg-muted/50" />
              </div>
              <div className="h-96">
                {/* Main Chart Area */}
                <Card className="h-full bg-muted/50" />
              </div>
            </div>

            {/* Right Column (Sidebar) - Takes 1/3 width */}
            <div className="space-y-8">
              <div className="h-full">
                {/* Right Sidebar Content */}
                <Card className="h-full bg-muted/50" />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
