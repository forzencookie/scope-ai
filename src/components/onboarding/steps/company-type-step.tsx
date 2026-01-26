"use client"

import { CompanyTypeSelector } from "../company-type-selector"

// ============================================================================
// CompanyTypeStep - Select company type (AB, EF, HB, etc.)
// ============================================================================

export function CompanyTypeStep() {
  return (
    <div className="w-full">
      <CompanyTypeSelector showDescription={true} columns={2} />
    </div>
  )
}
