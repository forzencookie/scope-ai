'use client';

import { useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    TooltipProvider,
} from '@/components/ui/tooltip';
import { LegalInfoCard, legalInfoContent } from '@/components/ui/legal-info-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageTabsLayout } from "@/components/shared/layout/page-tabs-layout"
import { useCompany } from '@/providers/company-provider';
import type { CompanyType } from '@/lib/company-types';
import {
    LazyAktiebok,
    LazyDelagare,
    LazyMedlemsregister,
    LazyBolagsstamma,
    LazyArsmote,
} from '@/components/shared';
import { useLastUpdated } from '@/hooks/use-last-updated';
import {
    User,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Tab configuration per company type
interface TabConfig {
    id: string;
    label: string;
    color: string;
}

// Company-type-aware tab definitions
const tabsByCompanyType: Record<CompanyType, TabConfig[]> = {
    ab: [
        { id: 'aktiebok', label: 'Aktiebok & Styrning', color: 'bg-blue-500' },
        { id: 'bolagsstamma', label: 'Möten & Beslut', color: 'bg-orange-500' },
    ],
    ef: [
        { id: 'agarinfo', label: 'Ägarinfo', color: 'bg-blue-400' },
    ],
    hb: [
        { id: 'delagare', label: 'Delägare & Styrning', color: 'bg-purple-500' },
    ],
    kb: [
        { id: 'delagare', label: 'Delägare & Styrning', color: 'bg-purple-500' },
    ],
    forening: [
        { id: 'medlemsregister', label: 'Medlemsregister', color: 'bg-indigo-500' },
        { id: 'bolagsstamma', label: 'Möten & Beslut', color: 'bg-orange-500' },
    ],
};

function ParterPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { companyType } = useCompany();
    const lastUpdated = useLastUpdated();

    const tabs = useMemo(() => {
        return tabsByCompanyType[companyType] || tabsByCompanyType.ab;
    }, [companyType]);

    const currentTab = useMemo(() => {
        const requestedTab = searchParams.get('tab') || tabs[0]?.id || 'aktiebok';
        const isTabAvailable = tabs.some(t => t.id === requestedTab);
        return isTabAvailable ? requestedTab : (tabs[0]?.id || 'aktiebok');
    }, [searchParams, tabs]);

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/agare?tab=${tab}`, { scroll: false });
    }, [router]);

    // Hide tab bar for single-tab views (EF, HB/KB)
    const showTabs = tabs.length > 1;

    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-svh">
                {showTabs && (
                    <PageTabsLayout
                        tabs={tabs}
                        currentTab={currentTab}
                        onTabChange={setCurrentTab}
                    />
                )}

                <main className="flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                    {currentTab === 'aktiebok' && <LazyAktiebok />}
                    {currentTab === 'delagare' && <LazyDelagare />}
                    {currentTab === 'agarinfo' && <EnskildFirmaOwnerInfo />}
                    {currentTab === 'medlemsregister' && <LazyMedlemsregister />}
                    {currentTab === 'bolagsstamma' && (
                        companyType === 'forening' ? (
                            <>
                                <LazyArsmote />
                            </>
                        ) : (
                            <LazyBolagsstamma />
                        )
                    )}
                </main>
            </div>
        </TooltipProvider>
    );
}

// EF: Simple owner information card
function EnskildFirmaOwnerInfo() {
    const { company } = useCompany();
    const router = useRouter();

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Företagare
                        </CardTitle>
                        <CardDescription>
                            Registrerad information hos Bolagsverket och Skatteverket
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Firmanamn</p>
                                    <p className="text-lg font-medium">{company?.name || <span className="text-muted-foreground italic text-sm">Ej angivet</span>}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Organisationsnummer</p>
                                    <p className="text-lg font-mono">{company?.orgNumber || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Företagsform</p>
                                    <p className="text-lg">Enskild firma (EF)</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Innehavare</p>
                                    <p className="text-lg font-medium">{company?.contactPerson || <span className="text-muted-foreground italic text-sm">Ej angivet</span>}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Skattestatus</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {company?.hasFskatt ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                                F-skatt
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                Saknar F-skatt
                                            </span>
                                        )}
                                        {company?.hasMomsRegistration && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                Momsregistrerad
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {company?.registrationDate && (
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registreringsdatum</p>
                                        <p className="text-lg">{company.registrationDate}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold">Firmateckning</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                I en enskild firma är det alltid du som innehavare som tecknar firman ensam.
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-xs font-medium">{company?.contactPerson || 'Du'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold">Anställda</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground mb-4">
                                Du har {company?.hasEmployees ? 'registrerat anställda' : 'inga anställda registrerade'}.
                            </p>
                            <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => router.push('/dashboard/loner')}>
                                Hantera personal
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <LegalInfoCard
                items={legalInfoContent.ef}
                variant="warning"
            />
        </div>
    );
}

function ParterPageLoading() {
    return (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Laddar parter...
        </div>
    );
}

export default function OwnershipPage() {
    return (
        <Suspense fallback={<ParterPageLoading />}>
            <ParterPageContent />
        </Suspense>
    );
}
