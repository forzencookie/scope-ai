import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Partner } from "@/data/ownership"

interface AddPartnerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    companyType: string | undefined
    onSave: (partner: Partial<Partner>) => Promise<void>
}

export function AddPartnerDialog({ open, onOpenChange, companyType, onSave }: AddPartnerDialogProps) {
  const showKommanditdelägare = companyType === 'kb'
  
  const [newPartner, setNewPartner] = useState<Partial<Partner>>({
    name: '',
    personalNumber: '',
    type: 'komplementär', // Default
    ownershipPercentage: 0,
    capitalContribution: 0,
  })

  const handleSave = async () => {
      await onSave(newPartner)
      onOpenChange(false)
      // Reset
      setNewPartner({
        name: '',
        personalNumber: '',
        type: 'komplementär',
        ownershipPercentage: 0,
        capitalContribution: 0,
      })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Lägg till delägare</DialogTitle>
              <DialogDescription>
                Fyll i uppgifter för den nya delägaren. 
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn</Label>
                <Input
                  id="name"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="Anna Andersson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personalNumber">Personnummer</Label>
                <Input
                  id="personalNumber"
                  value={newPartner.personalNumber}
                  onChange={(e) => setNewPartner({ ...newPartner, personalNumber: e.target.value })}
                  placeholder="YYYYMMDD-XXXX"
                />
              </div>
              {showKommanditdelägare && (
                <div className="space-y-2">
                  <Label htmlFor="partnerType">Typ av delägare</Label>
                  <Select
                    value={newPartner.type}
                    onValueChange={(value: Partner['type']) =>
                      setNewPartner({ ...newPartner, type: value })
                    }
                  >
                    <SelectTrigger id="partnerType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="komplementär">Komplementär</SelectItem>
                      <SelectItem value="kommanditdelägare">Kommanditdelägare</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="ownership">Ägarandel (%)</Label>
                <Input
                  id="ownership"
                  type="number"
                  min="0"
                  max="100"
                  value={newPartner.ownershipPercentage}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, ownershipPercentage: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capital">Insatskapital (SEK)</Label>
                <Input
                  id="capital"
                  type="number"
                  min="0"
                  value={newPartner.capitalContribution}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, capitalContribution: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
                <Button onClick={handleSave}>Lägg till delägare</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  )
}
