import * as React from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Coffee, Tag, Package, Monitor, Plane, Building2, Fuel, Smartphone, Phone, 
  Zap, Shield, Receipt, Server, type LucideIcon 
} from "lucide-react"

// Icon map for CategoryBadge
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Coffee,
  Tag,
  Package,
  Monitor,
  Plane,
  Building2,
  Fuel,
  Smartphone,
  Phone,
  Zap,
  Shield,
  Receipt,
  Server,
}

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
        "px-4 py-3 text-left align-middle font-medium text-muted-foreground",
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
    <table className="w-full text-sm">
      <thead className="bg-muted/50">
        {header}
      </thead>
      <tbody className={cn("[&_tr:last-child]:border-0", bodyClassName)}>{children}</tbody>
    </table>
  )
}

export function CategoryBadge({ 
  children, 
  iconName, 
  iconColor 
}: { 
  children: React.ReactNode
  iconName?: string
  iconColor?: string
}) {
  const Icon = iconName ? CATEGORY_ICON_MAP[iconName] : null
  
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-1.5 py-0 text-xs font-medium h-5">
      {Icon && <Icon className={cn("h-3 w-3", iconColor || "text-muted-foreground")} />}
      {children}
    </span>
  )
}

export function AmountText({ value, suffix = " kr" }: { value: number; suffix?: string }) {
  const isPositive = value >= 0
  return (
    <span className={cn("font-medium", isPositive && "text-green-600 dark:text-green-500/80")}>{`${isPositive ? "+" : ""}${value.toLocaleString()}${suffix}`}</span>
  )
}

export function RowCheckbox({ 
  checked, 
  showOnHover, 
  onClick,
  label = "Välj rad"
}: { 
  checked?: boolean
  showOnHover?: boolean
  onClick?: () => void
  label?: string
}) {
  return (
    <Checkbox
      checked={checked}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "translate-y-[2px] transition-opacity cursor-pointer",
        showOnHover ? "opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100" : undefined,
      )}
    />
  )
}
