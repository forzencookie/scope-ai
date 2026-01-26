"use client"

import * as React from "react"
import { Building2, Briefcase, Users, UsersRound, Heart, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompany } from "@/providers/company-provider"
import { companyTypes, type CompanyType } from "@/lib/company-types"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Consistent icons for company types across the app
// AB: Building2 (corporate structure)
// EF: Briefcase (sole proprietorship / personal business)
// HB: Users (equal partners)
// KB: UsersRound (partners with different liability levels)
// Förening: Heart (non-profit / association)
export const companyTypeIcons: Record<CompanyType, React.ComponentType<{ className?: string }>> = {
  ab: Building2,
  ef: Briefcase,
  hb: Users,
  kb: UsersRound,
  forening: Heart,
}

export const companyTypeColors: Record<CompanyType, string> = {
  ab: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
  ef: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
  hb: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800",
  kb: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
  forening: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
}

interface CompanyTypeSelectorProps {
  /** Callback when company type is selected */
  onSelect?: (type: CompanyType) => void
  /** Show description text */
  showDescription?: boolean
  /** Compact mode for smaller spaces */
  compact?: boolean
  /** Number of columns for grid layout (1 or 2) */
  columns?: 1 | 2
}

export function CompanyTypeSelector({
  onSelect,
  showDescription = true,
  compact = false,
  columns = 1,
}: CompanyTypeSelectorProps) {
  const { companyType, setCompanyType } = useCompany()

  const handleSelect = (type: CompanyType) => {
    setCompanyType(type)
    onSelect?.(type)
  }

  if (compact) {
    return (
      <div className="grid grid-cols-5 gap-2">
        {(Object.keys(companyTypes) as CompanyType[]).map((type) => {
          const info = companyTypes[type]
          const Icon = companyTypeIcons[type]
          const isSelected = companyType === type

          return (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                isSelected
                  ? companyTypeColors[type] + " border-current"
                  : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/50"
              )}
            >
              <Icon className={cn("h-5 w-5", isSelected && "text-current")} />
              <span className="text-xs font-medium">{info.name}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn(
      columns === 2 ? "grid grid-cols-2 gap-3" : "space-y-3"
    )}>
      {(Object.keys(companyTypes) as CompanyType[]).map((type) => {
        const info = companyTypes[type]
        const Icon = companyTypeIcons[type]
        const isSelected = companyType === type

        return (
          <button
            key={type}
            onClick={() => handleSelect(type)}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-lg border-2 transition-all text-left",
              isSelected
                ? companyTypeColors[type] + " border-current"
                : "border-muted hover:border-muted-foreground/20 hover:bg-muted/50"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="font-semibold">{info.fullName}</span>
                <Icon className={cn("ml-2 h-4 w-4", isSelected ? "text-current" : "text-muted-foreground")} />
                {isSelected && (
                  <Check className="h-4 w-4 ml-auto text-current" />
                )}
              </div>
              {showDescription && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {info.description}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Compact inline selector for headers/toolbars
export function CompanyTypeBadge() {
  const { companyType, companyTypeName } = useCompany()
  const Icon = companyTypeIcons[companyType]

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
      companyTypeColors[companyType]
    )}>
      <Icon className="h-4 w-4" />
      <span>{companyTypeName}</span>
    </div>
  )
}

// Card-based display for current company type
export function CompanyTypeCard() {
  const { companyType } = useCompany()
  const info = companyTypes[companyType]
  const Icon = companyTypeIcons[companyType]

  return (
    <Card className={cn("border-2", companyTypeColors[companyType])}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-current/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-current" />
          </div>
          <div>
            <CardTitle className="text-base">{companyTypeFullName}</CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {info.features.slice(0, 8).map((feature) => (
            <Badge key={feature} variant="secondary" className="text-xs">
              {feature}
            </Badge>
          ))}
          {info.features.length > 8 && (
            <Badge variant="outline" className="text-xs">
              +{info.features.length - 8} fler
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
