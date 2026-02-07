/**
 * Payslips API
 *
 * GET: List all payslips
 * POST: Create a payslip and auto-generate salary verification (journal entries)
 *
 * Security: Uses user-scoped DB access with RLS enforcement
 */

import { NextRequest, NextResponse } from "next/server";
import { createUserScopedDb } from '@/lib/database/user-scoped-db';
import { verificationService } from '@/services/verification-service';

const EMPLOYER_CONTRIBUTION_RATE = 0.3142 // 31.42% arbetsgivaravgift

export async function GET() {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payslips = await userDb.payslips.list();

        return NextResponse.json({
            payslips,
            userId: userDb.userId,
            companyId: userDb.companyId,
        });
    } catch (error) {
        console.error("Failed to fetch payslips:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userDb = await createUserScopedDb();

        if (!userDb) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const saved = await userDb.payslips.create(body);

        if (!saved) {
            return NextResponse.json({ error: "Failed to create" }, { status: 500 });
        }

        // Auto-create salary verification if we have the necessary salary data
        const grossSalary = Number(body.gross_salary) || 0
        const taxDeduction = Number(body.tax_deduction) || 0
        const netSalary = Number(body.net_salary) || (grossSalary - taxDeduction)

        if (grossSalary > 0) {
            const employerContribution = Math.round(grossSalary * EMPLOYER_CONTRIBUTION_RATE)
            const employeeName = body.manual_employee_name || body.employee_name || 'Anställd'
            const period = body.period || new Date().toISOString().slice(0, 7)

            try {
                await verificationService.createVerification({
                    series: 'L',
                    date: body.payment_date || new Date().toISOString().split('T')[0],
                    description: `Lön ${employeeName} ${period}`,
                    entries: [
                        { account: '7010', debit: grossSalary, credit: 0, description: `Lön ${employeeName}` },
                        { account: '7510', debit: employerContribution, credit: 0, description: `Arbetsgivaravgift ${employeeName}` },
                        { account: '2710', debit: 0, credit: taxDeduction, description: `Personalskatt ${employeeName}` },
                        { account: '2730', debit: 0, credit: employerContribution, description: `Arbetsgivaravgift skuld ${employeeName}` },
                        { account: '1930', debit: 0, credit: netSalary, description: `Utbetalning lön ${employeeName}` },
                    ],
                    sourceType: 'payroll',
                    sourceId: saved.id,
                })
            } catch (verError) {
                // Log but don't fail the payslip creation
                console.error('Failed to create salary verification:', verError)
            }
        }

        return NextResponse.json({ success: true, payslip: saved });
    } catch (error) {
        console.error("Failed to create payslip:", error);
        return NextResponse.json({ error: "Failed to create" }, { status: 500 });
    }
}
