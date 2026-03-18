/**
 * Payslips API
 *
 * GET: List all payslips
 * POST: Create a payslip and auto-generate salary verification (journal entries)
 *
 * Security: Uses getAuthContext() with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/database/auth-server";
import { pendingBookingService } from '@/services/pending-booking-service';
import { taxService } from '@/services/tax-service';
import { createSalaryEntry } from '@/lib/bookkeeping';

export async function GET() {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId, companyId } = ctx;

        const { data: payslips, error } = await supabase
            .from('payslips')
            .select('*, employees(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            payslips: payslips || [],
            userId,
            companyId,
        });
    } catch (error) {
        console.error("Failed to fetch payslips:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getAuthContext();

        if (!ctx) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { supabase, userId } = ctx;
        const body = await req.json();

        const { data: saved, error: insertError } = await supabase
            .from('payslips')
            .insert({ ...body, user_id: body.user_id ?? userId })
            .select()
            .single();

        if (insertError || !saved) {
            return NextResponse.json({ error: "Failed to create" }, { status: 500 });
        }

        // Create pending booking instead of auto-verification
        // User confirms via BookingWizard before entries become a verification
        const grossSalary = Number(body.gross_salary) || 0
        const taxDeduction = Number(body.tax_deduction) || 0
        const netSalary = Number(body.net_salary) || (grossSalary - taxDeduction)
        let pendingBookingId: string | undefined

        if (grossSalary > 0 && !body.skip_verification) {
            const currentYear = new Date().getFullYear()
            const rates = await taxService.getAllTaxRates(currentYear)

            if (!rates && body.employer_contribution_rate == null) {
                return NextResponse.json(
                    { error: "Skattesatser saknas i databasen — kan inte beräkna arbetsgivaravgifter." },
                    { status: 503 }
                );
            }

            const employerContributionRate = body.employer_contribution_rate != null
                ? Number(body.employer_contribution_rate)
                : rates!.employerContributionRate
            const employerContribution = body.employer_contributions != null
                ? Number(body.employer_contributions)
                : Math.round(grossSalary * employerContributionRate)
            const employeeName = body.manual_employee_name || body.employee_name || 'Anställd'
            const period = body.period || new Date().toISOString().slice(0, 7)

            try {
                const paymentDate = body.payment_date || new Date().toISOString().split('T')[0]
                const journalEntry = createSalaryEntry({
                    date: paymentDate,
                    description: `Lön ${employeeName} ${period}`,
                    salary: {
                        grossSalary,
                        preliminaryTax: taxDeduction,
                        employerContributions: employerContribution,
                    },
                    paidImmediately: true,
                    bankAccount: '1930',
                    series: 'L',
                })

                const pending = await pendingBookingService.createPendingBooking({
                    sourceType: 'payslip',
                    sourceId: saved.id,
                    description: journalEntry.description,
                    series: 'L',
                    date: paymentDate,
                    entries: journalEntry.rows.map(row => ({
                        account: row.account,
                        debit: row.debit,
                        credit: row.credit,
                        description: row.description,
                    })),
                    metadata: { employeeName, period, grossSalary, netSalary },
                })
                pendingBookingId = pending.id
            } catch (pbError) {
                console.error('Failed to create pending booking for payslip:', pbError)
            }
        }

        return NextResponse.json({ success: true, payslip: saved, pendingBookingId });
    } catch (error) {
        console.error("Failed to create payslip:", error);
        const message = error instanceof Error ? error.message : 'Failed to create payslip';

        if (message.includes('balanserar inte')) {
            return NextResponse.json({ error: message }, { status: 422 });
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
