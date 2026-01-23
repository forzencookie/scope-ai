import * as React from "react"
import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useVerifications } from "@/hooks/use-verifications"
import { useMembers, type Member } from "@/hooks/use-members"
import { useToast } from "@/components/ui/toast"

const MEMBERSHIP_FEES: Record<Member['membershipType'], number> = {
  'ordinarie': 500,
  'stödmedlem': 200,
  'hedersmedlem': 0,
}

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberCount: number
}

export function AddMemberDialog({ open, onOpenChange, memberCount }: AddMemberDialogProps) {
  const { addMember } = useMembers()
  const { addVerification } = useVerifications()
  const toast = useToast()

  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [payFee, setPayFee] = useState(true)
  const [payCapital, setPayCapital] = useState(true) // Pays Initial Capital (Insats)
  const [capitalAmount, setCapitalAmount] = useState("100") // Default insats

  const handleAddMember = async () => {
    if (!newName) {
      toast.error("Namn saknas", "Ange namn på medlemmen")
      return
    }

    try {
      // 1. Add to backend
      await addMember({
        name: newName,
        email: newEmail,
        phone: newPhone,
        memberNumber: (memberCount + 1).toString().padStart(3, '0'),
        joinDate: new Date().toISOString().split('T')[0],
        membershipType: 'ordinarie',
        status: 'aktiv',
        currentYearFeePaid: payFee,
        roles: []
      })

      // 2. Bookkeeping
      const date = new Date().toISOString().split('T')[0]

      // Capital Contribution (Insats) -> 2083
      if (payCapital && capitalAmount) {
        await addVerification({
          date,
          description: `Medlemsinsats ${newName}`,
          sourceType: 'member_capital',
          rows: [
            { account: "1930", description: `Inbetalning insats ${newName}`, debit: parseInt(capitalAmount), credit: 0 },
            { account: "2083", description: `Medlemsinsatser`, debit: 0, credit: parseInt(capitalAmount) }
          ]
        })
      }

      // Annual Fee -> 3890
      if (payFee) {
        const fee = MEMBERSHIP_FEES['ordinarie']
        if (fee > 0) {
          await addVerification({
            date,
            description: `Medlemsavgift ${newName}`,
            sourceType: 'member_fee',
            rows: [
              { account: "1930", description: `Inbetalning avgift ${newName}`, debit: fee, credit: 0 },
              { account: "3890", description: `Medlemsavgifter`, debit: 0, credit: fee }
            ]
          })
        }
      }

      toast.success("Medlem tillagd", `${newName} har lagts till i registret`)
      setNewName("")
      setNewEmail("")
      setNewPhone("")
      setPayFee(true)
      setPayCapital(true)
      setCapitalAmount("100")
      onOpenChange(false)
    } catch (error) {
      toast.error("Kunde inte lägga till medlem", "Ett fel uppstod")
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lägg till ny medlem</DialogTitle>
          <DialogDescription>
            Lägg till en ny medlem i föreningen. Du kan även välja att bokföra insats och medlemsavgift direkt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Namn</Label>
              <Input
                placeholder="För- och efternamn"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>E-post</Label>
              <Input
                placeholder="namn@exempel.se"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input
              placeholder="070-123 45 67"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>

          <div className="rounded-lg border p-3 mt-4 space-y-3 bg-muted/20">
            <h4 className="font-medium text-sm mb-2">Bokföring & Betalning</h4>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="payCapital" 
                checked={payCapital} 
                onCheckedChange={(c) => setPayCapital(!!c)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="payCapital"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Bokför Medlemsinsats (Konto 2083)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Registrera betalning av insats.
                </p>
                {payCapital && (
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-sm">Belopp:</span>
                     <Input 
                      className="h-7 w-24" 
                      value={capitalAmount} 
                      onChange={(e) => setCapitalAmount(e.target.value)} 
                    />
                    <span className="text-sm">kr</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox 
                id="payFee" 
                checked={payFee} 
                onCheckedChange={(c) => setPayFee(!!c)} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="payFee"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Bokför Årsavgift (Konto 3890)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Registrera första årets medlemsavgift (500 kr).
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleAddMember}>
            <Plus className="h-4 w-4 mr-2" />
            Lägg till medlem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
