import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { StockTransactionType, ShareholderDisplay } from "../types"

interface TransactionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    txType: StockTransactionType
    setTxType: (type: StockTransactionType) => void
    txDate: string
    setTxDate: (date: string) => void
    txFrom: string
    setTxFrom: (val: string) => void
    txTo: string
    setTxTo: (val: string) => void
    txToSsn: string
    setTxToSsn: (val: string) => void
    txShares: string
    setTxShares: (val: string) => void
    txShareClass: 'A' | 'B'
    setTxShareClass: (val: 'A' | 'B') => void
    txPrice: string
    setTxPrice: (val: string) => void
    shareholders: ShareholderDisplay[]
    onSave: () => void
    isSubmitting?: boolean
}

const isTransferType = (type: StockTransactionType) => ['Köp', 'Gåva', 'Arv'].includes(type)

export function TransactionDialog({
    open,
    onOpenChange,
    txType,
    setTxType,
    txDate,
    setTxDate,
    txFrom,
    setTxFrom,
    txTo,
    setTxTo,
    txToSsn,
    setTxToSsn,
    txShares,
    setTxShares,
    txShareClass,
    setTxShareClass,
    txPrice,
    setTxPrice,
    shareholders,
    onSave,
    isSubmitting = false
}: TransactionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {txType === 'Nyemission' ? 'Registrera nyemission' :
                         txType === 'Split' ? 'Registrera aktiesplit' :
                         `Registrera ${txType.toLowerCase()}`}
                    </DialogTitle>
                    <DialogDescription>
                        {txType === 'Nyemission'
                            ? 'Registrera nya aktier i bolaget. Skapar bokföringsunderlag.'
                            : txType === 'Split'
                            ? 'Registrera aktiesplit. Ändrar antal aktier utan att påverka aktiekapital.'
                            : 'Registrera ägarbyte mellan aktieägare.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Transaktionstyp</Label>
                            <Select value={txType} onValueChange={(v: StockTransactionType) => setTxType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Nyemission">Nyemission</SelectItem>
                                    <SelectItem value="Köp">Köp/Försäljning</SelectItem>
                                    <SelectItem value="Gåva">Gåva</SelectItem>
                                    <SelectItem value="Arv">Arv</SelectItem>
                                    <SelectItem value="Split">Aktiesplit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Datum</Label>
                            <Input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
                        </div>
                    </div>

                    {isTransferType(txType) && (
                        <div className="space-y-2">
                            <Label>Från (Överlåtare)</Label>
                            <Select value={txFrom} onValueChange={setTxFrom}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Välj överlåtare" />
                                </SelectTrigger>
                                <SelectContent>
                                    {shareholders.map(s => (
                                        <SelectItem key={s.id} value={s.name}>{s.name} ({s.shares} aktier)</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {txType !== 'Split' && (
                        <>
                            <div className="space-y-2">
                                <Label>{txType === 'Nyemission' ? 'Till (Tecknare)' : 'Till (Mottagare)'}</Label>
                                {txType === 'Nyemission' ? (
                                    <Input value={txTo} onChange={e => setTxTo(e.target.value)} placeholder="Namn på aktieägare..." />
                                ) : (
                                    <>
                                        <Select value={txTo} onValueChange={setTxTo}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Välj mottagare" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shareholders.map(s => (
                                                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </>
                                )}
                            </div>

                            {txType === 'Nyemission' && (
                                <div className="space-y-2">
                                    <Label>Person-/Organisationsnummer</Label>
                                    <Input
                                        value={txToSsn}
                                        onChange={e => setTxToSsn(e.target.value)}
                                        placeholder="YYYYMMDD-XXXX"
                                    />
                                    <p className="text-xs text-muted-foreground">Krävs för nya aktieägare.</p>
                                </div>
                            )}
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{txType === 'Split' ? 'Splitförhållande (ex: 2 = 2:1)' : 'Antal aktier'}</Label>
                            <Input type="number" value={txShares} onChange={e => setTxShares(e.target.value)} placeholder="0" />
                        </div>
                        <div className="space-y-2">
                            <Label>Aktieslag</Label>
                            <Select value={txShareClass} onValueChange={(v: 'A' | 'B') => setTxShareClass(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">A-aktier (10 röster)</SelectItem>
                                    <SelectItem value="B">B-aktier (1 röst)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {txType !== 'Split' && txType !== 'Arv' && (
                        <div className="space-y-2">
                            <Label>Pris per aktie (kr)</Label>
                            <Input type="number" value={txPrice} onChange={e => setTxPrice(e.target.value)} placeholder="0" />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Avbryt
                    </Button>
                    <Button onClick={onSave} disabled={isSubmitting}>
                        {isSubmitting ? "Sparar..." : "Spara transaktion"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
