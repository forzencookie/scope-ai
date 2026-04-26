import { Plus, Pencil, Trash2, Check, Calculator, FileText, type LucideIcon } from "lucide-react"

export type ConfirmationAccent = "blue" | "green" | "emerald" | "purple" | "amber" | "red" | "indigo" | "teal"
export type CompletedAction = "created" | "updated" | "deleted" | "calculated" | "prepared" | "booked"

export const accentStyles: Record<ConfirmationAccent, { iconColor: string; iconBg: string }> = {
    blue:    { iconColor: "text-blue-600 dark:text-blue-500",       iconBg: "bg-blue-500/10" },
    green:   { iconColor: "text-green-600 dark:text-green-500",     iconBg: "bg-green-500/10" },
    emerald: { iconColor: "text-emerald-600 dark:text-emerald-500", iconBg: "bg-emerald-500/10" },
    purple:  { iconColor: "text-purple-600 dark:text-purple-500",   iconBg: "bg-purple-500/10" },
    amber:   { iconColor: "text-amber-600 dark:text-amber-500",     iconBg: "bg-amber-500/10" },
    red:     { iconColor: "text-red-600 dark:text-red-500",         iconBg: "bg-red-500/10" },
    indigo:  { iconColor: "text-indigo-600 dark:text-indigo-500",   iconBg: "bg-indigo-500/10" },
    teal:    { iconColor: "text-teal-600 dark:text-teal-500",       iconBg: "bg-teal-500/10" },
}

export const completedActionConfig: Record<CompletedAction, { icon: LucideIcon; color: string; bg: string; label: string }> = {
    created:    { icon: Plus,       color: "text-green-600 dark:text-green-500",     bg: "bg-green-500/10",   label: "skapad" },
    updated:    { icon: Pencil,     color: "text-blue-600 dark:text-blue-500",       bg: "bg-blue-500/10",    label: "uppdaterad" },
    deleted:    { icon: Trash2,     color: "text-red-600 dark:text-red-500",         bg: "bg-red-500/10",     label: "borttagen" },
    calculated: { icon: Calculator, color: "text-purple-600 dark:text-purple-500",   bg: "bg-purple-500/10",  label: "beräknad" },
    prepared:   { icon: FileText,   color: "text-amber-600 dark:text-amber-500",     bg: "bg-amber-500/10",   label: "förberedd" },
    booked:     { icon: Check,      color: "text-emerald-600 dark:text-emerald-500", bg: "bg-emerald-500/10", label: "bokförd" },
}
