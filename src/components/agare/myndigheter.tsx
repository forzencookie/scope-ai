'use client';

import { useMemo } from 'react';
import {
    ExternalLink,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCompany } from '@/providers/company-provider';
import { PageHeader } from '@/components/shared';

// Authority connection types
type AuthorityStatus = 'upcoming' | 'not_connected';

interface AuthorityConnection {
    id: string;
    authority: 'bolagsverket' | 'skatteverket';
    name: string;
    description: string;
    status: AuthorityStatus;
}

const statusConfig: Record<AuthorityStatus, { label: string; colorClass: string; bgClass: string; icon: React.ElementType }> = {
    upcoming: {
        label: 'Kommande',
        colorClass: 'text-amber-700 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-950/50',
        icon: Clock,
    },
    not_connected: {
        label: 'Ej ansluten',
        colorClass: 'text-gray-600 dark:text-gray-400',
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        icon: AlertCircle,
    },
};

export function Myndigheter() {
    const { companyType } = useCompany();

    // Build connections - all marked as upcoming since API integration is not ready
    const connections = useMemo<AuthorityConnection[]>(() => {
        const result: AuthorityConnection[] = [];

        // Bolagsverket - all company types except EF (which uses personal number)
        if (companyType !== 'ef') {
            result.push({
                id: '1',
                authority: 'bolagsverket',
                name: 'Bolagsverket',
                description: 'Företagsregistrering, styrelse, firmatecknare',
                status: 'upcoming',
            });
        }

        // Skatteverket - all company types
        result.push({
            id: '2',
            authority: 'skatteverket',
            name: 'Skatteverket',
            description: 'F-skatt, moms, arbetsgivardeklarationer',
            status: 'upcoming',
        });

        return result;
    }, [companyType]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Myndigheter"
                subtitle="Hantera kopplingar till Skatteverket och Bolagsverket."
            />
            {/* Info card */}
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
                    // const meta = authorityMeta[connection.authority];
                    const status = statusConfig[connection.status];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {(StatusIcon as any) ? <StatusIcon className="h-3 w-3" /> : null}
                                        {status.label}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Integration med {connection.name} kommer snart. Du kommer kunna synkronisera 
                                    företagsuppgifter automatiskt.
                                </p>
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => window.open(
                                            connection.authority === 'bolagsverket' 
                                                ? 'https://bolagsverket.se' 
                                                : 'https://skatteverket.se',
                                            '_blank'
                                        )}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Öppna {connection.name}
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
