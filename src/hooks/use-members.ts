import { useAsync, useAsyncMutation } from "./use-async"

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

export function useMembers() {
    const {
        data: members,
        isLoading,
        error,
        refetch
    } = useAsync(async () => {
         try {
            const res = await fetch('/api/members'); 
            if (!res.ok) return [];
            const json = await res.json();
            const currentYear = new Date().getFullYear();
            return (json.members || []).map((m: any) => ({
                ...m,
                currentYearFeePaid: m.lastPaidYear === currentYear
            })) as Member[];
         } catch(e) {
             console.warn("Members API missing/failed", e);
             return [];
         }
    }, [] as Member[], []);

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

    return { members, isLoading, error, refetch, addMember: addMember.execute };
}
