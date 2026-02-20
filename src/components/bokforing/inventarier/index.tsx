"use client"

import { Plus, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/shared"
import { SearchBar } from "@/components/ui/search-bar"
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
        searchQuery, setSearchQuery,
        newAsset, setNewAsset,
        isLoading,

        // Data
        filteredInventarier,
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
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 overflow-hidden w-[120px] sm:w-auto">
                                    <Plus className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Ny tillgång</span>
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
                }
            />


            {/* Stats Cards */}
            <InventarierStats stats={stats} isLoading={isLoading} />

            {/* Section Separator */}
            <div className="border-b-2 border-border/60" />

            {/* Table Title */}
            <div className="flex items-center justify-between gap-3 py-1">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                    Alla tillgångar
                </h3>
                <div className="flex items-center gap-2">
                    <SearchBar
                        placeholder="Sök tillgång..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                    <Button variant="outline" className="gap-2 shrink-0" onClick={handleDepreciate}>
                        <Calculator className="h-4 w-4 shrink-0" />
                        <span className="truncate">Bokför avskrivning</span>
                    </Button>
                </div>
            </div>

            {/* Assets Grid */}
            <InventarierGrid
                inventarier={filteredInventarier}
                isLoading={isLoading}
                selection={selection}
            />
        </div>
    )
}
