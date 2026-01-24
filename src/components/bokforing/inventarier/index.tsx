"use client"

import { Plus, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Logic
import { useInventarierLogic } from "./use-inventarier-logic"

// Sub-components
import { InventarierStats } from "./stats"
import { InventarierGrid } from "./grid"

export function InventarierTable() {
    const {
        // State
        isDialogOpen, setIsDialogOpen,
        newAsset, setNewAsset,
        isLoading,
        text,

        // Data
        inventarier,
        stats,
        selection,
        
        // Handlers
        handleDepreciate,
        handleAddAsset
    } = useInventarierLogic()

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Tillgångar</h2>
                    <p className="text-muted-foreground">
                        Datorer, möbler och andra saker du äger.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleDepreciate}>
                        <Calculator className="h-4 w-4" />
                        Bokför avskrivning
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Ny tillgång
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Lägg till inventarie</DialogTitle>
                                <DialogDescription>
                                    Registrera en ny tillgång för avskrivning.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Namn</Label>
                                    <Input
                                        value={newAsset.namn || ''}
                                        onChange={e => setNewAsset({ ...newAsset, namn: e.target.value })}
                                        placeholder="t.ex. MacBook Pro"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Inköpspris (exkl moms)</Label>
                                        <Input
                                            type="number"
                                            value={newAsset.inkopspris || ''}
                                            onChange={e => setNewAsset({ ...newAsset, inkopspris: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Datum</Label>
                                        <Input
                                            type="date"
                                            value={newAsset.inkopsdatum || ''}
                                            onChange={e => setNewAsset({ ...newAsset, inkopsdatum: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Livslängd (år)</Label>
                                    <Input
                                        type="number"
                                        value={newAsset.livslangdAr || 5}
                                        onChange={e => setNewAsset({ ...newAsset, livslangdAr: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddAsset}>Spara</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <InventarierStats stats={stats} />

            {/* Assets Grid */}
            <InventarierGrid
                inventarier={inventarier}
                isLoading={isLoading}
                selection={selection}
            />
        </div>
    )
}
