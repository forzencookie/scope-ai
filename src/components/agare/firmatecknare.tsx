"use client"

import { PageHeader } from "@/components/shared"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCompany } from "@/providers/company-provider"
import { PenTool } from "lucide-react"

export function Firmatecknare() {
    const { company } = useCompany()

    return (
        <div className="space-y-6 max-w-4xl">
            <PageHeader
                title="Firmatecknare"
                subtitle="Registrerade firmatecknare och behörigheter."
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PenTool className="h-5 w-5 text-primary" />
                        Firmatecknare
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Firmatecknare för {company?.name || 'bolaget'} visas här.
                        Fråga Scooby för att uppdatera firmateckningsrätten.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
