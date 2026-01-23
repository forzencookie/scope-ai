"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GenericFormProps {
    onBack: () => void
    onSubmit: (data: any) => void
}

export function GenericForm({ onBack, onSubmit }: GenericFormProps) {
    const [description, setDescription] = useState("")
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0])

    const handleSubmit = () => {
        onSubmit({
            description,
            effectiveDate
        })
    }

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="description">Beskrivning</Label>
                        <Input
                            id="description"
                            placeholder="Beskriv åtgärden..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="effectiveDate">Giltighetsdatum</Label>
                        <Input
                            id="effectiveDate"
                            type="date"
                            value={effectiveDate}
                            onChange={(e) => setEffectiveDate(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                </div>
            </Card>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onBack}>Tillbaka</Button>
                <Button onClick={handleSubmit}>Fortsätt till granskning</Button>
            </div>
        </div>
    )
}
