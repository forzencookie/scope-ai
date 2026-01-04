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

interface NewTransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function NewTransactionDialog({ open, onOpenChange }: NewTransactionDialogProps) {
    const [activeTab, setActiveTab] = useState<'single' | 'z-rapport' | 'bulk'>('single')
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
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
                const data = await res.json()
                // Success - close dialog and refresh
                onOpenChange(false)
                setFile(null)
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
                                <Input placeholder="Ange beskrivning..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Belopp</label>
                                    <Input placeholder="0.00 kr" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Datum</label>
                                    <Input type="date" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Konto</label>
                                <Input placeholder="Välj konto..." />
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
                        <Button>Lägg till</Button>
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
