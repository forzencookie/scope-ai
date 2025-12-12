import { redirect } from "next/navigation"

// Dashboard root redirects to inbox
export default function DashboardPage() {
    redirect("/dashboard/inbox")
}
