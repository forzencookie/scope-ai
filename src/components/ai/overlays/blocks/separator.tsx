import type { SeparatorProps } from "./types"

export function BlockSeparator({ label }: SeparatorProps) {
  if (label) {
    return (
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">{label}</span>
        </div>
      </div>
    )
  }
  return <hr className="border-border my-2" />
}
