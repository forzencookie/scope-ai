import { getSupabaseClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface Company {
    id: string;
    name: string;
    org_number?: string;
    role: 'owner' | 'admin' | 'member';
}

export const authService = {
    // Get current authenticated user
    getCurrentUser: async (): Promise<User | null> => {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // Get the company the user belongs to
    getUserCompany: async (): Promise<Company | null> => {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        // Fetch membership
        const { data: membership, error } = await supabase
            .from('company_members')
            .select(`
                role,
                company:companies (
                    id,
                    name,
                    org_number
                )
            `)
            .eq('user_id', user.id)
            .single();

        if (error || !membership || !membership.company) {
            return null;
        }

        // Flatten shape
        // @ts-ignore - Supabase type inference might fail on deep joins without generated types
        const companyData = Array.isArray(membership.company) ? membership.company[0] : membership.company;

        return {
            id: companyData.id,
            name: companyData.name,
            org_number: companyData.org_number || undefined,
            role: membership.role as 'owner' | 'admin' | 'member'
        };
    },

    // Create a new company and assign user as owner
    createCompany: async (name: string, orgNumber?: string): Promise<Company | null> => {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        // 1. Create Company
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
                name,
                org_number: orgNumber,
                settings: {}
            })
            .select()
            .single();

        if (companyError || !company) throw companyError;

        // 2. Create Membership
        const { error: memberError } = await supabase
            .from('company_members')
            .insert({
                company_id: company.id,
                user_id: user.id,
                role: 'owner'
            });

        if (memberError) {
            // Rollback (manual because no transactions in client lib without RPC)
            // In a real app we'd use an RPC function 'create_company'
            await supabase.from('companies').delete().eq('id', company.id);
            throw memberError;
        }

        return {
            id: company.id,
            name: company.name,
            org_number: company.org_number || undefined,
            role: 'owner'
        };
    }
};
