import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"

interface RegisterDividendDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onRegister: (year: number, amount: number) => Promise<void>
}

export function RegisterDividendDialog({ open, onOpenChange, onRegister }: RegisterDividendDialogProps) {
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [amount, setAmount] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleRegister = async () => {
        const val = parseInt(amount.replace(/\s/g, ''))
        const y = parseInt(year)
        if (val && y) {
            setIsSubmitting(true)
            try {
                await onRegister(y, val)
                onOpenChange(false)
                setAmount("")
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Planera utdelning</DialogTitle>
                    <DialogDescription>
                        Skapa ett förslag till utdelning som sedan beslutas på bolagsstämma.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Föreslagen utdelning (kr)</Label>
                        <Input
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Ex. 100 000"
                            type="number"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Inkomstår</Label>
                        <Input
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            placeholder="2024"
                            type="number"
                        />
                    </div>
                    <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Arbetsflöde:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li><strong>Planera</strong> — Du är här. Förslaget registreras.</li>
                            <li><strong>Besluta</strong> — Håll stämma och godkänn utdelningen.</li>
                            <li><strong>Bokföra</strong> — Bokför beslutet när stämman är klar.</li>
                            <li><strong>Betala</strong> — Registrera utbetalning till aktieägare.</li>
                        </ol>
                    </div>
                    <Button className="w-full" onClick={handleRegister} disabled={isSubmitting || !amount}>
                        {isSubmitting ? "Sparar..." : "Skapa förslag"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
