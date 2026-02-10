"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"

interface NewTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewTransactionDialog({ open, onOpenChange }: NewTransactionDialogProps) {
    const toast = useToast()
    const [activeTab, setActiveTab] = useState<'manual' | 'ocr'>('manual')
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Single transaction form state
    const [description, setDescription] = useState("")
    const [counterparty, setCounterparty] = useState("")
    const [counterpartyOrgNr, setCounterpartyOrgNr] = useState("")
    const [amount, setAmount] = useState("")
    const [vatAmount, setVatAmount] = useState("")
    const [vatRate, setVatRate] = useState("25")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [account, setAccount] = useState("")
    const [documentRef, setDocumentRef] = useState("")

    const resetForm = () => {
        setDescription("")
        setCounterparty("")
        setCounterpartyOrgNr("")
        setAmount("")
        setVatAmount("")
        setVatRate("25")
        setDate(new Date().toISOString().split('T')[0])
        setAccount("")
        setDocumentRef("")
        setFile(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    // Auto-calculate VAT when amount or rate changes
    const handleAmountChange = (val: string) => {
        setAmount(val)
        const parsed = parseFloat(val)
        if (parsed && vatRate) {
            const rate = parseInt(vatRate)
            const vat = parsed - (parsed / (1 + rate / 100))
            setVatAmount(vat.toFixed(2))
        }
    }

    const handleVatRateChange = (rate: string) => {
        setVatRate(rate)
        const parsed = parseFloat(amount)
        if (parsed) {
            const r = parseInt(rate)
            const vat = parsed - (parsed / (1 + r / 100))
            setVatAmount(vat.toFixed(2))
        }
    }

    const handleAddSingle = async () => {
        if (!description.trim() || !amount) {
            toast.error("Fyll i alla fält", "Beskrivning och belopp krävs.")
            return
        }

        setIsProcessing(true)
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: description.trim(),
                    counterparty: counterparty.trim() || undefined,
                    counterpartyOrgNr: counterpartyOrgNr.trim() || undefined,
                    amount: parseFloat(amount) || 0,
                    vatAmount: parseFloat(vatAmount) || 0,
                    vatRate: parseInt(vatRate) || 25,
                    date: date,
                    account: account || "1930",
                    documentRef: documentRef.trim() || undefined,
                    category: "Manuell",
                    status: "Ej bokförd"
                })
            })

            if (res.ok) {
                toast.success("Transaktion tillagd", `"${description}" har lagts till.`)
                onOpenChange(false)
                resetForm()
                window.dispatchEvent(new Event('transactions-updated'))
            } else {
                toast.error("Kunde inte spara", "Ett fel uppstod vid sparande.")
            }
        } catch (error) {
            console.error('Create transaction failed:', error)
            toast.error("Kunde inte spara", "Ett fel uppstod vid sparande.")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setIsProcessing(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'ocr')

            const res = await fetch('/api/transactions/import', {
                method: 'POST',
                body: formData
            })

            if (res.ok) {
                await res.json()
                // Success - close dialog and refresh
                onOpenChange(false)
                resetForm()
                window.dispatchEvent(new Event('transactions-updated'))
            }
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setIsProcessing(false)
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Lägg till transaktioner</DialogTitle>
                </DialogHeader>

                {/* Tab buttons */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={cn(
                            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'manual'
                                ? "bg-background shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Manuell
                    </button>
                    <button
                        onClick={() => setActiveTab('ocr')}
                        className={cn(
                            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'ocr'
                                ? "bg-background shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Filuppladdning
                    </button>
                </div>

                <div className="py-4">
                    {activeTab === 'manual' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Beskrivning <span className="text-destructive">*</span></label>
                                <Input
                                    placeholder="T.ex. Kontorsmaterial, Hyra december"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Motpart</label>
                                    <Input
                                        placeholder="T.ex. Leverantör AB"
                                        value={counterparty}
                                        onChange={(e) => setCounterparty(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Org-nr / Personnr</label>
                                    <Input
                                        placeholder="556123-4567"
                                        value={counterpartyOrgNr}
                                        onChange={(e) => setCounterpartyOrgNr(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Belopp (inkl. moms) <span className="text-destructive">*</span></label>
                                    <Input
                                        placeholder="0.00 kr"
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => handleAmountChange(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Datum</label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Momssats</label>
                                    <Select value={vatRate} onValueChange={handleVatRateChange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="25">25%</SelectItem>
                                            <SelectItem value="12">12%</SelectItem>
                                            <SelectItem value="6">6%</SelectItem>
                                            <SelectItem value="0">0% (momsfritt)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Varav moms</label>
                                    <Input
                                        placeholder="0.00 kr"
                                        type="number"
                                        step="0.01"
                                        value={vatAmount}
                                        onChange={(e) => setVatAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Konto</label>
                                    <Input
                                        placeholder="T.ex. 1930"
                                        value={account}
                                        onChange={(e) => setAccount(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Verifikationsunderlag</label>
                                <Input
                                    placeholder="Fakturanr, kvittonr eller referens"
                                    value={documentRef}
                                    onChange={(e) => setDocumentRef(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'ocr' && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Ladda upp fil — AI analyserar innehållet oavsett typ (Z-rapport, CSV, faktura, kvitto).
                            </div>
                            <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">
                                            {file ? file.name : 'Välj fil eller dra hit'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PDF, bild, CSV eller Excel
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Avbryt</Button>
                    </DialogClose>
                    {activeTab === 'manual' ? (
                        <Button
                            onClick={handleAddSingle}
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Sparar...' : 'Lägg till'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleUpload}
                            disabled={!file || isProcessing}
                        >
                            {isProcessing ? 'Bearbetar...' : 'Importera'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
