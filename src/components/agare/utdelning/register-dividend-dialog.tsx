import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"

interface RegisterDividendDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onRegister: (year: number, amount: number) => Promise<void>
}

export function RegisterDividendDialog({ open, onOpenChange, onRegister }: RegisterDividendDialogProps) {
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [amount, setAmount] = useState<string>("")

    const handleRegister = async () => {
        const val = parseInt(amount.replace(/\s/g, ''))
        const y = parseInt(year)
        if (val && y) {
            await onRegister(y, val)
            onOpenChange(false)
            setAmount("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrera ny utdelning</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Belopp (kr)</Label>
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
                        <p className="font-medium text-foreground mb-1">Detta händer:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Ett digitalt stämmoprotokoll skapas automatiskt (Bolagsverket-krav).</li>
                            <li>Beloppet bokförs och dras från Bolagets resultat.</li>
                            <li>K10-underlaget uppdateras.</li>
                        </ul>
                    </div>
                    <Button className="w-full" onClick={handleRegister}>
                        Bekräfta utdelning
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
