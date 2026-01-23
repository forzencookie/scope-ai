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
    onSubmit?: (data: any) => void
}

export function MotionDialog({ open, onOpenChange, onSubmit }: MotionDialogProps) {
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
                        <Input placeholder="Kort beskrivning av motionen" />
                    </div>
                    <div className="space-y-2">
                        <Label>Motionär</Label>
                        <Input placeholder="Namn på medlem som lämnat motionen" />
                    </div>
                    <div className="space-y-2">
                        <Label>Beskrivning</Label>
                        <Textarea
                            placeholder="Fullständig text för motionen..."
                            rows={4}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Datum inlämnad</Label>
                        <Input type="date" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Avbryt
                    </Button>
                    <Button onClick={() => {
                        onSubmit?.({})
                        onOpenChange(false)
                    }}>
                        Registrera motion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
