import type { FormFieldsProps } from "./types"

export function FormFields({ fields }: FormFieldsProps) {
  return (
    <div className="rounded-lg border divide-y">
      {fields.map((field, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-muted-foreground">{field.label}</span>
          <span className="text-sm font-medium">{field.value}</span>
        </div>
      ))}
    </div>
  )
}
