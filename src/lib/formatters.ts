
const svSEFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const svSEDateFormatter = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
})

export const formatCurrency = (value: number) => svSEFormatter.format(value)
export const formatDate = (date: Date | string) => svSEDateFormatter.format(new Date(date))
