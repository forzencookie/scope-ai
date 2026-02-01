import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import PayslipEmail from '@/emails/payslip-template';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const result = await sendEmail({
            to: email,
            subject: 'Test av lönespecifikation - Scope AI',
            react: PayslipEmail({
                employeeName: 'Test Testson',
                period: 'Mars 2026',
                netSalary: 42000,
                paymentDate: new Date().toLocaleDateString('sv-SE')
            }),
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
