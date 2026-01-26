'use client';

// import { useState } from 'react';
import {
    FileText,
    Download,
    Eye,
    Clock,
    Check,
    AlertCircle,
    MoreHorizontal,
    Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import type { CorporateDocumentType } from '@/types/documents';

// Mock document data
interface DocumentItem {
    id: string;
    title: string;
    type: CorporateDocumentType;
    version: number;
    createdAt: string;
    signatureStatus: 'none' | 'pending' | 'partial' | 'complete';
    signaturesRequired: number;
    signaturesSigned: number;
}

const documentTypeMeta: Record<CorporateDocumentType, { label: string; colorClass: string; bgClass: string }> = {
    board_protocol: {
        label: 'Styrelseprotokoll',
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    },
    shareholder_protocol: {
        label: 'Bolagsstämmoprotokoll',
        colorClass: 'text-purple-600 dark:text-purple-400',
        bgClass: 'bg-purple-100 dark:bg-purple-950/50',
    },
    authority_form: {
        label: 'Myndighetsformulär',
        colorClass: 'text-orange-600 dark:text-orange-400',
        bgClass: 'bg-orange-100 dark:bg-orange-950/50',
    },
    statute_amendment: {
        label: 'Bolagsordningsändring',
        colorClass: 'text-indigo-600 dark:text-indigo-400',
        bgClass: 'bg-indigo-100 dark:bg-indigo-950/50',
    },
    other: {
        label: 'Övrigt',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
    },
};

const signatureStatusConfig: Record<string, { label: string; colorClass: string; bgClass: string; icon: LucideIcon }> = {
    none: {
        label: 'Inga signaturer',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        icon: FileText,
    },
    pending: {
        label: 'Väntar på signatur',
        colorClass: 'text-amber-700 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-950/50',
        icon: Clock,
    },
    partial: {
        label: 'Delvis signerat',
        colorClass: 'text-blue-700 dark:text-blue-400',
        bgClass: 'bg-blue-100 dark:bg-blue-950/50',
        icon: AlertCircle,
    },
    complete: {
        label: 'Signerat',
        colorClass: 'text-emerald-700 dark:text-emerald-400',
        bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
        icon: Check,
    },
};

const mockDocuments: DocumentItem[] = [
    {
        id: '1',
        title: 'Styrelseprotokoll 2024-12-15',
        type: 'board_protocol',
        version: 1,
        createdAt: '2024-12-15',
        signatureStatus: 'complete',
        signaturesRequired: 2,
        signaturesSigned: 2,
    },
    {
        id: '2',
        title: 'Ändringsanmälan styrelse',
        type: 'authority_form',
        version: 1,
        createdAt: '2024-12-20',
        signatureStatus: 'pending',
        signaturesRequired: 1,
        signaturesSigned: 0,
    },
    {
        id: '3',
        title: 'Bolagsstämmoprotokoll 2024',
        type: 'shareholder_protocol',
        version: 2,
        createdAt: '2024-06-15',
        signatureStatus: 'complete',
        signaturesRequired: 3,
        signaturesSigned: 3,
    },
];

interface DocumentListProps {
    documents?: DocumentItem[];
    onDocumentSelect?: (doc: DocumentItem) => void;
    showCreateButton?: boolean;
}

export function DocumentList({
    documents = mockDocuments,
    onDocumentSelect,
    showCreateButton = true
}: DocumentListProps) {
    return (
        <div className="space-y-4">
            {/* Header */}
            {showCreateButton && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Dokument kopplade till bolagsåtgärder och styrelsebeslut.
                    </p>
                    <Button size="sm" className="gap-1.5 w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        <span>Nytt dokument</span>
                    </Button>
                </div>
            )}

            {/* Document list */}
            <Card>
                <CardContent className="p-0">
                    <div className="divide-y">
                        {documents.map((doc) => {
                            const typeMeta = documentTypeMeta[doc.type];
                            const statusMeta = signatureStatusConfig[doc.signatureStatus];
                            const StatusIcon = statusMeta.icon;

                            return (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                                    onClick={() => onDocumentSelect?.(doc)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-lg", typeMeta.bgClass)}>
                                            <FileText className={cn("h-4 w-4", typeMeta.colorClass)} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{doc.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-muted-foreground">
                                                    {typeMeta.label}
                                                </span>
                                                <span className="text-muted-foreground">·</span>
                                                <span className="text-xs text-muted-foreground">
                                                    v{doc.version}
                                                </span>
                                                <span className="text-muted-foreground">·</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {doc.createdAt}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                                            statusMeta.bgClass,
                                            statusMeta.colorClass
                                        )}>
                                            <StatusIcon className="h-3 w-3" />
                                            {doc.signatureStatus !== 'none' && doc.signaturesRequired > 0 && (
                                                <span>{doc.signaturesSigned}/{doc.signaturesRequired}</span>
                                            )}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Visa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Ladda ner PDF
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {documents.length === 0 && (
                <Card className="p-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">Inga dokument ännu</p>
                </Card>
            )}
        </div>
    );
}
