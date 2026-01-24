import jsPDF from 'jspdf';
import { formatCurrency, formatDateLong } from '@/lib/utils';

// Define a type for Payslip if not already available globally
export interface PayslipData {
    id: string | number;
    employee: string;
    period: string;
    grossSalary: number;
    tax: number;
    netSalary: number;
    paymentDate?: string;
}

export interface MeetingData {
    id: string;
    year: number;
    date: string;
    location: string;
    type: string;
    agenda?: string[];
}

export const generatePayslipPDF = (payslip: PayslipData) => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = '#183E4F';

    // Header
    doc.setTextColor(primaryColor);
    doc.setFontSize(22);
    doc.text('Lönespecifikation', 20, 25);

    // Company Info (Right aligned)
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text('Mitt Företag AB', 190, 25, { align: 'right' });
    doc.text('Org.nr: 559123-4567', 190, 30, { align: 'right' });
    doc.text('Storgatan 1, 111 22 Stockholm', 190, 35, { align: 'right' });

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 45, 190, 45);

    // Employee Info Box
    doc.setFillColor(245, 247, 250);
    doc.rect(20, 55, 170, 35, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text('MOTTAGARE', 25, 65);
    doc.setFontSize(12);
    doc.text(payslip.employee, 25, 75);

    doc.setFontSize(10);
    doc.text('UTBETALNING', 120, 65);
    doc.setFontSize(12);
    doc.text(payslip.period, 120, 75);
    doc.setFontSize(10);
    doc.text(`Utbet. dag: ${payslip.paymentDate || new Date().toISOString().split('T')[0]}`, 120, 82);

    // Table Header
    let y = 110;
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('BESKRIVNING', 20, y);
    doc.text('BELOPP', 180, y, { align: 'right' });

    y += 5;
    doc.line(20, y, 190, y);
    y += 15;

    // Items
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    // Gross
    doc.text('Månadslön', 20, y);
    doc.text(formatCurrency(payslip.grossSalary), 180, y, { align: 'right' });
    y += 10;

    // Tax
    doc.text('Preliminärskatt', 20, y);
    doc.text(`-${formatCurrency(payslip.tax)}`, 180, y, { align: 'right' });
    y += 10;

    // Net Result Box
    y += 10;
    doc.setFillColor(24, 62, 79); // Primary color background
    doc.rect(20, y, 170, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('ATT UTBETALA', 25, y + 10);
    doc.setFontSize(14);
    doc.text(formatCurrency(payslip.netSalary), 180, y + 10, { align: 'right' });

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('Detta dokument är genererat av Scope AI Accounting', 105, 280, { align: 'center' });

    doc.save(`Lonespecifikation-${payslip.employee.replace(' ', '_')}-${payslip.period.replace(' ', '_')}.pdf`);
}

export const generateAnnualMeetingNoticePDF = (meeting: MeetingData) => {
    const doc = new jsPDF();
    const primaryColor = '#183E4F';

    // Header
    doc.setTextColor(primaryColor);
    doc.setFontSize(24);
    doc.text('KALLELSE TILL ÅRSMÖTE', 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.text('Min Förening', 105, 40, { align: 'center' });

    // Decorative Line
    doc.setDrawColor(200, 200, 200);
    doc.line(40, 50, 170, 50);

    // Welcome Text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const welcomeText = `Medlemmarna i Min Förening kallas härmed till ${meeting.type} årsmöte.`;
    doc.text(welcomeText, 105, 70, { align: 'center' });

    // Meeting Details
    doc.setFillColor(245, 247, 250);
    doc.rect(40, 85, 130, 45, 'F');

    doc.setFontSize(11);
    doc.text(`Datum: ${formatDateLong(meeting.date)}`, 50, 100);
    doc.text(`Plats: ${meeting.location}`, 50, 110);
    doc.text(`År: ${meeting.year}`, 50, 120);

    // Agenda Title
    doc.setFontSize(14);
    doc.setTextColor(primaryColor);
    doc.text('Dagordning', 40, 150);

    // Agenda Items
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    let y = 165;
    const agenda = meeting.agenda || [
        '1. Mötets öppnande',
        '2. Val av ordförande och sekreterare för mötet',
        '3. Val av protokolljusterare och rösträknare',
        '4. Fastställande av röstlängd',
        '5. Godkännande av dagordning',
        '6. Prövning om mötet blivit behörigen sammankallat',
        '7. Framläggande av styrelsens verksamhetsberättelse och årsredovisning',
        '8. Framläggande av revisorernas berättelse',
        '9. Beslut om ansvarsfrihet för styrelsen',
        '10. Val av styrelse',
        '11. Mötets avslutande'
    ];

    agenda.forEach(item => {
        doc.text(item, 40, y);
        y += 8;
        // Simple page break check
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    // Signature
    doc.setFontSize(12);
    const signY = Math.max(y + 20, 240);
    doc.text('Välkomna!', 105, signY, { align: 'center' });
    doc.text('Styrelsen', 105, signY + 10, { align: 'center' });

    doc.save(`Kallelse_Arsmote_${meeting.year}.pdf`);
}
