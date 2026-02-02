import type { DocumentPreviewProps } from "./types"

export function DocumentPreview({ title, meta, body }: DocumentPreviewProps) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        {meta.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2">
            {meta.map((m, i) => (
              <span key={i} className="text-xs text-muted-foreground">
                {m.label}: <strong className="text-foreground">{m.value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-4 text-sm leading-relaxed whitespace-pre-wrap">{body}</div>
    </div>
  )
}
