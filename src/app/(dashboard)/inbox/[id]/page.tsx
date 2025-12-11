"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { 
    ArrowLeft, 
    Building2, 
    Download, 
    Star, 
    StarOff,
    Printer,
    ExternalLink,
    Sparkles,
    FileText,
    Calendar,
    Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockInboxItems, categoryColors, categoryLabels } from "@/data/inbox"

export default function MessagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    
    const item = mockInboxItems.find(i => i.id === id)
    
    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-muted-foreground">Meddelandet hittades inte</p>
                <Button variant="outline" onClick={() => router.push("/inbox")}>
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
                onClick={() => router.push("/inbox")}
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
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Ladda ner
                    </Button>
                    <Button variant="outline" size="sm">
                        <Printer className="h-4 w-4 mr-2" />
                        Skriv ut
                    </Button>
                    <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Öppna i Kivra
                    </Button>
                </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground border-b border-border/50 pb-4">
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

            {/* AI Suggestion */}
            {item.aiSuggestion && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                    <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">AI-förslag</p>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">{item.aiSuggestion}</p>
                        <Button size="sm" className="mt-3 bg-purple-600 hover:bg-purple-700 text-white">
                            Utför åtgärd
                        </Button>
                    </div>
                </div>
            )}

            {/* Document preview placeholder */}
            <div className="border border-border/50 rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-4 py-2 border-b border-border/50 flex items-center justify-between">
                    <span className="text-sm font-medium">Dokumentförhandsvisning</span>
                    <Button variant="ghost" size="sm">
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
            </div>
        </div>
    )
}
