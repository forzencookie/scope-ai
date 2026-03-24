/**
 * Payslips API
 *
 * GET: List all payslips
 * POST: Create a payslip and auto-generate salary verification (journal entries)
 *
 * Security: Uses withAuth wrapper with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { withAuth, ApiResponse } from "@/lib/database/auth-server";
import { verificationService } from '@/services/accounting/verification-service';
import { taxService } from '@/services/tax/tax-service';
import { createSalaryEntry } from '@/lib/bookkeeping';

export const GET = withAuth(async (_request, { supabase, userId, companyId }) => {
    try {
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
        return ApiResponse.serverError("Failed to fetch");
    }
})

export const POST = withAuth(async (req, { supabase, userId }) => {
    try {
        const body = await req.json();

        const { data: saved, error: insertError } = await supabase
            .from('payslips')
            .insert({ ...body, user_id: body.user_id ?? userId })
            .select()
            .single();

        if (insertError || !saved) {
            return ApiResponse.serverError("Failed to create");
        }

        // Create verification directly (user confirms via Scooby chat before calling this route)
        const grossSalary = Number(body.gross_salary) || 0
        const taxDeduction = Number(body.tax_deduction) || 0
        let verificationId: string | undefined
        let verificationNumber: string | undefined

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

                const verification = await verificationService.createVerification({
                    series: 'L',
                    date: paymentDate,
                    description: journalEntry.description,
                    entries: journalEntry.rows.map(row => ({
                        account: row.account,
                        debit: row.debit,
                        credit: row.credit,
                        description: row.description,
                    })),
                    sourceType: 'payslip',
                    sourceId: saved.id,
                }, supabase)

                verificationId = verification.id
                verificationNumber = `${verification.series}${verification.number}`
            } catch (vError) {
                console.error('Failed to create verification for payslip:', vError)
            }
        }

        return NextResponse.json({ payslip: saved, verificationId, verificationNumber });
    } catch (error) {
        console.error("Failed to create payslip:", error);
        const message = error instanceof Error ? error.message : 'Failed to create payslip';

        if (message.includes('balanserar inte')) {
            return NextResponse.json({ error: message }, { status: 422 });
        }

        return ApiResponse.serverError(message);
    }
})
