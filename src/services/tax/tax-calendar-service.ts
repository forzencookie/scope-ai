import { createBrowserClient } from "@/lib/database/client"

export interface TaxCalendarItem {
  id: string
  title: string
  dueDate: string
  deadlineType: string
  status: string
}

export const taxCalendarService = {
  async getPendingDeadlines(limit = 10): Promise<TaxCalendarItem[]> {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from("tax_calendar")
      .select("id, title, due_date, deadline_type, status")
      .in("status", ["Kommande", "Försenad"])
      .order("due_date", { ascending: true })
      .limit(limit)

    if (error) throw error

    return (data || [])
      .filter((item) => item.due_date)
      .map((item) => ({
        id: item.id,
        title: item.title ?? "",
        dueDate: item.due_date!,
        deadlineType: item.deadline_type as string,
        status: item.status as string,
      }))
  },
}
