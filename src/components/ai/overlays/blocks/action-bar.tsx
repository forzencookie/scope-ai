import { Button } from "@/components/ui/button"
import type { ActionBarProps } from "./types"

export function ActionBar({ actions }: ActionBarProps) {
  return (
    <div className="flex items-center gap-3 pt-2">
      {actions.map((action, i) => (
        <Button
          key={i}
          variant={action.variant || "default"}
          size="sm"
          onClick={() => {
            if (action.actionId) {
              window.dispatchEvent(new CustomEvent("walkthrough-action", { detail: { actionId: action.actionId } }))
            }
          }}
        >
          {action.label}
        </Button>
      ))}
    </div>
  )
}
