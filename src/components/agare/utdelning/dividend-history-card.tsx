import { Expand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { DividendTable } from "./dividend-table"
import { RegisterDividendDialog } from "./register-dividend-dialog"

interface DividendHistoryCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    history: any[]
    onRegister: (year: number, amount: number) => Promise<void>
}

export function DividendHistoryCard({ history, onRegister }: DividendHistoryCardProps) {
    return (
        <Card className="overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b-2 border-border/60 flex items-center justify-between">
                <h2 className="font-medium">Utdelningshistorik</h2>
                <div className="flex gap-2">
                    <RegisterDividendDialog onRegister={onRegister} />

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Expand className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Utdelningshistorik</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-[60vh] overflow-y-auto">
                                <DividendTable data={history} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
                <DividendTable data={history} className="border-y-0" />
            </div>
        </Card>
    )
}
