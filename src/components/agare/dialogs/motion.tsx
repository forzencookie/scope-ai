"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface MotionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit?: (data: any) => void
}

export function MotionDialog({ open, onOpenChange, onSubmit }: MotionDialogProps) {
    const [title, setTitle] = React.useState("")
    const [motioner, setMotioner] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [date, setDate] = React.useState("")

    // Reset form when dialog opens
    React.useEffect(() => {
        if (open) {
            setTitle("")
            setMotioner("")
            setDescription("")
            setDate(new Date().toISOString().split('T')[0])
        }
    }, [open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg" expandable>
                <DialogHeader>
                    <DialogTitle>Registrera motion</DialogTitle>
                    <DialogDescription>
                        Registrera en motion från medlem till kommande årsmöte
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Rubrik</Label>
                        <Input 
                            placeholder="Kort beskrivning av motionen" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Motionär</Label>
                        <Input 
                            placeholder="Namn på medlem som lämnat motionen" 
                            value={motioner}
                            onChange={(e) => setMotioner(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Beskrivning</Label>
                        <Textarea
                            placeholder="Fullständig text för motionen..."
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Datum inlämnad</Label>
                        <Input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Avbryt
                    </Button>
                    <Button onClick={() => {
                        onSubmit?.({ title, motioner, description, date })
                        onOpenChange(false)
                    }}>
                        Registrera motion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
