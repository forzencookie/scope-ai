
import { UserPlus, Briefcase, Coins, Check, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"

interface EmployeePreviewProps {
    data: {
        name: string
        role: string
        email: string
        salary: number | string
    }
}

export function EmployeePreview({ data }: EmployeePreviewProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const { addToast: toast } = useToast()
    const handleConfirm = async () => {
        setStatus('saving')
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    salary: Number(data.salary)
                })
            })

            if (res.ok) {
                setStatus('saved')
                toast({
                    title: "Anställd registrerad",
                    description: `${data.name} har lagts till i teamet.`
                })
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
            toast({
                title: "Kunde inte spara",
                description: "Ett fel uppstod vid registrering.",
                variant: "destructive"
            })
        }
    }

    if (status === 'saved') {
        return (
            <Card className="w-full max-w-sm overflow-hidden border-green-100 dark:border-green-900 bg-background/95 backdrop-blur-sm shadow-sm ring-1 ring-green-100/20">
                <div className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Check className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold">Registrering klar</h3>
                        <p className="text-sm text-muted-foreground">{data.name} är nu tillagd.</p>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => window.location.href = '/dashboard/loner?tab=team'}
                    >
                        Gå till Team
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm overflow-hidden border-indigo-100 dark:border-indigo-900 bg-background/95 backdrop-blur-sm shadow-sm ring-1 ring-indigo-100/20">
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/20">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg shrink-0">
                        <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-sm leading-none">
                            Ny anställd
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Bekräfta uppgifter för registrering
                        </p>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
                <div className="grid gap-2">
                    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 border border-border/50">
                        <div className="h-8 w-8 rounded-full bg-indigo-100/50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {data.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{data.name}</p>
                            <p className="text-xs text-muted-foreground">{data.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-md bg-muted/30 border border-border/50 space-y-1">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> Roll
                            </span>
                            <p className="text-sm font-medium">{data.role}</p>
                        </div>
                        <div className="p-2 rounded-md bg-muted/30 border border-border/50 space-y-1">
                            <span className="text-[10px] uppercase text-muted-foreground font-semibold flex items-center gap-1">
                                <Coins className="h-3 w-3" /> Lön
                            </span>
                            <p className="text-sm font-medium">{formatCurrency(Number(data.salary))}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-muted/20 border-t border-border flex justify-end gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={status === 'saving'}
                >
                    Avbryt
                </Button>
                <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    onClick={handleConfirm}
                    disabled={status === 'saving'}
                >
                    {status === 'saving' ? 'Sparar...' : 'Bekräfta & Spara'}
                </Button>
            </div>
        </Card>
    )
}
