"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { companyTypes, type CompanyType } from "@/lib/company-types"

interface CompanyTypeToggleProps {
    selected: CompanyType
    onChange: (type: CompanyType) => void
    className?: string
}

const companyTypeOrder: CompanyType[] = ['ab', 'ef', 'hb', 'kb', 'forening']

export function CompanyTypeToggle({ selected, onChange, className }: CompanyTypeToggleProps) {
    return (
        <div className={cn("inline-flex border border-stone-200 rounded-lg p-1 bg-stone-50", className)}>
            {companyTypeOrder.map((type) => {
                const info = companyTypes[type]
                const isSelected = selected === type

                return (
                    <button
                        key={type}
                        onClick={() => onChange(type)}
                        className={cn(
                            "relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            isSelected
                                ? "text-white"
                                : "text-stone-600 hover:text-stone-900"
                        )}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="company-type-toggle-bg"
                                className="absolute inset-0 bg-stone-900 rounded-md"
                                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                            />
                        )}
                        <span className="relative z-10">{info.name}</span>
                    </button>
                )
            })}
        </div>
    )
}
