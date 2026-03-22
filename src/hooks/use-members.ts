import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAsyncMutation } from "./use-async"

export interface Member {
  id: string
  memberNumber: string
  name: string
  email: string
  phone: string
  joinDate: string
  status: 'aktiv' | 'vilande' | 'avslutad'
  membershipType: 'ordinarie' | 'stödmedlem' | 'hedersmedlem'
  lastPaidYear?: number
  currentYearFeePaid?: boolean // Derived
  roles: string[]
}

const memberQueryKeys = {
    all: ['members'] as const,
}

export function useMembers() {
    const queryClient = useQueryClient()

    const {
        data: members,
        isLoading,
        error,
    } = useQuery({
        queryKey: memberQueryKeys.all,
        queryFn: async () => {
            try {
                const res = await fetch('/api/members');
                if (!res.ok) return [];
                const json = await res.json();
                const currentYear = new Date().getFullYear();
                return (json.members || []).map((m: Omit<Member, 'currentYearFeePaid'>) => ({
                    ...m,
                    currentYearFeePaid: m.lastPaidYear === currentYear
                })) as Member[];
            } catch(e) {
                console.warn("Members API missing/failed", e);
                return [];
            }
        },
        staleTime: 2 * 60 * 1000, // 2 minute cache
    });

    const refetch = () => queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })

    const addMember = useAsyncMutation(async (data: Partial<Member>) => {
        const res = await fetch('/api/members', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                lastPaidYear: data.currentYearFeePaid ? new Date().getFullYear() : (data.lastPaidYear || null)
            })
        });
        if(res.ok) refetch();
        return await res.json();
    });

    return { members: members ?? [], isLoading, error, refetch, addMember: addMember.execute };
}
