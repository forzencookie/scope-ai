"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RoadmapFormProps {
    onBack: () => void
    onSubmit: (data: any) => void
}

export function RoadmapForm({ onBack, onSubmit }: RoadmapFormProps) {
    const [roadmapTitle, setRoadmapTitle] = useState("")
    const [description, setDescription] = useState("")

    const handleSubmit = () => {
        onSubmit({
            roadmapTitle,
            description
        })
    }

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="space-y-4">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <h4 className="font-medium text-primary mb-1">Skapa ny företagsplan</h4>
                        <p className="text-sm text-muted-foreground">
                            Beskriv ditt mål så skapar vi en strukturerad plan åt dig med hjälp av AI.
                        </p>
                    </div>
                    <div>
                        <Label htmlFor="roadmapTitle">Vad vill du uppnå?</Label>
                        <Input
                            id="roadmapTitle"
                            placeholder="t.ex. Starta aktiebolag, Bokslutsplanering..."
                            value={roadmapTitle}
                            onChange={(e) => setRoadmapTitle(e.target.value)}
                            className="mt-1.5"
                        />
                    </div>
                    <div>
                        <Label htmlFor="description">Beskrivning / Kontext (Valfritt)</Label>
                        <Input
                            id="description"
                            placeholder="Mer detaljer om din situation..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1.5"
                        />
                    </div>
                </div>
            </Card>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onBack}>Tillbaka</Button>
                <Button onClick={handleSubmit}>Skapa plan</Button>
            </div>
        </div>
    )
}
