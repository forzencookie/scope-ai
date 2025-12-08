import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

export type HeaderConfig = {
  label: string
  icon?: React.ReactNode
  align?: "left" | "center" | "right"
  minWidth?: string
  className?: string
}

export function HeaderCell({ label, icon, align = "left", minWidth, className }: HeaderConfig) {
  return (
    <th
      className={cn(
        "h-8 px-2 text-left align-middle font-medium text-muted-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right",
        minWidth,
        className,
      )}
    >
      {icon ? (
        <div className={cn("flex items-center gap-2", align === "right" && "justify-end", align === "center" && "justify-center")}> 
          {icon}
          {label}
        </div>
      ) : (
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      )}
    </th>
  )
}

export function TableShell({ header, children, bodyClassName }: { header: React.ReactNode; children: React.ReactNode; bodyClassName?: string }) {
  return (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-auto">
        <table className="w-full caption-bottom text-sm border-t border-b border-border/40">
          <thead className="[&_tr]:border-b">{header}</thead>
          <tbody className={cn("[&_tr:last-child]:border-0", bodyClassName)}>{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function CategoryBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0 text-xs font-medium h-5">
      {children}
    </span>
  )
}

export function AmountText({ value, suffix = " kr" }: { value: number; suffix?: string }) {
  const isPositive = value >= 0
  return (
    <span className={cn(isPositive && "text-green-600")}>{`${isPositive ? "+" : ""}${value.toLocaleString()}${suffix}`}</span>
  )
}

export function RowCheckbox({ checked, showOnHover }: { checked?: boolean; showOnHover?: boolean }) {
  return (
    <Checkbox
      checked={checked}
      className={cn(
        "translate-y-[2px] transition-opacity",
        showOnHover ? "opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100" : undefined,
      )}
    />
  )
}
