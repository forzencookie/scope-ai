"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { FormanCatalogItem, EmployeeBenefit } from "@/lib/ai/tool-types"
import { BenefitRow } from "./benefit-row"

interface BenefitSectionProps {
    title: string
    benefits: FormanCatalogItem[]
    assignedBenefits: EmployeeBenefit[]
    totalEmployees: number
    defaultOpen?: boolean
    onRowClick: (benefit: FormanCatalogItem) => void
}

export function BenefitSection({
    title,
    benefits,
    assignedBenefits,
    totalEmployees,
    defaultOpen = true,
    onRowClick
}: BenefitSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    // Optimization: Pre-calculate usage counts to avoid nested O(N*M) loop
    const usageMap = useMemo(() => {
        const stats = new Map<string, number>();
        assignedBenefits.forEach(ab => {
            const current = stats.get(ab.benefitType) || 0;
            stats.set(ab.benefitType, current + 1);
        });
        return stats;
    }, [assignedBenefits]);

    if (benefits.length === 0) return null

    return (
        <div className="space-y-1">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 py-2 hover:bg-muted/30 rounded-sm px-2 -mx-2 transition-colors group w-full text-left"
            >
                {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                )}
                <span className="font-medium text-sm group-hover:text-foreground transition-colors text-muted-foreground">
                    {title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {benefits.length} st
                </span>
            </button>

            {isOpen && (
                <div className="space-y-0.5 pl-2">
                    {benefits.map((benefit) => {
                        const usageCount = usageMap.get(benefit.id) || 0
                        return (
                            <BenefitRow
                                key={benefit.id}
                                name={benefit.name}
                                description={benefit.description}
                                maxAmount={benefit.maxAmount}
                                usageCount={usageCount}
                                totalEmployees={totalEmployees}
                                onClick={() => onRowClick(benefit)}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}
