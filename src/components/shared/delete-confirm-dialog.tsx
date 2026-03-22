"use client"

import * as React from "react"
import { text } from "@/lib/translations"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteConfirmDialogProps {
    /** Whether the dialog is open */
    open: boolean
    /** Open state change handler */
    onOpenChange: (open: boolean) => void
    /** Confirm delete handler */
    onConfirm: () => void
    /** Optional custom title */
    title?: string
    /** Optional custom description */
    description?: string
}

/**
 * Reusable delete confirmation dialog.
 * Uses centralized text from @/lib/translations for default labels.
 */
export function DeleteConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
}: DeleteConfirmDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {title ?? text.confirm.areYouSure}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description ?? text.confirm.cannotUndo}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{text.actions.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {text.actions.delete}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

/**
 * Hook for managing delete confirmation state.
 * Returns dialog props and request/confirm handlers.
 */
export function useDeleteConfirmation() {
    const [open, setOpen] = React.useState(false)
    const [itemId, setItemId] = React.useState<string | null>(null)

    const requestDelete = React.useCallback((id: string) => {
        setItemId(id)
        setOpen(true)
    }, [])

    const confirmDelete = React.useCallback(() => {
        const id = itemId
        setOpen(false)
        setItemId(null)
        return id
    }, [itemId])

    const cancelDelete = React.useCallback(() => {
        setOpen(false)
        setItemId(null)
    }, [])

    return {
        open,
        setOpen,
        itemId,
        requestDelete,
        confirmDelete,
        cancelDelete,
        dialogProps: {
            open,
            onOpenChange: setOpen,
        },
    }
}
