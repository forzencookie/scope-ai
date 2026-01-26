"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    const [activeTab, setActiveTab] = useState<'single' | 'z-rapport' | 'bulk'>('single')
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Single transaction form state
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [account, setAccount] = useState("")

    const resetForm = () => {
        setDescription("")
        setAmount("")
        setDate(new Date().toISOString().split('T')[0])
        setAccount("")
        setFile(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
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
                    amount: parseFloat(amount) || 0,
                    date: date,
                    account: account || "1930",
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
            formData.append('type', activeTab === 'z-rapport' ? 'z-rapport' : 'csv')

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
                        onClick={() => setActiveTab('single')}
                        className={cn(
                            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'single'
                                ? "bg-background shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Enskild
                    </button>
                    <button
                        onClick={() => setActiveTab('z-rapport')}
                        className={cn(
                            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'z-rapport'
                                ? "bg-background shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Z-rapport
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={cn(
                            "flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'bulk'
                                ? "bg-background shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Massimport
                    </button>
                </div>

                <div className="py-4">
                    {activeTab === 'single' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Beskrivning</label>
                                <Input
                                    placeholder="Ange beskrivning..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Belopp</label>
                                    <Input
                                        placeholder="0.00 kr"
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Konto</label>
                                <Input
                                    placeholder="T.ex. 1930"
                                    value={account}
                                    onChange={(e) => setAccount(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'z-rapport' && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Ladda upp din Z-rapport (dagsavslut) från kassan.
                                AI läser av total försäljning, kontant, kort och datum.
                            </div>
                            <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="z-rapport-upload"
                                />
                                <label htmlFor="z-rapport-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">
                                            {file ? file.name : 'Välj fil eller dra hit'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            PDF, PNG eller JPG
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'bulk' && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                Importera flera transaktioner på en gång via CSV eller Excel-fil.
                            </div>
                            <div className="border-2 border-dashed border-border/60 rounded-lg p-8 text-center">
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="bulk-upload"
                                />
                                <label htmlFor="bulk-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">
                                            {file ? file.name : 'Välj fil eller dra hit'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            CSV eller Excel
                                        </p>
                                    </div>
                                </label>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Kolumner: Datum, Beskrivning, Belopp, Konto (valfritt)
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Avbryt</Button>
                    </DialogClose>
                    {activeTab === 'single' ? (
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
