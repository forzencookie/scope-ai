// @ts-nocheck
'use client';

import { useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LegalInfoCard, legalInfoContent } from '@/components/ui/legal-info-card';
import { useCompany } from '@/providers/company-provider';
import {
    LazyAktiebok,
    LazyDelagare,
    LazyUtdelning,
    LazyMedlemsregister,
    LazyStyrelseprotokoll,
    LazyBolagsstamma,
    LazyArsmote,
    LazyFirmatecknare,
    LazyMyndigheter,
} from '@/components/shared';
import { useLastUpdated } from '@/hooks/use-last-updated';
import {
    User,
    Users,
    BookOpen,
    FileText,
    Vote,
    PenTool,
    Building2,
    DollarSign,
    type LucideIcon,
    Loader2,
} from 'lucide-react';


// Tab configuration with feature requirements
interface TabConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    feature: 'aktiebok' | 'delagare' | 'medlemsregister' | 'styrelseprotokoll' | 'bolagsstamma' | 'arsmote' | 'utdelning' | 'agarinfo' | 'k10' | null;
}

const allTabs: TabConfig[] = [
    { id: 'aktiebok', label: 'Aktiebok', icon: BookOpen, color: "bg-blue-500", feature: 'aktiebok' },
    { id: 'delagare', label: 'Delägare', icon: Users, color: "bg-purple-500", feature: 'delagare' },
    { id: 'utdelning', label: 'Utdelning', icon: DollarSign, color: "bg-emerald-500", feature: 'utdelning' },
    { id: 'agarinfo', label: 'Ägarinfo', icon: Building2, color: "bg-blue-400", feature: 'agarinfo' },
    { id: 'medlemsregister', label: 'Medlemsregister', icon: Users, color: "bg-indigo-500", feature: 'medlemsregister' },
    { id: 'styrelseprotokoll', label: 'Styrelseprotokoll', icon: FileText, color: "bg-amber-500", feature: 'styrelseprotokoll' },
    { id: 'bolagsstamma', label: 'Bolagsstämma', icon: Vote, color: "bg-orange-500", feature: 'bolagsstamma' },
    { id: 'arsmote', label: 'Årsmöte', icon: Vote, color: "bg-teal-500", feature: 'arsmote' },
    { id: 'firmatecknare', label: 'Firmatecknare', icon: PenTool, color: "bg-cyan-500", feature: null },
    { id: 'myndigheter', label: 'Myndigheter', icon: Building2, color: "bg-gray-500", feature: null },
];

// Header configuration for each tab
const tabHeaders: Record<string, { title: string; description: string }> = {
    aktiebok: {
        title: "Aktiebok",
        description: "Digital aktiebok med historik över ägarförändringar och transaktioner."
    },
    delagare: {
        title: "Delägare",
        description: "Register över delägare, deras innehav och kontaktuppgifter."
    },
    utdelning: {
        title: "Utdelning",
        description: "Planera och dokumentera aktieutdelning för delägare."
    },
    agarinfo: {
        title: "Ägarinfo",
        description: "Information om företagets ägare och deras roller."
    },
    medlemsregister: {
        title: "Medlemsregister",
        description: "Förteckning över föreningens medlemmar och medlemsstatus."
    },
    styrelseprotokoll: {
        title: "Styrelseprotokoll",
        description: "Samlade protokoll och beslutsunderlag från styrelsemöten."
    },
    bolagsstamma: {
        title: "Bolagsstämma",
        description: "Protokoll, kallelser och beslut från bolagsstämmor."
    },
    arsmote: {
        title: "Årsmöte",
        description: "Dokumentation och protokoll från årsmöten."
    },
    firmatecknare: {
        title: "Firmatecknare",
        description: "Information om registrerade firmatecknare och deras befogenheter."
    },
    myndigheter: {
        title: "Myndigheter",
        description: "Kontaktuppgifter och registrerade ärenden hos Bolagsverket och Skatteverket."
    }
};

function ParterPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { companyType, company, hasFeature } = useCompany();
    const lastUpdated = useLastUpdated();

    // Filter tabs based on available features for the current company type
    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (!tab.feature) return true;
            return hasFeature(tab.feature);
        });
    }, [hasFeature]);

    // Check if this is EF (no tabs, just owner info)
    const isEF = companyType === 'ef';

    // Default to first available tab if current tab is not available
    const currentTab = useMemo(() => {
        const requestedTab = searchParams.get('tab') || tabs[0]?.id || 'aktiebok';
        const isTabAvailable = tabs.some(t => t.id === requestedTab);
        return isTabAvailable ? requestedTab : (tabs[0]?.id || 'aktiebok');
    }, [searchParams, tabs]);

    // Removed manual expansion state as PageTabsLayout handles it

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/agare?tab=${tab}`, { scroll: false });
    }, [router]);

    // If EF, show simple owner info ...

    const currentHeader = tabHeaders[currentTab] || { title: "Parter", description: "" };

    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-svh">
                {/* Tabs */}
                <div className="px-6 pt-6">
                    <PageTabsLayout
                        tabs={tabs}
                        currentTab={currentTab}
                        onTabChange={setCurrentTab}
                        lastUpdated={lastUpdated}
                        maxVisibleTabs={3} // Keep original behavior of 3 visible tabs
                    />
                </div>

                {/* Tab Content - Two Column Layout */}
                <main className="flex gap-6 p-6">
                    {/* Main Content */}
                    <div className="flex-1 min-w-0 max-w-6xl">
                        {/* Dynamic Tab Header - Only show for tabs that don't have their own header with actions */}
                        {!['aktiebok', 'styrelseprotokoll', 'bolagsstamma', 'medlemsregister'].includes(currentTab) && (
                            <div className="pb-6">
                                <h2 className="text-xl font-semibold">{currentHeader.title}</h2>
                                <p className="text-sm text-muted-foreground">{currentHeader.description}</p>
                            </div>
                        )}

                        {currentTab === 'aktiebok' && <LazyAktiebok />}
                        {currentTab === 'delagare' && <LazyDelagare />}
                        {currentTab === 'utdelning' && <LazyUtdelning />}
                        {currentTab === 'agarinfo' && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ägaröversikt</CardTitle>
                                        <CardDescription>Detaljerad information om alla registrerade ägare.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground">Ägarinformation hämtas från aktieboken och Bolagsverket.</div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        {currentTab === 'medlemsregister' && <LazyMedlemsregister />}
                        {currentTab === 'styrelseprotokoll' && <LazyStyrelseprotokoll />}
                        {currentTab === 'bolagsstamma' && <LazyBolagsstamma />}
                        {currentTab === 'arsmote' && <LazyArsmote />}
                        {currentTab === 'firmatecknare' && <LazyFirmatecknare />}
                        {currentTab === 'myndigheter' && <LazyMyndigheter />}
                    </div>

                    {/* Right Sidebar - Activity Panel */}
                    <div id="page-right-sidebar" className="hidden xl:block w-80 shrink-0" />
                </main>
            </div>
        </TooltipProvider>
    );
}

// EF: Simple owner information card
function EnskildFirmaOwnerInfo() {
    const { company } = useCompany();

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Företagare
                    </CardTitle>
                    <CardDescription>
                        Information om dig som enskild näringsidkare
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Firmanamn</p>
                                <p className="text-lg">{company?.name || 'Demo Enskild Firma'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Organisationsform</p>
                                <p className="text-lg">Enskild firma (EF)</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Registreringsdatum</p>
                                <p className="text-lg">2023-01-15</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Företagare</p>
                                <p className="text-lg">Anna Andersson</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">F-skatt</p>
                                <p className="text-lg text-green-600 dark:text-green-500/70">Godkänd</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Momsregistrerad</p>
                                <p className="text-lg text-green-600 dark:text-green-500/70">Ja</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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

export default function ParterPage() {
    return (
        <Suspense fallback={<ParterPageLoading />}>
            <ParterPageContent />
        </Suspense>
    );
}
