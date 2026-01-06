'use client';

import { useState } from 'react';
import {
    PenTool,
    Upload,
    Mail,
    Check,
    Clock,
    X,
    User,
    ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SignatureRequest, SignatureStatus } from '@/types/documents';

// Mock signatories for the flow
interface SignatoryOption {
    id: string;
    name: string;
    email: string;
    role: string;
}

const mockSignatoryOptions: SignatoryOption[] = [
    { id: '1', name: 'Anna Andersson', email: 'anna@company.se', role: 'VD' },
    { id: '2', name: 'Erik Eriksson', email: 'erik@company.se', role: 'Ordförande' },
    { id: '3', name: 'Maria Magnusson', email: 'maria@company.se', role: 'Ledamot' },
];

const statusConfig: Record<SignatureStatus, { label: string; colorClass: string; bgClass: string; icon: LucideIcon }> = {
    pending: {
        label: 'Väntar',
        colorClass: 'text-amber-700 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-950/50',
        icon: Clock,
    },
    signed: {
        label: 'Signerat',
        colorClass: 'text-emerald-700 dark:text-emerald-400',
        bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
        icon: Check,
    },
    declined: {
        label: 'Avböjt',
        colorClass: 'text-red-700 dark:text-red-400',
        bgClass: 'bg-red-100 dark:bg-red-950/50',
        icon: X,
    },
    expired: {
        label: 'Utgånget',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        icon: Clock,
    },
};

interface SignatureFlowProps {
    documentId?: string;
    documentTitle?: string;
    existingSignatures?: SignatureRequest[];
    onRequestSignature?: (signatory: SignatoryOption) => void;
    onUploadSigned?: () => void;
}

export function SignatureFlow({
    documentId,
    documentTitle = 'Dokument',
    existingSignatures = [],
    onRequestSignature,
    onUploadSigned,
}: SignatureFlowProps) {
    const [selectedSignatories, setSelectedSignatories] = useState<string[]>([]);

    const toggleSignatory = (id: string) => {
        setSelectedSignatories(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSendRequests = () => {
        selectedSignatories.forEach(id => {
            const signatory = mockSignatoryOptions.find(s => s.id === id);
            if (signatory && onRequestSignature) {
                onRequestSignature(signatory);
            }
        });
        setSelectedSignatories([]);
    };

    return (
        <div className="space-y-6">
            {/* Existing signatures */}
            {existingSignatures.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Signaturer</CardTitle>
                        <CardDescription>
                            Status för befintliga signaturförfrågningar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {existingSignatures.map((sig) => {
                                const status = statusConfig[sig.status];
                                const StatusIcon = status.icon;

                                return (
                                    <div key={sig.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{sig.signerName}</p>
                                                <p className="text-xs text-muted-foreground">{sig.signerEmail}</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                                            status.bgClass,
                                            status.colorClass
                                        )}>
                                            <StatusIcon className="h-3 w-3" />
                                            {status.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Request new signatures */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        Begär signatur
                    </CardTitle>
                    <CardDescription>
                        Välj vem som ska signera dokumentet.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="divide-y border rounded-lg">
                        {mockSignatoryOptions.map((signatory) => {
                            const isSelected = selectedSignatories.includes(signatory.id);
                            const isAlreadySigned = existingSignatures.some(
                                s => s.signerId === signatory.id && s.status === 'signed'
                            );

                            return (
                                <div
                                    key={signatory.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 cursor-pointer transition-colors",
                                        isSelected && "bg-primary/5",
                                        isAlreadySigned && "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={() => !isAlreadySigned && toggleSignatory(signatory.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                        )}>
                                            {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{signatory.name}</p>
                                            <p className="text-xs text-muted-foreground">{signatory.role}</p>
                                        </div>
                                    </div>
                                    {isAlreadySigned && (
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                            Redan signerat
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleSendRequests}
                            disabled={selectedSignatories.length === 0}
                            className="flex-1 gap-1.5"
                        >
                            <Mail className="h-4 w-4" />
                            Skicka förfrågan ({selectedSignatories.length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Manual upload option */}
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Har du redan ett signerat dokument?</p>
                                <p className="text-xs text-muted-foreground">
                                    Ladda upp en skannad eller digitalt signerad PDF.
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={onUploadSigned}>
                            Ladda upp
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
