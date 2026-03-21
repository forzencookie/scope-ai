"use client"

import { useRef, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useChatContext } from "@/providers/chat-provider"
import { useAIDialog } from "@/providers/ai-overlay-provider"
import { ChatInput } from "@/components/ai/chat-input"
import { ChatMessageList } from "@/components/ai/chat-message-list"
import { BuyCreditsDialog } from "@/components/billing"
import { getGreeting } from "@/lib/chat-utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Users, PieChart, Building2, CalendarDays, PawPrint } from "lucide-react"
import { cn } from "@/lib/utils"
import { AIOverlay } from "@/components/ai"
import { SuggestionChips } from "@/components/ai/suggestion-chips"

const pageButtons = [
    { label: "Händelser", icon: CalendarDays, href: "/dashboard/handelser", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25" },
    { label: "Bokföring", icon: BookOpen, href: "/dashboard/bokforing", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25" },
    { label: "Löner", icon: Users, href: "/dashboard/loner", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-500/25" },
    { label: "Rapporter", icon: PieChart, href: "/dashboard/rapporter", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25" },
    { label: "Ägare", icon: Building2, href: "/dashboard/agare", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25" },
]

export function MainContentArea({ children }: { children?: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { isAIOverlayOpen } = useAIDialog()
    const {
        messages,
        isLoading,
        sendMessage,
        regenerateResponse,
        textareaValue,
        setTextareaValue,
        attachedFiles,
        setAttachedFiles,
        mentionItems,
        setMentionItems,
        actionTrigger,
        setActionTrigger,
        isInputFocused,
        setIsInputFocused,
        showBuyCredits,
        setShowBuyCredits,
        handleSend,
        handleCancelConfirmation,
        isIncognito,
        toggleIncognito,
    } = useChatContext()

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const isDashboardRoot = pathname === "/dashboard"

    // Scroll to bottom when messages change
    useEffect(() => {
        if (isDashboardRoot) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isDashboardRoot])

    // Incognito ghost toggle button (shared across states)
    const ghostButton = (
        <button
            onClick={toggleIncognito}
            className={cn(
                "absolute top-3 right-3 p-2 rounded-lg transition-colors z-10",
                isIncognito
                    ? "bg-violet-500/15 text-violet-500 hover:bg-violet-500/25"
                    : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent"
            )}
            title={isIncognito ? "Stäng av inkognito" : "Aktivera inkognito"}
        >
            <PawPrint className={cn("h-5 w-5", isIncognito && "fill-violet-500/30")} />
        </button>
    )

    const renderContent = () => {
        // State 3: Page view
        if (!isDashboardRoot) {
            return (
                <div className={cn("flex-1 flex flex-col min-h-0 relative", isAIOverlayOpen && "hidden lg:flex border-r border-border")}>
                    {/* Header bar: Back button + page tabs portal */}
                    <div className="shrink-0 px-4 pt-3 pb-1 flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
                            onClick={() => router.push("/dashboard")}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Tillbaka
                        </Button>
                        <div className="ml-auto" id="page-tabs-portal" />
                    </div>
                    {/* Page content */}
                    <div className="flex-1 overflow-x-hidden overflow-y-auto">
                        {children}
                    </div>
                </div>
            )
        }

        // State 1: Empty chat — greeting + inline chat input
        if (messages.length === 0) {
            return (
                <div className={cn("flex-1 flex flex-col min-h-0 relative overflow-hidden", isAIOverlayOpen && "hidden lg:flex border-r border-border")}>
                    {ghostButton}
                    <div className="flex-1 flex flex-col items-center justify-center px-4">
                        {/* Pixel Dog Mascot */}
                        <div
                            className="mb-5 cursor-pointer"
                            onClick={(e) => {
                                const dog = e.currentTarget.querySelector('svg')
                                if (dog) {
                                    dog.classList.add('animate-bounce')
                                    setTimeout(() => dog.classList.remove('animate-bounce'), 500)
                                }
                            }}
                        >
                            <svg width="64" height="64" viewBox="0 0 16 16" shapeRendering="crispEdges">
                                {/* Detective cap — only in incognito */}
                                {isIncognito && (
                                    <>
                                        <rect x="3" y="1" width="10" height="1" className="fill-slate-600 dark:fill-slate-400" />
                                        <rect x="4" y="0" width="8" height="1" className="fill-slate-600 dark:fill-slate-400" />
                                        <rect x="2" y="2" width="12" height="1" className="fill-slate-700 dark:fill-slate-500" />
                                    </>
                                )}
                                <rect x="2" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="12" y="2" width="2" height="3" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="3" y="4" width="10" height="6" className="fill-amber-400 dark:fill-amber-300" />
                                <rect x="5" y="5" width="6" height="4" className="fill-amber-100 dark:fill-amber-50" />
                                {!isInputFocused && (
                                    <>
                                        <rect x="5" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="9" y="6" width="2" height="2" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="5" y="6" width="1" height="1" className="fill-white" />
                                        <rect x="9" y="6" width="1" height="1" className="fill-white" />
                                    </>
                                )}
                                {isInputFocused && (
                                    <>
                                        <rect x="5" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="6" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="7" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="9" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="10" y="6" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                        <rect x="11" y="7" width="1" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                    </>
                                )}
                                <rect x="7" y="8" width="2" height="1" className="fill-gray-800 dark:fill-gray-900" />
                                <rect x="7" y="9" width="2" height="1" className="fill-pink-400" />
                                <rect x="4" y="10" width="8" height="4" className="fill-amber-400 dark:fill-amber-300" />
                                <rect x="6" y="10" width="4" height="3" className="fill-amber-100 dark:fill-amber-50" />
                                <rect x="12" y="11" width="2" height="2" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="4" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                                <rect x="10" y="14" width="2" height="1" className="fill-amber-600 dark:fill-amber-500" />
                            </svg>
                        </div>

                        {/* Greeting text — large and adaptive */}
                        <h1 className={cn(
                            "text-2xl sm:text-3xl lg:text-4xl font-semibold text-center mb-6 lg:mb-8",
                            isIncognito ? "text-muted-foreground" : "text-foreground"
                        )}>
                            {isIncognito ? "Du är inkognito" : `${getGreeting()}, hur kan jag hjälpa dig?`}
                        </h1>

                        {/* Chat input — inline, right under the text */}
                        <div className="w-full max-w-2xl">
                            <ChatInput
                                value={textareaValue}
                                onChange={setTextareaValue}
                                onSend={handleSend}
                                isLoading={isLoading}
                                files={attachedFiles}
                                onFilesChange={setAttachedFiles}
                                mentions={mentionItems}
                                onMentionsChange={setMentionItems}
                                actionTrigger={actionTrigger}
                                onActionTriggerChange={setActionTrigger}
                                showNavLinks={false}
                                landing
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                            />
                        </div>

                        {/* Static page navigation — smaller, secondary */}
                        {!isIncognito && (
                            <div className="mt-5 lg:mt-6 px-2">
                                <div className="flex flex-wrap justify-center gap-2">
                                    {pageButtons.map((btn) => (
                                        <button
                                            key={btn.href}
                                            onClick={() => router.push(btn.href)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                                                btn.color
                                            )}
                                        >
                                            <btn.icon className="h-3.5 w-3.5" />
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Disclaimer */}
                    <div className="shrink-0 pb-3 pt-1 text-center">
                        <p className="text-[11px] text-muted-foreground/50">
                            {isIncognito
                                ? "Inkognitosamtal sparas inte i historiken."
                                : "Scooby kan göra misstag. Kontrollera viktig information."}
                        </p>
                    </div>
                </div>
            )
        }

        // State 2: Active chat
        return (
            <div className={cn("flex-1 flex flex-col min-h-0 relative overflow-hidden", isAIOverlayOpen && "hidden lg:flex border-r border-border")}>
                {ghostButton}
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto px-4">
                    <div className="max-w-3xl mx-auto w-full space-y-4 py-4">
                        <ChatMessageList
                            messages={messages}
                            isLoading={isLoading}
                            onRetry={(id) => sendMessage({ retryMessageId: id, content: '' })}
                            onConfirm={(id) => sendMessage({ confirmationId: id, content: '' })}
                            onCancelConfirmation={handleCancelConfirmation}
                            onRegenerate={regenerateResponse}
                        />
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Chat Input — pinned at bottom */}
                <div className="shrink-0 px-4 pb-4 pt-2 max-w-3xl mx-auto w-full">
                    <ChatInput
                        value={textareaValue}
                        onChange={setTextareaValue}
                        onSend={handleSend}
                        isLoading={isLoading}
                        files={attachedFiles}
                        onFilesChange={setAttachedFiles}
                        mentions={mentionItems}
                        onMentionsChange={setMentionItems}
                        actionTrigger={actionTrigger}
                        onActionTriggerChange={setActionTrigger}
                        showNavLinks={false}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />
                    {/* Disclaimer */}
                    <div className="shrink-0 pb-3 pt-1 text-center">
                        <p className="text-[11px] text-muted-foreground/50">
                            {isIncognito
                                ? "Inkognitosamtal sparas inte i historiken."
                                : "Scooby kan göra misstag. Kontrollera viktig information."}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn(
            "flex-1 flex flex-row min-h-0 m-2 ml-0 rounded-2xl overflow-hidden bg-background",
            isIncognito && "bg-violet-500/[0.03] dark:bg-violet-500/[0.02]"
        )}>
            <div className="flex-1 flex flex-col min-h-0 relative">
                {renderContent()}

                {/* Render children (like SettingsOverlay) when on the dashboard root,
                    since they are not rendered within renderContent() in that state. */}
                {isDashboardRoot && children}

                {isAIOverlayOpen && (
                    <AIOverlay />
                )}
            </div>

            <BuyCreditsDialog
                open={showBuyCredits}
                onOpenChange={setShowBuyCredits}
                outOfTokens
            />
        </div>
    )
}
