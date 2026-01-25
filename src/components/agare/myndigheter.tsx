'use client';

import { useMemo } from 'react';
import {
    Building2,
    ExternalLink,
    Check,
    Clock,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCompany } from '@/providers/company-provider';

// Authority connection types
type AuthorityStatus = 'connected' | 'pending' | 'error' | 'not_connected';

interface AuthorityConnection {
    id: string;
    authority: 'bolagsverket' | 'skatteverket';
    name: string;
    description: string;
    status: AuthorityStatus;
    lastSync?: string;
    registrationNumber?: string;
}

const authorityMeta: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string }> = {
    bolagsverket: {
        icon: Building2,
        colorClass: 'text-blue-600 dark:text-blue-400',
        bgClass: 'bg-blue-100 dark:bg-blue-950/50',
    },
    skatteverket: {
        icon: Building2,
        colorClass: 'text-orange-600 dark:text-orange-400',
        bgClass: 'bg-orange-100 dark:bg-orange-950/50',
    },
};

const statusConfig: Record<AuthorityStatus, { label: string; colorClass: string; bgClass: string; icon: React.ElementType }> = {
    connected: {
        label: 'Ansluten',
        colorClass: 'text-emerald-700 dark:text-emerald-400',
        bgClass: 'bg-emerald-100 dark:bg-emerald-950/50',
        icon: Check,
    },
    pending: {
        label: 'Väntar',
        colorClass: 'text-amber-700 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-950/50',
        icon: Clock,
    },
    error: {
        label: 'Fel',
        colorClass: 'text-red-700 dark:text-red-400',
        bgClass: 'bg-red-100 dark:bg-red-950/50',
        icon: AlertCircle,
    },
    not_connected: {
        label: 'Ej ansluten',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        icon: AlertCircle,
    },
};

export function Myndigheter() {
    const { company, companyType } = useCompany();

    // Build connections based on real company data
    const connections = useMemo<AuthorityConnection[]>(() => {
        const orgNumber = company?.orgNumber || '556123-4567';
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

        const result: AuthorityConnection[] = [];

        // Bolagsverket - all company types except EF (which uses personal number)
        if (companyType !== 'ef') {
            result.push({
                id: '1',
                authority: 'bolagsverket',
                name: 'Bolagsverket',
                description: 'Företagsregistrering, styrelse, firmatecknare',
                status: 'connected',
                lastSync: now,
                registrationNumber: orgNumber,
            });
        }

        // Skatteverket - all company types
        result.push({
            id: '2',
            authority: 'skatteverket',
            name: 'Skatteverket',
            description: company?.hasMomsRegistration
                ? 'F-skatt, moms, arbetsgivardeklarationer'
                : 'F-skatt, arbetsgivardeklarationer',
            status: 'connected',
            lastSync: now,
            registrationNumber: companyType === 'ef'
                ? '198505151234' // Personal number for EF
                : orgNumber,
        });

        return result;
    }, [company, companyType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Myndigheter</h2>
                        <p className="text-muted-foreground mt-1">
                            Hantera kopplingar till Skatteverket och Bolagsverket.
                        </p>
                    </div>
                </div>
            </div>            {/* Info card */}
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">
                        💡 Anslutningar till myndigheter möjliggör automatisk hämtning av företagsdata
                        och förifyllda formulär vid ändringsanmälningar.
                    </p>
                </CardContent>
            </Card>

            {/* Authority cards */}
            <div className="grid gap-4 md:grid-cols-2">
                {connections.map((connection) => {
                    const meta = authorityMeta[connection.authority];
                    const status = statusConfig[connection.status];
                    const StatusIcon = status?.icon as any;
                    // const AuthorityIcon = meta.icon; // Icon removed

                    return (
                        <Card key={connection.id} className="border-0 shadow-none bg-muted/20">
                            <CardHeader className="pb-3 px-4 pt-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">

                                        <div>
                                            <CardTitle className="text-base">{connection.name}</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                {connection.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm",
                                        status.bgClass,
                                        status.colorClass
                                    )}>
                                        {(StatusIcon as any) ? <StatusIcon className="h-3 w-3" /> : null}
                                        {status.label}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {connection.registrationNumber && (
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">
                                            {companyType === 'ef' && connection.authority === 'skatteverket'
                                                ? 'Personnr: '
                                                : 'Org.nr: '}
                                        </span>
                                        <span className="font-mono">{connection.registrationNumber}</span>
                                    </div>
                                )}
                                {connection.lastSync && (
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <RefreshCw className="h-3 w-3" />
                                        Senast synkad: {connection.lastSync}
                                    </div>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        className="gap-2 px-4 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                    >
                                        Synka
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="gap-1.5 hover:bg-muted/50">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Öppna
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>


        </div>
    );
}
