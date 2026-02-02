/** Block primitives type system for AI-composed walkthroughs */

export interface BlockProps<T = unknown> {
  type: string
  props: T
  id?: string
}

export interface WalkthroughResponse {
  mode: "fixed" | "dynamic"
  title: string
  subtitle?: string
  blocks: BlockProps[]
}

// --- Per-block prop types ---

export interface StatCardItem {
  label: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
  icon?: string
}
export interface StatCardsProps {
  items: StatCardItem[]
}

export interface FinancialTableProps {
  columns: string[]
  rows: Array<Record<string, string | number>>
  totals?: Record<string, string | number>
  highlights?: string[]
}

export interface DataTableProps {
  columns: Array<{ key: string; label: string; align?: "left" | "right" | "center" }>
  rows: Array<Record<string, string | number>>
  caption?: string
}

export interface ChartProps {
  type: "bar" | "line" | "pie"
  data: Array<Record<string, string | number>>
  xKey: string
  yKey: string
  title?: string
  color?: string
}

export interface RankedListProps {
  items: Array<{ rank: number; label: string; value: string; badge?: string }>
}

export interface TimelineProps {
  events: Array<{ date: string; title: string; description?: string; status?: "done" | "pending" | "active" }>
}

export interface ChecklistProps {
  items: Array<{ label: string; checked: boolean; detail?: string }>
}

export interface InfoCardProps {
  title?: string
  content: string
  variant: "info" | "warning" | "success" | "error"
}

export interface LegalParagraphsProps {
  sections: Array<{ heading?: string; body: string }>
}

export interface KeyValueProps {
  items: Array<{ label: string; value: string }>
  columns?: 1 | 2 | 3
}

export interface ComparisonProps {
  options: Array<{
    title: string
    items: Array<{ label: string; value: string }>
    recommended?: boolean
  }>
}

export interface ActionBarProps {
  actions: Array<{ label: string; variant?: "default" | "outline" | "destructive"; actionId?: string }>
}

export interface SeparatorProps {
  label?: string
}

export interface HeadingProps {
  text: string
  level: 1 | 2 | 3
  subtitle?: string
}

export interface ProseProps {
  content: string
}

export interface StatusCheckProps {
  items: Array<{ label: string; status: "pass" | "warning" | "fail"; detail?: string }>
}

export interface DocumentPreviewProps {
  title: string
  meta: Array<{ label: string; value: string }>
  body: string
}

export interface FormFieldsProps {
  fields: Array<{ label: string; value: string; type?: string }>
}

export interface ProgressBarProps {
  value: number
  max: number
  label?: string
}

export interface ConfirmationBlockProps {
  title: string
  summary: Array<{ label: string; value: string }>
  warnings?: string[]
  checkbox?: boolean
  checkboxLabel?: string
  confirmationId?: string
}

export interface EmployeeRowProps {
  name: string
  role?: string
  salary?: string
  status?: string
}

export interface InvoiceRowProps {
  number: string
  customer: string
  amount: string
  status: string
  dueDate?: string
}

export interface TransactionRowProps {
  date: string
  description: string
  amount: string
  account?: string
  status?: string
}

export interface ReceiptRowProps {
  supplier: string
  amount: string
  date: string
  matched?: boolean
}

export interface CollapsedGroupProps {
  label: string
  count?: number
  defaultOpen?: boolean
  children: BlockProps[]
}

export interface InlineChoiceProps {
  question?: string
  options: Array<{ label: string; value: string }>
}

export interface AnnotationProps {
  text: string
  variant: "muted" | "warning" | "success" | "error"
}

export interface ColumnsProps {
  columns: BlockProps[][]
  gap?: "sm" | "md" | "lg"
}

export interface MetricProps {
  label: string
  value: string
  change?: string
  trend?: "up" | "down" | "neutral"
}

export interface EntityRowsProps {
  variant: "employee" | "invoice" | "transaction" | "receipt"
  items: Array<EmployeeRowProps | InvoiceRowProps | TransactionRowProps | ReceiptRowProps>
}
