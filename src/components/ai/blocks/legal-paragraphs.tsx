import type { LegalParagraphsProps } from "./types"

export function LegalParagraphs({ sections }: LegalParagraphsProps) {
  return (
    <div className="space-y-4">
      {sections.map((section, i) => (
        <div key={i}>
          {section.heading && (
            <h4 className="text-sm font-semibold mb-1">{section.heading}</h4>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{section.body}</p>
        </div>
      ))}
    </div>
  )
}
