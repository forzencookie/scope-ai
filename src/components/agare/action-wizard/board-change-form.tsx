"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Minus, Plus } from "lucide-react"

interface BoardChangeFormProps {
    onBack: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => void
}

export function BoardChangeForm({ onBack, onSubmit }: BoardChangeFormProps) {
    const [newMember, setNewMember] = useState("")
    const [changeDate, setChangeDate] = useState(new Date().toISOString().split('T')[0])
    const [boardMembers, setBoardMembers] = useState<string[]>(['Rice'])

    const handleAddMember = () => {
        if (newMember) {
            setBoardMembers(prev => [...prev, newMember])
            setNewMember('')
        }
    }

    const handleRemoveMember = (name: string) => {
        setBoardMembers(prev => prev.filter(m => m !== name))
    }

    const handleSubmit = () => {
        onSubmit({
            changeDate,
            boardMembers
        })
    }

    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nuvarande / Ny styrelse</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {boardMembers.map(name => (
                                <div key={name} className="text-sm px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg flex items-center gap-2">
                                    <span className="font-medium">{name}</span>
                                    <button
                                        onClick={() => handleRemoveMember(name)}
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Minus className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-3 pt-2">
                        <div>
                            <Label htmlFor="newMember">Lägg till styrelseledamot</Label>
                            <div className="flex gap-2 mt-1.5">
                                <Input
                                    id="newMember"
                                    placeholder="Namn på ledamot"
                                    value={newMember}
                                    onChange={(e) => setNewMember(e.target.value)}
                                />
                                <Button variant="outline" size="icon" onClick={handleAddMember}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="changeDate">Ändringsdatum</Label>
                            <Input
                                id="changeDate"
                                type="date"
                                value={changeDate}
                                onChange={(e) => setChangeDate(e.target.value)}
                                className="mt-1.5"
                            />
                        </div>
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
