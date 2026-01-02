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
import { Aktiebok, Delagare, Medlemsregister, Styrelseprotokoll, Bolagsstamma, Arsmote, Firmatecknare, Myndigheter } from '@/components/parter';
import { LazyUtdelningContent } from '@/components/shared';
import { useLastUpdated } from '@/hooks/use-last-updated';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbAIBadge,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
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
} from 'lucide-react';

// Tab configuration with feature requirements
interface TabConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    feature: 'aktiebok' | 'delagare' | 'medlemsregister' | 'styrelseprotokoll' | 'bolagsstamma' | 'arsmote' | 'utdelning' | null;
}

const allTabs: TabConfig[] = [
    { id: 'aktiebok', label: 'Aktiebok', icon: BookOpen, color: "bg-blue-500", feature: 'aktiebok' },
    { id: 'delagare', label: 'Delägare', icon: Users, color: "bg-purple-500", feature: 'delagare' },
    { id: 'utdelning', label: 'Utdelning', icon: DollarSign, color: "bg-emerald-500", feature: 'utdelning' },
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

    const setCurrentTab = useCallback((tab: string) => {
        router.push(`/dashboard/parter?tab=${tab}`, { scroll: false });
    }, [router]);

    // If EF, show simple owner info
    if (isEF) {
        return (
            <TooltipProvider>
                <div className="flex flex-col min-h-svh">
                    {/* Page Heading */}
                    <div className="px-4 pt-4">
                        <div className="w-full">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                    <User className="h-4 w-4" />
                                </div>
                                Företagare
                            </h2>
                            <p className="text-sm text-muted-foreground">Information om dig som enskild näringsidkare.</p>
                        </div>
                    </div>

                    <div className="bg-background px-4 py-4">
                        <div className="w-full">
                            <EnskildFirmaOwnerInfo />
                        </div>
                    </div>
                </div>
            </TooltipProvider>
        );
    }

    const currentHeader = tabHeaders[currentTab] || { title: "Parter", description: "" };

    return (
        <TooltipProvider>
            <div className="flex flex-col min-h-svh">
                <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        Parter
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <BreadcrumbAIBadge />
                </header>

                {/* Tab Content */}
                <div className="bg-background px-4 py-4">
                    <div className="w-full">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 pb-2 border-b-2 border-border/60 -ml-1">
                            {tabs.map((tab) => {
                                const isActive = currentTab === tab.id;


                                return (
                                    <Tooltip key={tab.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setCurrentTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                                                    isActive
                                                        ? "bg-primary/5 text-primary"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                <div className={cn("h-2 w-2 rounded-full", tab.color)} />
                                                {isActive && <span>{tab.label}</span>}
                                            </button>
                                        </TooltipTrigger>
                                        {!isActive && (
                                            <TooltipContent side="bottom">
                                                <p>{tab.label}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                );
                            })}

                            <div className="ml-auto text-sm text-muted-foreground">
                                {lastUpdated}
                            </div>
                        </div>

                        {/* Dynamic Tab Header - Only show for tabs that don't have their own header with actions */}
                        {!['aktiebok', 'styrelseprotokoll', 'bolagsstamma'].includes(currentTab) && (
                            <div className="py-6">
                                <h2 className="text-xl font-semibold">{currentHeader.title}</h2>
                                <p className="text-sm text-muted-foreground">{currentHeader.description}</p>
                            </div>
                        )}

                        {/* Tab Content */}
                        {currentTab === 'aktiebok' && <Aktiebok />}
                        {currentTab === 'delagare' && <Delagare />}
                        {currentTab === 'utdelning' && <LazyUtdelningContent />}
                        {currentTab === 'medlemsregister' && <Medlemsregister />}
                        {currentTab === 'styrelseprotokoll' && <Styrelseprotokoll />}
                        {currentTab === 'bolagsstamma' && <Bolagsstamma />}
                        {currentTab === 'arsmote' && <Arsmote />}
                        {currentTab === 'firmatecknare' && <Firmatecknare />}
                        {currentTab === 'myndigheter' && <Myndigheter />}
                    </div>
                </div>
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
        <div className="flex flex-col min-h-svh">
            <div className="px-4 pt-4">
                <div className="w-full space-y-6 animate-pulse">
                    {/* Stats cards */}
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-24 rounded-lg bg-muted" />
                        ))}
                    </div>
                    {/* Separator */}
                    <div className="border-b-2 border-border/60" />
                    {/* Table */}
                    <div className="h-96 rounded-lg bg-muted" />
                </div>
            </div>
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
