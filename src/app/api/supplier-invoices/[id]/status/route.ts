/**
 * Supplier Invoice Status Update API
 *
 * Security: Uses withAuthParams wrapper with RLS enforcement
 */

import { NextRequest } from "next/server";
import { withAuthParams, ApiResponse } from "@/lib/database/auth-server";

export const POST = withAuthParams(async (req: NextRequest, { supabase }, { id }) => {
    const body = await req.json();
    const status = body.status;

    // Update via RLS-protected client
    const { data: updated, error } = await supabase
        .from('supplier_invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) console.error('[SupplierInvoices] status update error:', error);

    if (updated) {
        return ApiResponse.success({ status });
    }

    return ApiResponse.notFound('Invoice not found');
})

export { POST as PUT };
