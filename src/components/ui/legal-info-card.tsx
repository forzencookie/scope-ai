"use client"

import * as React from "react"
import { FileText, Scale, AlertTriangle, Info, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type LegalInfoVariant = "default" | "warning" | "info"

interface LegalInfoItem {
  title?: string
  content: string
}

interface LegalInfoCardProps {
  title?: string
  icon?: LucideIcon
  items: LegalInfoItem[]
  variant?: LegalInfoVariant
  className?: string
}

const variantStyles: Record<LegalInfoVariant, {
  card: string
  title: string
  content: string
}> = {
  default: {
    card: "bg-muted/50",
    title: "",
    content: "text-muted-foreground",
  },
  warning: {
    card: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950",
    title: "text-amber-800 dark:text-amber-200",
    content: "text-amber-800 dark:text-amber-200",
  },
  info: {
    card: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
    title: "text-blue-800 dark:text-blue-200",
    content: "text-blue-800 dark:text-blue-200",
  },
}

const defaultIcons: Record<LegalInfoVariant, LucideIcon> = {
  default: FileText,
  warning: Scale,
  info: Info,
}

export function LegalInfoCard({
  title = "Juridisk information",
  icon,
  items,
  variant = "default",
  className,
}: LegalInfoCardProps) {
  const styles = variantStyles[variant]
  const Icon = icon || defaultIcons[variant]

  return (
    <Card className={cn(styles.card, className)}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", styles.title)}>
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-2 text-sm", styles.content)}>
        {items.map((item, index) => (
          <p key={index}>
            {item.title && <strong>{item.title}:</strong>} {item.content}
          </p>
        ))}
      </CardContent>
    </Card>
  )
}

// Pre-configured legal info for different company types
export const legalInfoContent = {
  hb: [
    {
      title: "Handelsbolag (HB)",
      content: "Alla delägare har solidariskt och obegränsat personligt ansvar för bolagets skulder och förpliktelser.",
    },
    {
      content: "Varje delägare beskattas individuellt för sin andel av bolagets resultat. Det finns inget krav på minsta kapitalinsats.",
    },
  ],
  kb: [
    {
      title: "Kommanditbolag (KB)",
      content: "Komplementärer har obegränsat personligt ansvar, medan kommanditdelägare endast ansvarar upp till sin insats.",
    },
    {
      content: "Ett KB måste ha minst en komplementär och minst en kommanditdelägare. Kommanditdelägare får inte delta i företagets ledning.",
    },
  ],
  ef: [
    {
      title: "Personligt ansvar",
      content: "Som enskild näringsidkare har du obegränsat personligt ansvar för företagets skulder och förpliktelser.",
    },
    {
      title: "Beskattning",
      content: "Företagets resultat beskattas som din personliga inkomst av näringsverksamhet. Du betalar egenavgifter på överskottet.",
    },
    {
      title: "Bokföringskrav",
      content: "Du är skyldig att bokföra alla affärshändelser löpande och upprätta ett förenklat eller fullständigt årsbokslut.",
    },
  ],
  ab: [
    {
      title: "Aktiebolag (AB)",
      content: "Aktieägare har begränsat ansvar - du riskerar endast det kapital du investerat i bolaget.",
    },
    {
      content: "Minsta aktiekapital är 25 000 kr. Bolaget är en egen juridisk person och beskattas separat från ägarna.",
    },
  ],
  delagaruttag: [
    {
      title: "Kapitalkonto",
      content: "Varje delägares kapitalkonto spårar insatt kapital, uttag, löner och andel av resultatet.",
    },
    {
      content: "Negativt kapitalkonto kan uppstå vid stora uttag och påverkar delägarens skattesituation.",
    },
  ],
}
