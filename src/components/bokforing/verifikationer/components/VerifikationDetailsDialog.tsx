import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AppStatusBadge } from "@/components/ui/status-badge"
import { Download, Check } from "lucide-react"
import { Verification } from "../types"

interface VerifikationDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    verification: Verification | null
    onDownload: () => void
    onApprove: () => void
}

export function VerifikationDetailsDialog({
    open,
    onOpenChange,
    verification,
    onDownload,
    onApprove
}: VerifikationDetailsDialogProps) {
    if (!verification) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Verifikation #{verification.id}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Datum</p>
                            <p className="font-medium">{verification.date}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Konto</p>
                            <p className="font-medium">{verification.konto} - {verification.kontoName}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Beskrivning</p>
                            <p className="font-medium">{verification.description}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Belopp</p>
                            <p className={`font-medium ${verification.amount >= 0 ? "text-green-600 dark:text-green-500/70" : ""}`}>
                                {verification.amount.toLocaleString('sv-SE')} kr
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <div className="flex gap-2 mt-1">
                                <AppStatusBadge
                                    status={verification.hasTransaction ? "Transaktion kopplad" : "Transaktion saknas"}
                                    size="sm"
                                />
                                <AppStatusBadge
                                    status={verification.hasUnderlag ? "Underlag finns" : "Underlag saknas"}
                                    size="sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Stäng</Button>
                    </DialogClose>
                    <Button variant="outline" onClick={onDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner
                    </Button>
                    <Button onClick={onApprove}>
                        <Check className="h-4 w-4 mr-2" />
                        Godkänn
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
