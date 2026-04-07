"use client"

import dynamic from "next/dynamic"
import { z } from "zod"
import { downloadElementAsPDF } from "@/lib/generators/pdf-generator"

const BoardMinutesPreview = dynamic(() => import("../documents/board-minutes-preview").then(m => ({ default: m.BoardMinutesPreview })), { ssr: false })

export const AttendeeSchema = z.object({
    name: z.string(),
    role: z.enum(["Chairman", "Member", "Deputy", "Secretary", "Adjunct"]),
    present: z.boolean()
})

export const MeetingDecisionSchema = z.object({
    id: z.string(),
    paragraph: z.string(),
    title: z.string(),
    description: z.string(),
    decision: z.string(),
    type: z.enum(["decision", "info", "election"])
})

export const SignatureSchema = z.object({
    role: z.string(),
    name: z.string()
})

export const BoardMinutesDataSchema = z.object({
    companyName: z.string(),
    meetingType: z.string(),
    meetingNumber: z.string().optional(),
    date: z.string(),
    time: z.string().optional(),
    location: z.string(),
    attendees: z.array(AttendeeSchema),
    agenda: z.array(z.string()),
    decisions: z.array(MeetingDecisionSchema),
    nextMeeting: z.string().optional(),
    signatures: z.array(SignatureSchema)
})

export const BoardMinutesSchema = z.object({
    data: BoardMinutesDataSchema,
    className: z.string().optional()
})

export type BoardMinutesProps = z.infer<typeof BoardMinutesSchema>

export function BoardMinutesCard(props: BoardMinutesProps) {
    return (
        <BoardMinutesPreview
            {...props}
            actions={{
                onDownload: () => downloadElementAsPDF({
                    fileName: `protokoll-${props.data?.date || 'datum'}`,
                    format: 'a4'
                })
            }}
        />
    )
}
