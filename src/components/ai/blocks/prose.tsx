import ReactMarkdown from "react-markdown"
import type { ProseProps } from "./types"

export function Prose({ content }: ProseProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
