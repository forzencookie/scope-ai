import { useNavigateToAIChat } from "@/lib/ai/context"
import { usePathname, useRouter } from "next/navigation"

export function useChatNavigation() {
    const navigateToAI = useNavigateToAIChat()
    const pathname = usePathname()
    const router = useRouter()

    return {
        navigateToAI: (options: { prompt: string, returnTo?: string }) => {
            // Change route to /dashboard if we are not already there
            if (!pathname.startsWith("/ny") && !pathname.startsWith("/k/")) {
                router.push("/ny")
            }
            
            navigateToAI({
                pageName: "Assistent",
                initialPrompt: options.prompt,
                autoSend: true,
                returnTo: options.returnTo || pathname
            })
        }
    }
}