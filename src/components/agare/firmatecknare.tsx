'use client';

import { useMemo, useState } from 'react';
import {
    PenTool,
    Plus,
    Calendar,
    Check,
    X,
    MoreHorizontal,
    User,
    History,
    UserMinus,
    Pencil,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useCompany } from '@/providers/company-provider';
import { useToast } from '@/components/ui/toast';
import { deriveSignatories, type Signatory } from './firmatecknare-logic';
import { type Partner, type BoardMeeting, type OwnerInfo } from '@/types/ownership';
import { useCompliance } from "@/hooks/use-compliance"
import { usePartners } from "@/hooks/use-partners"
import { useMembers } from "@/hooks/use-members"

export function Firmatecknare() {
    const { companyType, company } = useCompany();
    const toast = useToast();
    const [selectedSignatory, setSelectedSignatory] = useState<Signatory | null>(null);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);

    // Fetch real data
    const { shareholders, documents } = useCompliance();
    const { partners } = usePartners();
    const { members } = useMembers();
    
    // Map documents to BoardMeetings for logic helper (adapter)
    const boardMeetings = useMemo(() => {
        return documents
            .filter(d => d.type === 'board_meeting_minutes')
            .map(d => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let content: any = {};
                try {
                    const parsed = JSON.parse(d.content);
                    if (parsed && typeof parsed === 'object') content = parsed;
                } catch {
                    // ignore
                }
                
                return {
                    id: d.id,
                    date: d.date,
                    status: (d.status === 'signed' ? 'protokoll signerat' : 'planerad'),
                    chairperson: content.chairperson || '',
                    attendees: Array.isArray(content.attendees) ? content.attendees : [],
                    secretary: content.secretary || '',
                    location: content.location || '',
                    type: content.type || 'ordinarie',
                    agendaItems: content.agendaItems || [],
                    absentees: content.absentees || [],
                    meetingNumber: content.meetingNumber || 0
                }
            });
    }, [documents]);

    const ownerInfo = useMemo((): OwnerInfo => ({
        companyType: companyType as OwnerInfo['companyType'],
        partners: partners as Partner[],
        boardMembers: (members || [])
            .filter(m => m.roles.some(r => r.toLowerCase().includes('styrelse') || r.toLowerCase().includes('ordförande')))
            .map(m => ({
                name: m.name,
                role: m.roles.find(r => r.toLowerCase().includes('ordförande')) ? 'Ordförande' : 'Ordinarie ledamot',
                since: m.joinDate
            })),
        owner: companyType === 'ef' ? {
            name: company?.contactPerson || 'Ägare',
            personalNumber: '',
            address: '',
            fSkatt: true,
            momsRegistered: true,
        } : undefined,
    }), [companyType, partners, members, company]);

    // Map API shareholders to the format expected by deriveSignatories
    const mappedShareholders = useMemo(() => {
        const totalShares = shareholders.reduce((sum, s) => sum + (s.shares_count || 0), 0) || 1
        return shareholders.map(s => ({
            id: s.id,
            name: s.name,
            personalNumber: s.ssn_org_nr,
            type: 'person' as const,
            shares: s.shares_count,
            shareClass: (s.share_class || 'B') as 'A' | 'B',
            ownershipPercentage: Math.round((s.shares_count / totalShares) * 100),
            acquisitionDate: '',
            acquisitionPrice: 0,
            votes: s.shares_count * (s.share_class === 'A' ? 10 : 1),
            votesPercentage: 0,
        }))
    }, [shareholders])

    // Derive signatories from real ownership data based on company type
    const signatories = useMemo<Signatory[]>(() => {
        return deriveSignatories(companyType, {
            shareholders: mappedShareholders,
            partners: partners as Partner[],
            boardMeetings: boardMeetings as BoardMeeting[],
            ownerInfo: ownerInfo as OwnerInfo
        });
    }, [companyType, mappedShareholders, partners, boardMeetings, ownerInfo]);

    const activeSignatories = signatories.filter(s => s.isActive);
    const ensamSignatories = activeSignatories.filter(s => s.signatureType === 'ensam');
    const gemensamSignatories = activeSignatories.filter(s => s.signatureType === 'gemensam');

    const handleAdd = () => {
        toast.info(
            "Lägg till firmatecknare",
            "Firmatecknare härleds automatiskt från ägarstruktur och styrelse. Lägg till aktieägare i Aktiebok eller styrelseledamöter via Möten & Protokoll. Ändringar måste registreras hos Bolagsverket."
        )
    }

    const handleEdit = (signatory: Signatory) => {
        toast.info(
            "Redigera firmatecknare",
            `Firmateckningsrätten för ${signatory.name} baseras på rollen "${signatory.role}". Ändra ägarandel eller styrelseroll för att påverka firmateckningsrätten. Registrera ändringar hos Bolagsverket.`
        )
    }

    const handleHistory = (signatory: Signatory) => {
        setSelectedSignatory(signatory)
        setShowHistoryDialog(true)
    }

    const handleDeregister = (signatory: Signatory) => {
        toast.info(
            "Avregistrera firmatecknare",
            `För att avregistrera ${signatory.name} som firmatecknare behöver du ändra ägarandel eller styrelseroll, och sedan anmäla ändringen till Bolagsverket via "Ny åtgärd" under Händelser.`
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Firmatecknare"
                subtitle={`Firmatecknare baserat på ${company?.name || 'företagets'} ägarstruktur och styrelse.`}
                actions={
                    <Button size="sm" className="gap-1.5" onClick={handleAdd}>
                        <Plus className="h-4 w-4" />
                        Lägg till
                    </Button>
                }
            />

            {/* Ensam firmateckning */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-emerald-500" />
                        Ensam firmateckning
                    </CardTitle>
                    <CardDescription>
                        Dessa personer kan teckna firman var för sig.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {ensamSignatories.length > 0 ? (
                        <div className="divide-y">
                            {ensamSignatories.map((signatory) => (
                                <SignatoryRow key={signatory.id} signatory={signatory} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                            Inga registrerade med ensam firmateckningsrätt.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Gemensam firmateckning */}
            {gemensamSignatories.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <PenTool className="h-4 w-4 text-blue-500" />
                            Gemensam firmateckning
                        </CardTitle>
                        <CardDescription>
                            Dessa personer måste teckna firman tillsammans (två i förening).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {gemensamSignatories.map((signatory) => (
                                <SignatoryRow key={signatory.id} signatory={signatory} />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info card */}
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">
                        💡 Ändringar av firmatecknare måste registreras hos Bolagsverket.
                        Använd &quot;Ny åtgärd&quot; under Händelser för att starta processen.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function SignatoryRow({ signatory }: { signatory: Signatory }) {
    return (
        <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium">{signatory.name}</p>
                    <p className="text-xs text-muted-foreground">{signatory.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Från {signatory.validFrom}
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                    signatory.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}>
                    {signatory.isActive ? (
                        <>
                            <Check className="h-3 w-3" />
                            Aktiv
                        </>
                    ) : (
                        <>
                            <X className="h-3 w-3" />
                            Inaktiv
                        </>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Redigera</DropdownMenuItem>
                        <DropdownMenuItem>Visa historik</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Avregistrera</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
