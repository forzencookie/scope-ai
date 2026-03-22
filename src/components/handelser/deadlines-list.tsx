"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { taxCalendarService } from "@/services/tax/tax-calendar-service"
import { useCompany } from "@/providers/company-provider"
import { cn } from "@/lib/utils"
import type { CompanyType } from "@/lib/company-types"

interface Deadline {
  id: string
  title: string
  dueDate: Date
  daysUntil: number
  type: "moms" | "agi" | "skatt" | "arsredovisning" | "deklaration" | "other"
  status: "overdue" | "soon" | "upcoming"
}

function getDeadlineStatus(daysUntil: number): Deadline["status"] {
  if (daysUntil < 0) return "overdue"
  if (daysUntil <= 14) return "soon"
  return "upcoming"
}

function getStatusDot(status: Deadline["status"]) {
  switch (status) {
    case "overdue":
      return "bg-red-500"
    case "soon":
      return "bg-yellow-500"
    case "upcoming":
      return "bg-muted-foreground/30"
  }
}

function formatDaysUntil(days: number): string {
  if (days < 0) return `${Math.abs(days)} dagar sedan`
  if (days === 0) return "idag"
  if (days === 1) return "imorgon"
  return `om ${days} dagar`
}

export function DeadlinesList() {
  const { company, companyType } = useCompany()
  const fiscalYearEnd = company?.fiscalYearEnd || "12-31"

  const { data: deadlines = [] } = useQuery<Deadline[]>({
    queryKey: ["deadlines", fiscalYearEnd, companyType],
    queryFn: async () => {
      const today = new Date()
      const items: Deadline[] = []

      // Fetch pending tax calendar items via service
      const taxItems = await taxCalendarService.getPendingDeadlines(10)

      for (const item of taxItems) {
        const dueDate = new Date(item.dueDate)
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        items.push({
          id: item.id,
          title: item.title,
          dueDate,
          daysUntil,
          type: item.deadlineType as Deadline["type"],
          status: getDeadlineStatus(daysUntil),
        })
      }

      // Add computed deadlines (arsredovisning = 7 months after fiscal year end)
      if (companyType === ("ab" as CompanyType)) {
        const [mm, dd] = (fiscalYearEnd || "12-31").split("-").map(Number)
        const prevFiscalEnd = new Date(today.getFullYear() - 1, mm - 1, dd)
        const arsredovisningDeadline = new Date(prevFiscalEnd)
        arsredovisningDeadline.setMonth(arsredovisningDeadline.getMonth() + 7)

        if (arsredovisningDeadline > today) {
          const daysUntil = Math.ceil((arsredovisningDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          items.push({
            id: "arsredovisning-computed",
            title: `Arsredovisning ${prevFiscalEnd.getFullYear()}`,
            dueDate: arsredovisningDeadline,
            daysUntil,
            type: "arsredovisning",
            status: getDeadlineStatus(daysUntil),
          })
        }
      }

      // Sort by due date, overdue first
      items.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

      return items
    },
    staleTime: 5 * 60 * 1000,
  })

  if (deadlines.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        Inga kommande deadlines
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground px-1">Kommande deadlines</h3>
      <div className="rounded-lg border bg-card">
        {deadlines.map((deadline, i) => (
          <div
            key={deadline.id}
            className={cn(
              "flex items-center justify-between px-4 py-3",
              i < deadlines.length - 1 && "border-b"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn("h-2 w-2 rounded-full shrink-0", getStatusDot(deadline.status))} />
              <span className="text-sm">{deadline.title}</span>
            </div>
            <span className={cn(
              "text-xs tabular-nums",
              deadline.status === "overdue" ? "text-red-600 dark:text-red-400 font-medium" :
              deadline.status === "soon" ? "text-yellow-600 dark:text-yellow-400" :
              "text-muted-foreground"
            )}>
              {formatDaysUntil(deadline.daysUntil)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
