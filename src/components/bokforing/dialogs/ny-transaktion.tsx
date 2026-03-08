"use client"

import { useState } from "react"
import { Plus, Upload } from "lucide-react"
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
    /** If set, opens directly in upload mode */
    mode?: 'manual' | 'upload'
}

export function NewTransactionDialog({ open, onOpenChange, mode: initialMode }: NewTransactionDialogProps) {
    const toast = useToast()
    const [mode, setMode] = useState<'choose' | 'manual' | 'upload'>(initialMode || 'choose')
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Simplified form: just 3 fields
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])

    const resetForm = () => {
        setDescription("")
        setAmount("")
        setDate(new Date().toISOString().split('T')[0])
        setFile(null)
        setMode(initialMode || 'choose')
    }

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) resetForm()
        onOpenChange(isOpen)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleAddManual = async () => {
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
                    date,
                    account: "1930",
                    category: "Manuell",
                    status: "Ej bokförd"
                })
            })

            if (res.ok) {
                toast.success("Transaktion tillagd", `"${description}" har lagts till.`)
                handleClose(false)
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
                toast.success("Import klar", `"${file.name}" har importerats.`)
                handleClose(false)
                window.dispatchEvent(new Event('transactions-updated'))
            } else {
                toast.error("Import misslyckades", "Kunde inte importera filen.")
            }
        } catch (error) {
            console.error('Upload failed:', error)
            toast.error("Import misslyckades", "Ett oväntat fel uppstod.")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[420px]">
                {/* Mode: Choose */}
                {mode === 'choose' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Lägg till transaktion</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 py-4">
                            <button
                                onClick={() => setMode('manual')}
                                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-sm">Manuell</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">Fyll i uppgifter</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setMode('upload')}
                                className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-accent/50 transition-colors"
                            >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Upload className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-sm">Ladda upp fil</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">AI analyserar</p>
                                </div>
                            </button>
                        </div>
                    </>
                )}

                {/* Mode: Manual — simplified to 3 fields */}
                {mode === 'manual' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Ny transaktion</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Beskrivning <span className="text-destructive">*</span></label>
                                <Input
                                    placeholder="T.ex. Kontorsmaterial, Hyra december"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Belopp (kr) <span className="text-destructive">*</span></label>
                                    <Input
                                        placeholder="0.00"
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
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setMode('choose')}>Tillbaka</Button>
                            <Button onClick={handleAddManual} disabled={isProcessing}>
                                {isProcessing ? 'Sparar...' : 'Lägg till'}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* Mode: Upload */}
                {mode === 'upload' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Importera fil</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="text-sm text-muted-foreground mb-4">
                                AI analyserar innehållet — Z-rapport, CSV, faktura eller kvitto.
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
                                            <Upload className="h-6 w-6 text-muted-foreground" />
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
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setMode('choose')}>Tillbaka</Button>
                            <Button onClick={handleUpload} disabled={!file || isProcessing}>
                                {isProcessing ? 'Bearbetar...' : 'Importera'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
