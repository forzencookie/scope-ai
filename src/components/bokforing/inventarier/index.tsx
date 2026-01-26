"use client"

import { Plus, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/shared"
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

        // Data
        inventarier,
        stats,
        selection,
        
        // Handlers
        handleDepreciate,
        handleAddAsset
    } = useInventarierLogic()

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header Section */}
            <PageHeader
                title="Tillgångar"
                subtitle="Datorer, möbler och andra saker du äger."
                actions={
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleDepreciate}>
                            <Calculator className="h-4 w-4" />
                            <span className="sm:inline">Bokför avskrivning</span>
                        </Button>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 w-full sm:w-auto">
                                    <Plus className="h-4 w-4" />
                                    <span className="sm:inline">Ny tillgång</span>
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
                }
            />

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
