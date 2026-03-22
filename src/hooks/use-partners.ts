import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAsyncMutation } from "./use-async"
import { type Partner } from "@/types/ownership"

const partnerQueryKeys = {
    all: ['partners'] as const,
}

export function usePartners() {
    const queryClient = useQueryClient()

    const {
        data: partners,
        isLoading,
        error,
    } = useQuery({
        queryKey: partnerQueryKeys.all,
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
        staleTime: 2 * 60 * 1000, // 2 minute cache
    });

    const refetch = () => queryClient.invalidateQueries({ queryKey: partnerQueryKeys.all })

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
