import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { useCompany } from "@/providers"
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
import { Info } from "lucide-react"
import { type Partner } from "@/types/ownership"

interface NewWithdrawalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partners: Partner[]
  onSave: (
    type: 'uttag' | 'lön' | 'insättning', 
    partnerId: string, 
    amount: number, 
    date: string, 
    description: string
  ) => Promise<void>
}

export function NewWithdrawalDialog({ open, onOpenChange, partners, onSave }: NewWithdrawalDialogProps) {
  const toast = useToast()
  const { company } = useCompany()

  const [newType, setNewType] = useState<'uttag' | 'insättning' | 'lön'>('uttag')
  const [newPartnerId, setNewPartnerId] = useState<string>("")
  const [newAmount, setNewAmount] = useState("")
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [newDesc, setNewDesc] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!newPartnerId || !newAmount || !newDesc) {
      toast.error("Saknas uppgifter", "Vänligen fyll i alla fält")
      return
    }

    try {
      setIsSubmitting(true)
      await onSave(newType, newPartnerId, parseFloat(newAmount), newDate, newDesc)
      toast.success("Transaktion sparad", "Transaktionen har bokförts.")
      
      // Reset
      setNewAmount("")
      setNewDesc("")
      setNewPartnerId("")
      onOpenChange(false)
    } catch (error) {
      toast.error("Något gick fel", "Kunde inte spara transaktionen.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrera händelse</DialogTitle>
          <DialogDescription>
            Bokför ett nytt uttag, insättning eller löneutbetalning.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-2">
             {['uttag', 'insättning', 'lön'].map((t) => (
               <Button
                 key={t}
                 variant={newType === t ? "default" : "outline"}
                 className="w-full capitalize"
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 onClick={() => setNewType(t as any)}
               >
                 {t}
               </Button>
             ))}
          </div>
          <div className="space-y-2">
            <Label>Delägare</Label>
            <select 
               className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
               value={newPartnerId}
               onChange={(e) => setNewPartnerId(e.target.value)}
            >
               <option value="" disabled>Välj delägare</option>
               {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
               ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input 
                 type="date" 
                 value={newDate}
                 onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Belopp (kr)</Label>
              <Input 
                 type="number" 
                 placeholder="0.00"
                 value={newAmount}
                 onChange={(e) => setNewAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Beskrivning</Label>
            <Input
               placeholder="T.ex. Privatuttag november"
               value={newDesc}
               onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          {/* Bank instruction info */}
          {newType === 'uttag' && newAmount && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-900/20 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Info className="h-4 w-4 text-blue-600" />
                <span>Utbetalningsinstruktion</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pl-6">
                <p>Överför <strong>{parseFloat(newAmount).toLocaleString('sv-SE')} kr</strong> från företagets konto till delägarens privatkonto.</p>
                <p>Ange &quot;{newDesc || 'Privatuttag'}&quot; som meddelande i bankens överföring.</p>
                <p className="text-amber-600 dark:text-amber-400">Verifikation skapas automatiskt i bokföringen vid spara.</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>Spara transaktion</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
