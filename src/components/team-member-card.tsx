"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { Mail, Phone, ArrowRight, MessageSquare } from "lucide-react"
import { Card } from "@/components/ui/card"

export interface TeamMember {
    id: string
    name: string
    role: string
    avatar?: string
    status: "active" | "remote" | "part-time"
    department: string
    joiningDate: string
    email: string
    phone: string
}

interface TeamMemberCardProps {
    member: TeamMember
    className?: string
}

const statusConfig = {
    active: {
        label: "Aktiv",
        className: "bg-emerald-100 text-emerald-700",
    },
    remote: {
        label: "Distans",
        className: "bg-orange-100 text-orange-700",
    },
    "part-time": {
        label: "Deltid",
        className: "bg-violet-100 text-violet-700",
    },
}

export function TeamMemberCard({ member, className }: TeamMemberCardProps) {
    const status = statusConfig[member.status]

    return (
        <Card
            className={cn(
                "group bg-muted/50 p-2 hover:shadow-md transition-all duration-200 cursor-pointer border-border/30",
                className
            )}
        >
            {/* Inner white card */}
            <Card className="relative h-full w-full bg-white border-border/30 shadow-none p-5">
                {/* Header with Avatar and Status */}
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                        {member.avatar ? (
                            <Image
                                src={member.avatar}
                                alt={member.name}
                                className="object-cover"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <svg
                                className="w-8 h-8 text-muted-foreground"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        )}
                    </div>
                    <span
                        className={cn(
                            "px-2.5 py-1 text-xs font-medium rounded-full",
                            status.className
                        )}
                    >
                        {status.label}
                    </span>
                </div>

                {/* Name and Role */}
                <div className="mb-4">
                    <h3 className="text-base font-semibold text-foreground mb-0.5">
                        {member.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>

                {/* Department and Joining Date */}
                <div className="flex gap-6 mb-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Avdelning</p>
                        <p className="text-sm font-medium text-foreground">{member.department}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Anställd</p>
                        <p className="text-sm font-medium text-foreground">{member.joiningDate}</p>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 pt-3 border-t border-border mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{member.phone}</span>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-border">
                    <button className="flex items-center justify-center w-full gap-2 p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Skicka meddelande">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">Meddelande</span>
                    </button>
                </div>

                {/* Hover Arrow (moved to top right) */}
                <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
            </Card>
        </Card>
    )
}
