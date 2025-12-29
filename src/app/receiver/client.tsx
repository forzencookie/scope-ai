"use client"

import { Inbox } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

/**
 * Myndigheter Receiver Client
 * 
 * This was a development simulator for viewing submissions to Skatteverket/Bolagsverket.
 * The localStorage-based submission storage has been removed as it was only for testing.
 * 
 * In production, submissions will be tracked via Supabase in the tax_reports table.
 */
export function MyndigheterClient() {
    return (
        <div className="container max-w-5xl py-8 px-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">🏛️ Myndigheter Simulator</h1>
                <p className="text-gray-600">
                    Detta är en utvecklingsverktyg för att simulera svar från Skatteverket och Bolagsverket.
                </p>
            </div>

            <Card>
                <CardContent className="py-12 text-center text-gray-500">
                    <Inbox className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Simulatorn är avstängd</p>
                    <p className="text-sm mt-2">
                        Denna funktion användes endast för utvecklingstestning.
                    </p>
                    <p className="text-sm mt-1">
                        I produktion spåras skatteärenden direkt i databasen.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
