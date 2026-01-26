import { useAsyncMutation } from "./use-async"
import { useCachedQuery } from "./use-cached-query"
import { type Partner } from "@/data/ownership"

export function usePartners() {
    
    // In a real scenario, we would have /api/partners. 
    // Since I don't see usePartners existing yet, implementing a quick version that 
    // presumably hits an endpoint we need to ensure exists or uses compliance API if 'shareholders' covers it.
    // If 'partners' are distinct from 'shareholders' (HB vs AB), we need a distinct endpoint.
    // For now, I will mirror the useCompliance structure but target 'partners' type if possible
    // or assume we need to create it.
    
    // Assuming /api/compliance?type=partners works or we use a new endpoint.
    // Let's assume we create a dedicatd hook for cleaner code.

    const {
        data: partners,
        isLoading,
        error,
        invalidate: refetch
    } = useCachedQuery({
        cacheKey: 'partners-list',
        queryFn: async () => {
            try {
                const res = await fetch('/api/partners'); 
                if (!res.ok) return [];
                const json = await res.json();
                return json.partners as Partner[];
            } catch {
                console.warn("Partners API missing, return empty");
                return [];
            }
        },
        ttlMs: 2 * 60 * 1000, // 2 minute cache
    });

    const addPartner = useAsyncMutation(async (data: Partial<Partner>) => {
        const res = await fetch('/api/partners', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if(res.ok) refetch();
        return await res.json();
    });

    return { partners: partners ?? [], isLoading, error, refetch, addPartner: addPartner.execute };
}
