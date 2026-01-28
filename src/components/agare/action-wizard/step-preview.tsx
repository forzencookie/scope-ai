"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { CorporateActionType } from "@/types/events"
import { corporateActionTypeMeta } from "@/types/events"
import { actionIcons } from "./constants"

interface StepPreviewProps {
    selectedAction: CorporateActionType
    isAddingDoc: boolean
    onBack: () => void
    onComplete: () => void
}

export function StepPreview({ selectedAction, isAddingDoc, onBack, onComplete }: StepPreviewProps) {
    const Icon = actionIcons[selectedAction]
    const isRoadmap = selectedAction === 'roadmap'
    
    return (
        <div className="space-y-4">
            <Card className="p-6 border-indigo-100/20 bg-indigo-50/5 dark:bg-indigo-950/10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900">
                        <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-lg font-bold tracking-tight">{corporateActionTypeMeta[selectedAction].label}</p>
                        <p className="text-sm text-indigo-500 font-medium tracking-wide uppercase">
                            {isRoadmap ? 'Skapar ny företagsplan' : 'Genererar utkast till protokoll'}
                        </p>
                    </div>
                </div>
                {isRoadmap ? (
                    <div className="p-4 bg-blue-50/80 dark:bg-blue-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm">
                        <div className="flex gap-3">
                            <div className="h-5 w-5 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0">💡</div>
                            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                                Din plan kommer att skapas med steg som du kan bocka av efterhand. Du hittar den under Planering.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50 backdrop-blur-sm">
                        <div className="flex gap-3">
                            <div className="h-5 w-5 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0">⚠️</div>
                            <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
                                Denna åtgärd kräver digital signatur från behörig firmatecknare innan den kan registreras hos Bolagsverket.
                            </p>
                        </div>
                    </div>
                )}
            </Card>
            <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={onBack}>
                    Gör ändringar
                </Button>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none min-w-[140px]"
                    onClick={onComplete}
                    disabled={isAddingDoc}
                >
                    {isAddingDoc ? 'Skapar...' : (isRoadmap ? 'Skapa plan' : 'Skapa åtgärd')}
                </Button>
            </div>
        </div>
    )
}
