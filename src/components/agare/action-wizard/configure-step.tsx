"use client"

import type { CorporateActionType } from "@/types/events"
import { Shareholder } from "@/hooks/use-compliance"
import { BoardChangeForm } from "./board-change-form"
import { DividendForm } from "./dividend-form"
import { RoadmapForm } from "./roadmap-form"
import { GenericForm } from "./generic-form"

interface ConfigureStepProps {
    actionType: CorporateActionType
    onBack: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => void
    shareholders: Shareholder[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ConfigureStep({ actionType, onBack, onContinue, shareholders }: ConfigureStepProps & { onContinue: (data: any) => void }) {
    if (actionType === 'board_change') {
        return <BoardChangeForm onBack={onBack} onSubmit={onContinue} />
    }
    if (actionType === 'dividend') {
        return <DividendForm shareholders={shareholders} onBack={onBack} onSubmit={onContinue} />
    }
    if (actionType === 'roadmap') {
        return <RoadmapForm onBack={onBack} onSubmit={onContinue} />
    }
    return <GenericForm onBack={onBack} onSubmit={onContinue} />
}
