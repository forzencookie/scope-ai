"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { VerifikationerList } from "./verifikationer-list"
import { Button } from "@/components/ui/button"
import { VerifikationDialog } from "./verifikation-dialog"

export function BookkeepingView() {
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    return (
        <div className="w-full space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Bokföring</h2>
                    <p className="text-muted-foreground">Verifikationer och huvudbok</p>
                </div>
                <Button
                    onClick={() => setCreateDialogOpen(true)}
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Ny verifikation
                </Button>
            </div>

            {/* Content - Verifikationer view */}
            <div className="mt-6">
                <VerifikationerList />
            </div>

            <VerifikationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onVerifikationCreated={() => {
                    setCreateDialogOpen(false)
                }}
            />
        </div>
    )
}
