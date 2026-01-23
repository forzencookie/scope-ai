"use client"

import type { CorporateActionType } from "@/types/events"
import { corporateActionTypeMeta } from "@/types/events"
import { actionIcons, actionTypes } from "./constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StepSelectProps {
    onSelect: (type: CorporateActionType) => void
}

export function StepSelect({ onSelect }: StepSelectProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {actionTypes.map((actionType) => {
                const meta = corporateActionTypeMeta[actionType]
                const Icon = actionIcons[actionType]
                return (
                    <Card
                        key={actionType}
                        className="group cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/20 transition-all duration-300 border-indigo-100/10"
                        onClick={() => onSelect(actionType)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                    <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <CardTitle className="text-lg font-semibold">{meta.label}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-sm leading-relaxed">
                                {actionType === 'board_change' && 'Ändra styrelse, verkställande direktör eller personkrets.'}
                                {actionType === 'dividend' && 'Besluta och verkställ utdelning till aktieägare.'}
                                {actionType === 'capital_change' && 'Höj eller sänk aktiekapitalet.'}
                                {actionType === 'authority_filing' && 'Anmäl förändringar till Bolagsverket eller Skatteverket.'}
                                {actionType === 'statute_change' && 'Ändra bolagsordningen och stadgar.'}
                                {actionType === 'roadmap' && 'Skapa en ny strategisk plan eller att-göra lista.'}
                            </CardDescription>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
