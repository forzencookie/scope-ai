"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Building2,
    Download,
    Printer,
    ExternalLink,
    FileText,
    Calendar,
    Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/toast"
import { categoryColors, categoryLabels } from "@/data/inbox"
import { InboxItem } from "@/types"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function MessagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const toast = useToast()
    const [item, setItem] = useState<InboxItem | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchItem = async () => {
            try {
                // Fetch all items from the API to find the specific one
                // Ideally this should be a dedicated endpoint /api/receive/[id]
                const response = await fetch('/api/receive')
                const data = await response.json()
                if (data.items) {
                    const foundItem = data.items.find((i: InboxItem) => i.id === id)
                    setItem(foundItem || null)
                }
            } catch (error) {
                console.error("Failed to fetch inbox item:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchItem()
    }, [id])

    if (loading) {
        return <div className="p-6">Laddar...</div>
    }

    const handleDownload = () => {
        toast.info("Nedladdning påbörjad", `${item?.title || 'Dokument'} laddas ner som PDF`)
    }

    const handlePrint = () => {
        toast.info("Skriver ut", `${item?.title || 'Dokument'} skickas till skrivaren`)
    }

    const handleOpenInKivra = () => {
        toast.info("Öppnar i Kivra", `${item?.title || 'Dokument'} öppnas i Kivra-appen`)
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-muted-foreground">Meddelandet hittades inte</p>
                <Button variant="outline" onClick={() => router.push("/dashboard/inkorg")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Tillbaka till inkorgen
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-4xl">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                className="w-fit -ml-2"
                onClick={() => router.push("/dashboard/inkorg")}
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till inkorgen
            </Button>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">{item.title}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">{item.sender}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className={`text-xs ${categoryColors[item.category]}`}>
                                {categoryLabels[item.category]}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Skriv ut
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleOpenInKivra}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Öppna i Kivra
                    </Button>
                </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground border-b-2 border-border/60 pb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>{categoryLabels[item.category]}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF-dokument</span>
                </div>
            </div>

            {/* Document preview */}
            <Card className="overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 border-b-2 border-border/60 flex items-center justify-between">
                    <span className="text-sm font-medium">Dokumentförhandsvisning</span>
                    <Button variant="ghost" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner PDF
                    </Button>
                </div>

                <div className="aspect-[3/4] max-h-[600px] bg-white dark:bg-neutral-900 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-sm">{item.title}</p>
                        <p className="text-xs mt-1">Från {item.sender}</p>
                        <p className="text-xs mt-4 max-w-md mx-auto px-8">{item.description}</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}
