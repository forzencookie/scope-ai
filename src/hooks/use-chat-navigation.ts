import { useNavigateToAIChat } from "@/lib/ai/context"
import { usePathname, useRouter } from "next/navigation"

export function useChatNavigation() {
    const navigateToAI = useNavigateToAIChat()
    const pathname = usePathname()
    const router = useRouter()

    return {
        navigateToAI: (options: { prompt: string, returnTo?: string }) => {
            // Change route to /dashboard if we are not already there
            if (pathname !== "/dashboard") {
                router.push("/dashboard")
            }
            
            navigateToAI({
                pageName: "Assistent",
                pageType: "resultatrakning", // fallback
                initialPrompt: options.prompt,
                autoSend: true,
                returnTo: options.returnTo || pathname
            })
        }
    }
}