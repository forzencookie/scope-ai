import { cn } from "@/lib/utils"
import type { EntityRowsProps, EmployeeRowProps, InvoiceRowProps, TransactionRowProps, ReceiptRowProps } from "./types"

function EmployeeRow({ name, role, salary, status }: EmployeeRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div>
        <span className="text-sm font-medium">{name}</span>
        {role && <span className="text-xs text-muted-foreground ml-2">{role}</span>}
      </div>
      <div className="flex items-center gap-3">
        {salary && <span className="text-sm tabular-nums">{salary}</span>}
        {status && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{status}</span>}
      </div>
    </div>
  )
}

function InvoiceRow({ number, customer, amount, status, dueDate }: InvoiceRowProps) {
  const isOverdue = status === "overdue" || status === "förfallen"
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground">{number}</span>
        <span className="text-sm font-medium">{customer}</span>
      </div>
      <div className="flex items-center gap-3">
        {dueDate && <span className="text-xs text-muted-foreground">{dueDate}</span>}
        <span className="text-sm tabular-nums font-medium">{amount}</span>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          isOverdue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-muted"
        )}>{status}</span>
      </div>
    </div>
  )
}

function TransactionRow({ date, description, amount, account, status }: TransactionRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-20">{date}</span>
        <span className="text-sm">{description}</span>
        {account && <span className="text-xs font-mono text-muted-foreground">{account}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums font-medium">{amount}</span>
        {status && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{status}</span>}
      </div>
    </div>
  )
}

function ReceiptRow({ supplier, amount, date, matched }: ReceiptRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-20">{date}</span>
        <span className="text-sm font-medium">{supplier}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums">{amount}</span>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          matched ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        )}>{matched ? "Matchad" : "Omatchad"}</span>
      </div>
    </div>
  )
}

const ROW_COMPONENTS = {
  employee: EmployeeRow,
  invoice: InvoiceRow,
  transaction: TransactionRow,
  receipt: ReceiptRow,
} as const

export function EntityRows({ variant, items }: EntityRowsProps) {
  const RowComponent = ROW_COMPONENTS[variant]
  return (
    <div className="rounded-lg border divide-y">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {items.map((item, i) => <RowComponent key={i} {...item as any} />)}
    </div>
  )
}
