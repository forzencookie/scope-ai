"use client"

import { Check, ArrowRight, User, Briefcase, Coins, Mail } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"
import { useToast } from "@/components/ui/toast"
import { ActionCard } from "@/components/ai/chat-tools/action-cards/action-card"

interface EmployeeDetailProps {
    data: {
        name: string
        role: string
        email: string
        salary: number | string
    }
}

export function EmployeeDetail({ data }: EmployeeDetailProps) {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const { addToast: toast } = useToast()

    const handleConfirm = async () => {
        setStatus('saving')
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    salary: Number(data.salary)
                })
            })

            if (res.ok) {
                setStatus('saved')
                toast({
                    title: "Anställd registrerad",
                    description: `${data.name} har lagts till i teamet.`
                })
            } else {
                throw new Error("Failed to save")
            }
        } catch (error) {
            console.error(error)
            setStatus('error')
            toast({
                title: "Kunde inte spara",
                description: "Ett fel uppstod vid registrering.",
                variant: "destructive"
            })
        }
    }

    return (
        <ActionCard
            confirmation={{
                title: "Ny anställd",
                description: "Registrera i systemet",
                summary: [
                    { label: "Namn", value: data.name },
                    { label: "Roll", value: data.role },
                    { label: "Lön", value: `${formatCurrency(Number(data.salary))} / mån` },
                    { label: "E-post", value: data.email },
                ],
                action: { toolName: "create_employee", params: data },
            }}
            onConfirm={handleConfirm}
            onCancel={() => {}}
            isLoading={status === 'saving'}
            isDone={status === 'saved'}
            completedAction="created"
            completedTitle="Anställd registrerad"
            confirmLabel="Registrera"
            icon={User}
            accent="emerald"
        />
    )
}
