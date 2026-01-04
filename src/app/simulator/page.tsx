"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Banknote,
  Smartphone,
  Plane,
  Building2,
  Coffee,
  Shuffle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Receipt,
  UtensilsCrossed,
  Briefcase,
  Car,
  FileText,
  Zap,
  ArrowRight,
  Wallet,
  Mail,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"



import type { ReceiptDocumentData, InvoiceDocumentData } from "@/types/documents"
interface BankTransaction {
  id: string
  description: string
  amount: number
  date: string
  account: string
  reference?: string
}

// Display transaction (for the UI list)
interface DisplayTransaction {
  id: string
  name: string
  amount: number
  date: string
  account: string
  reference?: string
}

type TransactionType = 'income' | 'subscription' | 'travel' | 'office' | 'fika'

const QUICK_ACTIONS: {
  type: TransactionType
  label: string
  description: string
  icon: typeof Banknote
  color: string
  bgColor: string
}[] = [
    {
      type: 'income',
      label: 'Kund betalar',
      description: '+5,000 - 150,000 kr',
      icon: Banknote,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
    {
      type: 'subscription',
      label: 'Prenumeration',
      description: '-89 - 599 kr',
      icon: Smartphone,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      type: 'travel',
      label: 'Resa / Flyg',
      description: '-89 - 8,500 kr',
      icon: Plane,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      type: 'office',
      label: 'Kontorskostnad',
      description: '-299 - 25,000 kr',
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      type: 'fika',
      label: 'Fika / Mat',
      description: '-40 - 280 kr',
      icon: Coffee,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 hover:bg-amber-100',
    },
  ]

// Receipt types
type ReceiptType = 'restaurant' | 'office' | 'travel' | 'subscription' | 'utility'

interface GeneratedReceipt {
  id: string
  vendor: string
  amount: string
  date: string
  category: string
  status: string
  ai_confidence?: number
  visualData?: ReceiptDocumentData
}

interface GeneratedInvoice {
  id: string
  invoiceNumber: string
  customerName: string
  amount: number
  issueDate: string
  visualData?: InvoiceDocumentData
}

const RECEIPT_ACTIONS: {
  type: ReceiptType
  label: string
  description: string
  icon: typeof Receipt
  color: string
  bgColor: string
}[] = [
    {
      type: 'restaurant',
      label: 'Restaurang / Fika',
      description: 'Espresso House, MAX, etc.',
      icon: UtensilsCrossed,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      type: 'office',
      label: 'Kontorsmaterial',
      description: 'Staples, Clas Ohlson, IKEA',
      icon: Briefcase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      type: 'travel',
      label: 'Resa / Transport',
      description: 'SAS, SJ, Scandic, bensin',
      icon: Car,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      type: 'subscription',
      label: 'Prenumeration',
      description: 'Spotify, Adobe, Microsoft',
      icon: FileText,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
    },
    {
      type: 'utility',
      label: 'Räkningar',
      description: 'Telia, Vattenfall, Försäkring',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    },
  ]

const INBOX_ACTIONS: {
  type: string
  label: string
  description: string
  icon: typeof Mail
  color: string
  bgColor: string
}[] = [
    {
      type: 'skatteverket-skatt',
      label: 'Slutlig skatt',
      description: 'Skatteverket - Beslut om slutlig skatt',
      icon: Mail,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      type: 'skatteverket-moms',
      label: 'Momsdeklaration',
      description: 'Skatteverket - Dags att deklarera',
      icon: Mail,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
    },
    {
      type: 'bolagsverket',
      label: 'Ärendeuppdatering',
      description: 'Bolagsverket - Bekräftelse',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      type: 'kivra-invoice',
      label: 'Faktura (Kivra)',
      description: 'Fortum, Telia, etc.',
      icon: Receipt,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
  ]

const EMAIL_ACTIONS: {
  type: string
  label: string
  description: string
  icon: typeof Mail
  color: string
  bgColor: string
  provider: string
}[] = [
    {
      type: 'gmail-invoice',
      label: 'Faktura (Gmail)',
      description: 'Notion, Slack, mm.',
      icon: Mail,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      provider: 'gmail'
    },
    {
      type: 'yahoo-invoice',
      label: 'Faktura (Yahoo)',
      description: 'One.com, Loopia',
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      provider: 'yahoo'
    },
    {
      type: 'outlook-invoice',
      label: 'Faktura (Outlook)',
      description: 'Microsoft, LinkedIn',
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      provider: 'outlook'
    },
  ]

export default function SimulatorPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [batchCount, setBatchCount] = useState(5)
  const [recentTransactions, setRecentTransactions] = useState<DisplayTransaction[]>([])
  const [recentReceipts, setRecentReceipts] = useState<GeneratedReceipt[]>([])
  const [recentInvoices, setRecentInvoices] = useState<GeneratedInvoice[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({})
  const [lastInboxItem, setLastInboxItem] = useState<any>(null)

  // Fetch data from local transactions API
  const fetchRecentData = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions')
      const data = await response.json()

      const transactions = data.data || data.transactions || []
      setRecentTransactions(transactions.slice(0, 10).map((tx: any) => ({
        id: tx.id,
        name: tx.name || tx.description,
        amount: tx.amountValue || tx.amount,
        date: tx.date,
        account: tx.account,
        reference: tx.reference,
      })))
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    }
  }, [])

  // Load initial data and setup auto-refresh
  useEffect(() => {
    fetchRecentData()

    const onFocus = () => fetchRecentData()
    window.addEventListener('focus', onFocus)

    return () => window.removeEventListener('focus', onFocus)
  }, [fetchRecentData])

  // Fetch integration states
  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const response = await fetch('/api/integrations')
        const data = await response.json()
        if (data.integrations) {
          setIntegrations(data.integrations)
        }
      } catch (error) {
        console.error('Failed to fetch integrations:', error)
      }
    }
    fetchIntegrations()
  }, [])

  // Generate transaction data based on type
  const getTransactionData = (type: TransactionType): { amount: number; description: string } => {
    const vendors = {
      income: ['Kund AB', 'Tech Solutions', 'Nordic Consulting', 'Acme Corp', 'StartupX'],
      subscription: ['Spotify', 'Adobe Creative Cloud', 'Microsoft 365', 'Slack', 'Notion', 'Figma'],
      travel: ['SAS', 'SJ', 'Scandic Hotels', 'Circle K', 'OKQ8'],
      office: ['IKEA', 'Clas Ohlson', 'Staples', 'Dustin', 'NetOnNet'],
      fika: ['Espresso House', 'Starbucks', 'Wayne\'s Coffee', 'MAX', 'Subway'],
    }

    const ranges = {
      income: { min: 5000, max: 150000 },
      subscription: { min: 89, max: 599 },
      travel: { min: 89, max: 8500 },
      office: { min: 299, max: 25000 },
      fika: { min: 40, max: 280 },
    }

    const vendorList = vendors[type]
    const range = ranges[type]
    const vendor = vendorList[Math.floor(Math.random() * vendorList.length)]
    const amount = Math.round(range.min + Math.random() * (range.max - range.min))

    return {
      amount: type === 'income' ? amount : -amount,
      description: vendor,
    }
  }

  // Generate receipt data based on type
  const generateReceiptData = (type: ReceiptType) => {
    const merchants: Record<ReceiptType, string[]> = {
      restaurant: ['Espresso House', 'MAX Burgers', 'Bastard Burgers', 'Vapiano'],
      travel: ['SL', 'Uber', 'Bolt', 'Circle K', 'SAS', 'SJ'],
      office: ['Clas Ohlson', 'IKEA', 'Staples', 'Dustin'],
      subscription: ['Spotify', 'Adobe', 'Microsoft 365', 'Notion'],
      utility: ['Vattenfall', 'Telia', 'Telenor', 'Fortum'],
    }
    const categories: Record<ReceiptType, string> = {
      restaurant: 'Mat & Fika',
      travel: 'Transport',
      office: 'Kontorsmaterial',
      subscription: 'Prenumeration',
      utility: 'Förbrukning',
    }
    const ranges: Record<ReceiptType, { min: number; max: number }> = {
      restaurant: { min: 50, max: 500 },
      travel: { min: 30, max: 800 },
      office: { min: 100, max: 3000 },
      subscription: { min: 89, max: 599 },
      utility: { min: 200, max: 2000 },
    }

    const merchantList = merchants[type]
    const range = ranges[type]
    const vendor = merchantList[Math.floor(Math.random() * merchantList.length)]
    const amount = Math.round(range.min + Math.random() * (range.max - range.min))

    return {
      id: `rcpt-${Date.now()}`,
      vendor,
      amount: `-${amount} kr`,
      date: new Date().toISOString().split('T')[0],
      category: categories[type],
      status: 'Att bokföra',
    }
  }

  const generateTransaction = async (type: TransactionType) => {
    setLoading(type)
    setMessage(null)

    try {
      const data = getTransactionData(type)
      const id = `txn-${Date.now()}`
      const date = new Date().toISOString().split('T')[0]

      // Send via unified /api/receive POST endpoint
      const response = await fetch('/api/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: 'transaction',
          data: {
            id,
            name: data.description,
            amount: data.amount,
            date,
            account: 'Företagskonto',
          },
        }),
      })

      const result = await response.json()

      if (result.success) {
        const displayTx: DisplayTransaction = {
          id,
          name: data.description,
          amount: data.amount,
          date,
          account: 'Företagskonto',
        }

        setRecentTransactions(prev => [displayTx, ...prev].slice(0, 10))
        setMessage({ type: 'success', text: `✓ ${data.description} → Inbox` })
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Kunde inte skapa transaktion' })
    } finally {
      setLoading(null)
    }
  }

  const generateBatch = async () => {
    setLoading('batch')
    setMessage(null)

    try {
      // Generate multiple transactions via unified inbox
      const types: TransactionType[] = ['income', 'subscription', 'office', 'fika', 'travel']
      const results = []

      for (let i = 0; i < batchCount; i++) {
        const type = types[Math.floor(Math.random() * types.length)]
        const data = getTransactionData(type)
        const id = `txn-${Date.now()}-${i}`
        const date = new Date().toISOString().split('T')[0]

        await fetch('/api/receive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataType: 'transaction',
            data: { id, name: data.description, amount: data.amount, date, account: 'Företagskonto' },
          }),
        })
        results.push(data.description)
      }

      await fetchRecentData()
      setMessage({ type: 'success', text: `✓ ${batchCount} transaktioner skapade` })
    } catch (error) {
      setMessage({ type: 'error', text: 'Kunde inte generera transaktioner' })
    } finally {
      setLoading(null)
    }
  }

  const clearAll = async () => {
    setLoading('clear')
    setMessage(null)

    try {
      // Clear receipts
      await fetch('/api/mock/receipts', { method: 'DELETE' })

      // Clear inbox 
      await fetch('/api/receive', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' })
      })

      // Refresh transactions list
      await fetchRecentData()
      setRecentReceipts([])
      setMessage({ type: 'success', text: '✓ Simulator data återställd' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Nätverksfel - kunde inte nå API' })
    } finally {
      setLoading(null)
    }
  }

  const generateReceipt = async (type: ReceiptType) => {
    setLoading(`receipt-${type}`)
    setMessage(null)

    try {
      // Generate receipt data locally
      const receiptData = generateReceiptData(type)

      // Send via unified /api/receive POST endpoint
      const response = await fetch('/api/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: 'receipt',
          data: receiptData,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setRecentReceipts(prev => [receiptData as GeneratedReceipt, ...prev].slice(0, 10))
        setMessage({ type: 'success', text: `✓ Kvitto skapat: ${receiptData.vendor}` })
      } else {
        setMessage({ type: 'error', text: result.error || 'Kunde inte skapa kvitto' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Nätverksfel - kunde inte nå API' })
    } finally {
      setLoading(null)
    }
  }

  const generateInbox = async (type: string) => {
    setLoading(`inbox-${type}`)
    setMessage(null)

    try {
      // Use unified /api/receive for all inbox items
      const response = await fetch('/api/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', type }),
      })
      const result = await response.json()

      if (result.success && result.item) {
        setLastInboxItem(result.item)
        setMessage({ type: 'success', text: `✓ Post mottagen: ${result.item.title}` })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Nätverksfel - kunde inte nå API' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🧪 Simulator</h1>
        <p className="text-muted-foreground mt-2">
          Simulera transaktioner och kvitton för att testa bokföringsflödet
        </p>
      </div>

      {/* Data Flow Diagram - Shows the new API-first architecture */}
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border">
              <Shuffle className="h-4 w-4" />
              <span className="font-medium">Simulator</span>
            </div>
            <ArrowRight className="h-4 w-4" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
              <span className="font-medium">External API</span>
            </div>
            <ArrowRight className="h-4 w-4" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
              <span className="font-medium">Webhook</span>
            </div>
            <ArrowRight className="h-4 w-4" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <Wallet className="h-4 w-4" />
              <span className="font-medium">Supabase</span>
            </div>
            <ArrowRight className="h-4 w-4" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Dashboard</span>
            </div>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Swap "External API" för Tink/Skatteverket/Gmail i produktion
          </p>
        </CardContent>
      </Card>

      {/* Bank Balances */}
      {/* Bank Balances removed per user request */}

      {/* Status message */}
      {message && (
        <div className={cn(
          "p-4 rounded-lg flex items-center gap-3",
          message.type === 'success'
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        )}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions" className="gap-2">
            <Banknote className="h-4 w-4" />
            Transaktioner
          </TabsTrigger>
          <TabsTrigger value="receipts" className="gap-2">
            <Receipt className="h-4 w-4" />
            Kvitton
          </TabsTrigger>
          <TabsTrigger value="inbox" className="gap-2">
            <Mail className="h-4 w-4" />
            Inkorg
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Kundfakturor
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Skapa transaktion</CardTitle>
              <CardDescription>
                Klicka för att skapa en transaktion av vald typ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon
                  const isLoading = loading === action.type

                  return (
                    <button
                      key={action.type}
                      onClick={() => generateTransaction(action.type)}
                      disabled={loading !== null}
                      className={cn(
                        "p-4 rounded-lg border-2 border-border/60 transition-all text-left",
                        action.bgColor,
                        loading !== null && loading !== action.type && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg bg-white", action.color)}>
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{action.label}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Batch Generate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Generera slumpmässiga
              </CardTitle>
              <CardDescription>
                Skapa flera transaktioner av blandade typer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="count">Antal transaktioner</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={50}
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value) || 5)}
                    className="w-24"
                  />
                </div>
                <Button
                  onClick={generateBatch}
                  disabled={loading !== null}
                  className="gap-2"
                >
                  {loading === 'batch' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shuffle className="h-4 w-4" />
                  )}
                  Generera
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          {recentTransactions.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Senaste transaktioner (rå bankdata)</CardTitle>
                  <CardDescription>
                    Gå till <a href="/dashboard/accounting" className="text-primary underline">Bokföring</a> för att se dem processade och bokföra
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecentTransactions([])}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rensa lista
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentTransactions.map((tx) => {
                    const formattedAmount = new Intl.NumberFormat('sv-SE', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(Math.abs(tx.amount))
                    const isIncome = tx.amount > 0

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-medium">{tx.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {tx.date} • {tx.account || 'Företagskonto'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "tabular-nums font-medium",
                            isIncome ? "text-green-600" : "text-red-600"
                          )}>
                            {isIncome ? '+' : '-'}{formattedAmount} kr
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Rå data (ej processad)
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Skapa kvitto / underlag</CardTitle>
              <CardDescription>
                Simulera ett uppladdat kvitto som kan matchas mot transaktioner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {RECEIPT_ACTIONS.map((action) => {
                  const Icon = action.icon
                  const isLoading = loading === `receipt-${action.type}`

                  return (
                    <button
                      key={action.type}
                      onClick={() => generateReceipt(action.type)}
                      disabled={loading !== null}
                      className={cn(
                        "p-4 rounded-lg border-2 border-border/60 transition-all text-left",
                        action.bgColor,
                        loading !== null && loading !== `receipt-${action.type}` && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg bg-white", action.color)}>
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{action.label}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Receipts */}
          {recentReceipts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Genererade kvitton</CardTitle>
                  <CardDescription>
                    Klicka på ögat för att se det genererade kvittot
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecentReceipts([])}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rensa lista
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentReceipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded bg-background border">
                          {receipt.visualData?.companyLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={receipt.visualData.companyLogo} alt="Logo" className="h-6 w-auto object-contain" />
                          ) : (
                            <Receipt className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{receipt.vendor}</div>
                          <div className="text-xs text-muted-foreground">
                            {receipt.date} • {receipt.category}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">{receipt.amount} kr</div>
                          <div className="text-xs text-muted-foreground">
                            {receipt.visualData ? 'Preview tillgänglig' : 'Snabbskapad'}
                          </div>
                        </div>

                        {receipt.visualData && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-none shadow-2xl">
                              <div className="p-8 bg-white dark:bg-neutral-900">
                                <div className="text-center text-muted-foreground">
                                  <Receipt className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                  <p className="text-sm font-medium">Kvitto</p>
                                  <p className="text-xs mt-1">{receipt.vendor}</p>
                                  <p className="text-xs mt-2">{receipt.amount}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </TabsContent>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-6">

          {/* Kivra Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Kivra (Digital Brevlåda)
              </CardTitle>
              <CardDescription>
                Post från myndigheter och företag som skickas via Kivra
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!integrations['kivra'] ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/20">
                  <div className="flex bg-muted p-4 rounded-full mb-4">
                    <Mail className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="font-semibold text-lg">Kivra är inte ansluten</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-4">
                    För att ta emot post från myndigheter måste du ansluta Kivra i inställningarna.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/dashboard/settings?tab=E-post'}>
                    Hantera integrationer
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {INBOX_ACTIONS.map((action) => {
                    const Icon = action.icon
                    const isLoading = loading === `inbox-${action.type}`

                    return (
                      <button
                        key={action.type}
                        onClick={() => generateInbox(action.type)}
                        disabled={loading !== null}
                        className={cn(
                          "p-4 rounded-lg border-2 border-border/60 transition-all text-left",
                          action.bgColor,
                          loading !== null && loading !== `inbox-${action.type}` && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg bg-white", action.color)}>
                            {isLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold">{action.label}</div>
                            <div className="text-xs text-muted-foreground">{action.description}</div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Providers Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                E-postleverantörer
              </CardTitle>
              <CardDescription>
                Simulera inkommande fakturor via vanliga e-posttjänster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {EMAIL_ACTIONS.map((action) => {
                  const Icon = action.icon
                  const isLoading = loading === `inbox-${action.type}`
                  const isConnected = integrations[action.provider]

                  if (!isConnected) {
                    return (
                      <div
                        key={action.type}
                        className="p-4 rounded-lg border-2 border-dashed border-border/60 flex flex-col items-center justify-center text-center opacity-70 bg-muted/20"
                      >
                        <div className="p-2 rounded-lg bg-muted mb-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="font-medium text-sm">{action.label}</div>
                        <div className="text-xs text-muted-foreground mb-2">Ej ansluten</div>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => window.location.href = '/dashboard/settings?tab=E-post'}>
                          Anslut
                        </Button>
                      </div>
                    )
                  }

                  return (
                    <button
                      key={action.type}
                      onClick={() => generateInbox(action.type)}
                      disabled={loading !== null}
                      className={cn(
                        "p-4 rounded-lg border-2 border-border/60 transition-all text-left",
                        action.bgColor,
                        loading !== null && loading !== `inbox-${action.type}` && "opacity-50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg bg-white", action.color)}>
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{action.label}</div>
                          <div className="text-xs text-muted-foreground">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Förhandsvisning</CardTitle>
              <CardDescription>
                Senast genererade dokument
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastInboxItem ? (
                <div className="space-y-4">
                  {/* Email-style preview */}
                  <div className="border-2 border-border rounded-lg p-4 bg-white dark:bg-neutral-900 space-y-3">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        generateInbox('clear')
                        setLastInboxItem(null)
                      }}
                      disabled={loading !== null}
                      className="gap-2 w-full"
                    >
                      {loading === 'clear-inbox' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Rensa hela inkorgen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Inget dokument genererat ännu</p>
                  <p className="text-xs mt-1">Klicka på en faktura-knapp ovan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generera kundfakturor</CardTitle>
              <CardDescription>Simulera utgående fakturor för intäkter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-count">Antal fakturor</Label>
                  <Input
                    id="inv-count"
                    type="number"
                    min={1}
                    max={10}
                    defaultValue={1}
                    className="w-24"
                  />
                </div>
                <Button
                  onClick={async () => {
                    setLoading('invoices')
                    const count = (document.getElementById('inv-count') as HTMLInputElement).value || '1'
                    try {
                      const res = await fetch('/api/mock/invoices', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ count: parseInt(count) })
                      })
                      const data = await res.json()
                      if (data.invoices) {
                        setRecentInvoices(prev => [...data.invoices, ...prev].slice(0, 10))
                        setMessage({ type: 'success', text: `✓ ${data.invoices.length} fakturor genererade` })
                      }
                    } catch (e) {
                      setMessage({ type: 'error', text: 'Fel vid generering' })
                    } finally {
                      setLoading(null)
                    }
                  }}
                  disabled={loading !== null}
                  className="gap-2"
                >
                  {loading === 'invoices' ? <Loader2 className="animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Generera
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          {recentInvoices.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Genererade fakturor</CardTitle>
                  <CardDescription>Klicka på ögat för att se fakturan</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRecentInvoices([])}
                >
                  Rensa
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded bg-background border">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{inv.customerName}</div>
                          <div className="text-xs text-muted-foreground">{inv.invoiceNumber} • {inv.issueDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium tabular-nums">{new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(inv.amount)}</div>
                          <div className="text-xs text-muted-foreground">Klar att bokföra</div>
                        </div>

                        {inv.visualData && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl p-0 overflow-y-auto max-h-[90vh] bg-white border-none shadow-2xl">
                              <div className="p-8 bg-white dark:bg-neutral-900">
                                <div className="text-center text-muted-foreground">
                                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                  <p className="text-sm font-medium">Faktura {inv.invoiceNumber}</p>
                                  <p className="text-xs mt-1">{inv.customerName}</p>
                                  <p className="text-xs mt-2">{new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(inv.amount)}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-8">
        <Button
          variant="destructive"
          onClick={clearAll}
          disabled={loading !== null}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Återställ all data
        </Button>
      </div>
    </div>
  )
}
