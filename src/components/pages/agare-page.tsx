'use client';

import { useCallback, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbAIBadge,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
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
import { Aktiebok, Delagare } from '@/components/ownership';
import { Medlemsregister, Styrelseprotokoll, Bolagsstamma, Arsmote } from '@/components/corporate';
import { 
  Users,
  User,
  BookOpen, 
  FileText, 
  Vote, 
  Scale,
  type LucideIcon,
} from 'lucide-react';

// Tab configuration with feature requirements
interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  feature: 'aktiebok' | 'delagare' | 'medlemsregister' | 'styrelseprotokoll' | 'bolagsstamma' | 'arsmote' | null;
}

const allTabs: TabConfig[] = [
  { id: 'aktiebok', label: 'Aktiebok', icon: BookOpen, feature: 'aktiebok' },
  { id: 'delagare', label: 'Delägare', icon: Users, feature: 'delagare' },
  { id: 'medlemsregister', label: 'Medlemsregister', icon: Users, feature: 'medlemsregister' },
  { id: 'styrelseprotokoll', label: 'Styrelseprotokoll', icon: FileText, feature: 'styrelseprotokoll' },
  { id: 'bolagsstamma', label: 'Bolagsstämma', icon: Vote, feature: 'bolagsstamma' },
  { id: 'arsmote', label: 'Årsmöte', icon: Vote, feature: 'arsmote' },
];

function AgarePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { companyType, company, hasFeature } = useCompany();
  
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
    router.push(`/dashboard/agare?tab=${tab}`, { scroll: false });
  }, [router]);

  // Get current tab label for display
  const currentTabLabel = tabs.find(t => t.id === currentTab)?.label || 'Ägare';

  // If EF, show simple owner info
  if (isEF) {
    return (
      <TooltipProvider>
        <div className="flex flex-col min-h-svh">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Ägarinformation</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <BreadcrumbAIBadge />
          </header>

          <div className="bg-background p-6">
            <div className="max-w-6xl w-full">
              <EnskildFirmaOwnerInfo />
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-svh">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Ägare & Styrning</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <BreadcrumbAIBadge />
        </header>

        {/* Tab Content */}
        <div className="bg-background p-6">
          <div className="max-w-6xl w-full">
            {/* Tabs */}
            <div className="flex items-center gap-1 pb-2 mb-6 border-b-2 border-border/60">
              {tabs.map((tab) => {
                const isActive = currentTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <Tooltip key={tab.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setCurrentTab(tab.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
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
            </div>

            {/* Tab Content */}
            {currentTab === 'aktiebok' && <Aktiebok />}
            {currentTab === 'delagare' && <Delagare />}
            {currentTab === 'medlemsregister' && <Medlemsregister />}
            {currentTab === 'styrelseprotokoll' && <Styrelseprotokoll />}
            {currentTab === 'bolagsstamma' && <Bolagsstamma />}
            {currentTab === 'arsmote' && <Arsmote />}
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

function AgarePageLoading() {
  return (
    <div className="flex items-center justify-center h-svh">
      <div className="animate-pulse text-muted-foreground">Laddar...</div>
    </div>
  );
}

export default function AgarePage() {
  return (
    <Suspense fallback={<AgarePageLoading />}>
      <AgarePageContent />
    </Suspense>
  );
}