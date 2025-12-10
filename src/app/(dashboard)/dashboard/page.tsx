import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { StatCard, StatCardGrid } from "@/components/ui/stat-card"
import { AIConfidenceDashboard } from "@/components/ai-confidence-dashboard"

// Import data from the data layer
import { 
  quickStats, 
  pendingTasks, 
  recentActivity, 
  quickLinks 
} from "@/data/dashboard"

export default function Page() {
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
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <BreadcrumbAIBadge />
      </header>
      <div className="flex flex-1 flex-col w-full p-6 overflow-auto">
        <div className="w-full max-w-5xl mx-auto space-y-6">
          
          {/* Quick Stats Row */}
          <StatCardGrid columns={4} className="grid-cols-2 sm:grid-cols-4">
            {quickStats.map((stat) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                change={stat.change}
                changeType={stat.positive === true ? "positive" : stat.positive === false ? "negative" : "neutral"}
                href={stat.href}
              />
            ))}
          </StatCardGrid>

          {/* AI Confidence Dashboard - Visibility of AI System Performance (Issue #5) */}
          <AIConfidenceDashboard defaultExpanded />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pending Tasks */}
            <div className="lg:col-span-2 border border-border/50 rounded-lg p-4">
              <h2 className="font-medium mb-4">Att göra</h2>
              <div className="space-y-1">
                {pendingTasks.map((task) => (
                  <Link key={task.id} href={task.href}>
                    <div className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-md hover:bg-muted/50 transition-colors group">
                      <span className="text-sm">{task.title}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="border border-border/50 rounded-lg p-4">
              <h2 className="font-medium mb-4">Snabblänkar</h2>
              <div className="space-y-1">
                {quickLinks.map((link) => (
                  <Link key={link.id} href={link.href}>
                    <div className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-md hover:bg-muted/50 transition-colors group">
                      <span className="text-sm">{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="border border-border/50 rounded-lg p-4">
            <h2 className="font-medium mb-4">Senaste aktivitet</h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{activity.action}</span>{" "}
                      <span className="font-medium">{activity.item}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground ml-4">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}