import jsPDF from 'jspdf';
import { formatCurrency, formatDateLong } from '@/lib/utils';

// ============================================================================
// Shared Types & Constants
// ============================================================================

export interface PDFCompanyInfo {
    name: string
    orgNumber: string
    address?: string
    city?: string
    zipCode?: string
}

export const PDF_STYLES = {
    primaryColor: '#183E4F',
    primaryRGB: [24, 62, 79] as const,
    grayText: [100, 100, 100] as const,
    lightGrayText: [150, 150, 150] as const,
    bgFill: [245, 247, 250] as const,
    dividerColor: [200, 200, 200] as const,
    margins: { left: 20, right: 190, top: 20, bottom: 280 },
    footer: 'Detta dokument är genererat av Scope AI Accounting',
} as const

function addCompanyHeader(doc: jsPDF, company?: PDFCompanyInfo) {
    const name = company?.name || 'Mitt Företag AB'
    const orgNumber = company?.orgNumber || ''
    const address = company?.address
        ? `${company.address}${company.zipCode ? `, ${company.zipCode}` : ''}${company.city ? ` ${company.city}` : ''}`
        : ''

    doc.setTextColor(...PDF_STYLES.grayText)
    doc.setFontSize(10)
    doc.text(name, PDF_STYLES.margins.right, 25, { align: 'right' })
    if (orgNumber) doc.text(`Org.nr: ${orgNumber}`, PDF_STYLES.margins.right, 30, { align: 'right' })
    if (address) doc.text(address, PDF_STYLES.margins.right, 35, { align: 'right' })
}

function addFooter(doc: jsPDF) {
    doc.setTextColor(...PDF_STYLES.lightGrayText)
    doc.setFontSize(8)
    doc.text(PDF_STYLES.footer, 105, PDF_STYLES.margins.bottom, { align: 'center' })
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 20): number {
    if (y + needed > 270) {
        doc.addPage()
        return 20
    }
    return y
}

// ============================================================================
// Payslip PDF
// ============================================================================

export interface PayslipData {
    id: string | number;
    employee: string;
    period: string;
    grossSalary: number;
    tax: number;
    netSalary: number;
    paymentDate?: string;
}

export const generatePayslipPDF = (payslip: PayslipData, company?: PDFCompanyInfo) => {
    const doc = new jsPDF();

    // Header
    doc.setTextColor(PDF_STYLES.primaryColor);
    doc.setFontSize(22);
    doc.text('Lönespecifikation', 20, 25);

    addCompanyHeader(doc, company)

    // Divider
    doc.setDrawColor(...PDF_STYLES.dividerColor);
    doc.line(20, 45, 190, 45);

    // Employee Info Box
    doc.setFillColor(...PDF_STYLES.bgFill);
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
    doc.setTextColor(...PDF_STYLES.grayText);
    doc.text('BESKRIVNING', 20, y);
    doc.text('BELOPP', 180, y, { align: 'right' });

    y += 5;
    doc.line(20, y, 190, y);
    y += 15;

    // Items
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    doc.text('Månadslön', 20, y);
    doc.text(formatCurrency(payslip.grossSalary), 180, y, { align: 'right' });
    y += 10;

    doc.text('Preliminärskatt', 20, y);
    doc.text(`-${formatCurrency(payslip.tax)}`, 180, y, { align: 'right' });
    y += 10;

    // Net Result Box
    y += 10;
    doc.setFillColor(...PDF_STYLES.primaryRGB);
    doc.rect(20, y, 170, 15, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('ATT UTBETALA', 25, y + 10);
    doc.setFontSize(14);
    doc.text(formatCurrency(payslip.netSalary), 180, y + 10, { align: 'right' });

    addFooter(doc)

    doc.save(`Lonespecifikation-${payslip.employee.replace(' ', '_')}-${payslip.period.replace(' ', '_')}.pdf`);
}

// ============================================================================
// Meeting Notice (Kallelse) PDF
// ============================================================================

export interface MeetingData {
    id: string;
    year: number;
    date: string;
    location: string;
    type: string;
    agenda?: string[];
    time?: string;
    kallelseText?: string;
    chairperson?: string;
    secretary?: string;
}

export const generateAnnualMeetingNoticePDF = (meeting: MeetingData, company?: PDFCompanyInfo) => {
    const doc = new jsPDF();
    const companyName = company?.name || 'Mitt Företag AB'
    const orgNumber = company?.orgNumber || ''

    const isOrdinarie = meeting.type === 'ordinarie'
    const title = `KALLELSE TILL ${isOrdinarie ? 'ORDINARIE' : 'EXTRA'} BOLAGSSTÄMMA`

    // Header
    doc.setTextColor(PDF_STYLES.primaryColor);
    doc.setFontSize(20);
    doc.text(title, 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.text(companyName, 105, 40, { align: 'center' });
    if (orgNumber) {
        doc.setFontSize(10);
        doc.setTextColor(...PDF_STYLES.grayText);
        doc.text(`Org.nr: ${orgNumber}`, 105, 47, { align: 'center' });
    }

    // Decorative Line
    doc.setDrawColor(...PDF_STYLES.dividerColor);
    doc.line(40, 53, 170, 53);

    // If custom kallelse text, render it as preformatted text
    if (meeting.kallelseText) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(meeting.kallelseText, 140)
        let y = 65
        for (const line of lines) {
            y = checkPageBreak(doc, y)
            doc.text(line, 30, y)
            y += 5
        }
        addFooter(doc)
        doc.save(`Kallelse_Bolagsstamma_${meeting.year}.pdf`)
        return
    }

    // Welcome Text
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    const welcomeText = `Aktieägarna i ${companyName}${orgNumber ? `, org.nr ${orgNumber},` : ''} kallas härmed till ${isOrdinarie ? 'ordinarie' : 'extra'} bolagsstämma.`;
    const wrappedWelcome = doc.splitTextToSize(welcomeText, 130)
    doc.text(wrappedWelcome, 105, 65, { align: 'center' });

    // Meeting Details
    const detailsY = 65 + wrappedWelcome.length * 6 + 10
    doc.setFillColor(...PDF_STYLES.bgFill);
    doc.rect(40, detailsY, 130, 35, 'F');

    doc.setFontSize(11);
    doc.text(`Datum: ${formatDateLong(meeting.date)}`, 50, detailsY + 12);
    if (meeting.time) doc.text(`Tid: ${meeting.time}`, 50, detailsY + 20);
    doc.text(`Plats: ${meeting.location || 'Ej angiven'}`, 50, detailsY + (meeting.time ? 28 : 20));

    // Agenda
    let y = detailsY + 50;
    doc.setFontSize(14);
    doc.setTextColor(PDF_STYLES.primaryColor);
    doc.text('Dagordning', 40, y);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 12;
    const agenda = meeting.agenda || [
        'Mötets öppnande',
        'Val av ordförande och sekreterare för mötet',
        'Val av protokolljusterare och rösträknare',
        'Fastställande av röstlängd',
        'Godkännande av dagordning',
        'Prövning om mötet blivit behörigen sammankallat',
        'Framläggande av styrelsens verksamhetsberättelse och årsredovisning',
        'Framläggande av revisorernas berättelse',
        'Beslut om ansvarsfrihet för styrelsen',
        'Val av styrelse',
        'Mötets avslutande'
    ];

    agenda.forEach((item, i) => {
        y = checkPageBreak(doc, y, 10)
        doc.text(`§ ${i + 1}  ${item}`, 40, y);
        y += 8;
    });

    // Signature
    y = checkPageBreak(doc, y, 30)
    doc.setFontSize(12);
    const signY = Math.max(y + 20, 240);
    doc.text('Välkomna!', 105, signY, { align: 'center' });
    doc.text('Styrelsen', 105, signY + 10, { align: 'center' });

    addFooter(doc)

    doc.save(`Kallelse_Bolagsstamma_${meeting.year}.pdf`);
}

// ============================================================================
// Share Register (Aktiebok) PDF
// ============================================================================

export interface ShareRegisterShareholder {
    name: string
    personalNumber?: string
    shareClass: string
    shares: number
    ownershipPercentage: number
    votesPercentage: number
    shareNumberFrom?: number
    shareNumberTo?: number
    acquisitionDate?: string
}

export interface ShareRegisterPDFData {
    shareholders: ShareRegisterShareholder[]
    stats: {
        totalShares: number
        totalVotes: number
        shareholderCount: number
    }
}

export const generateShareRegisterPDF = (data: ShareRegisterPDFData, company?: PDFCompanyInfo) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const companyName = company?.name || 'Mitt Företag AB'
    const orgNumber = company?.orgNumber || ''

    // Title
    doc.setTextColor(PDF_STYLES.primaryColor);
    doc.setFontSize(22);
    doc.text('AKTIEBOK', 20, 22);

    // Company info
    doc.setTextColor(...PDF_STYLES.grayText);
    doc.setFontSize(10);
    doc.text(companyName, 277, 15, { align: 'right' });
    if (orgNumber) doc.text(`Org.nr: ${orgNumber}`, 277, 20, { align: 'right' });
    const address = company?.address
        ? `${company.address}${company.zipCode ? `, ${company.zipCode}` : ''}${company.city ? ` ${company.city}` : ''}`
        : ''
    if (address) doc.text(address, 277, 25, { align: 'right' });

    // Summary row
    doc.setFillColor(...PDF_STYLES.bgFill);
    doc.rect(20, 30, 257, 12, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(`Totalt antal aktier: ${data.stats.totalShares.toLocaleString('sv-SE')}`, 25, 38);
    doc.text(`Totalt antal röster: ${data.stats.totalVotes.toLocaleString('sv-SE')}`, 110, 38);
    doc.text(`Antal aktieägare: ${data.stats.shareholderCount}`, 195, 38);

    // Table headers
    let y = 52;
    const cols = [
        { label: 'Aktienr', x: 22, w: 30 },
        { label: 'Namn', x: 55, w: 60 },
        { label: 'Person/Org.nr', x: 118, w: 40 },
        { label: 'Aktieslag', x: 160, w: 20 },
        { label: 'Antal', x: 182, w: 20 },
        { label: 'Andel %', x: 205, w: 20 },
        { label: 'Röster %', x: 228, w: 20 },
        { label: 'Förvärvsdatum', x: 250, w: 30 },
    ]

    doc.setFillColor(...PDF_STYLES.primaryRGB);
    doc.rect(20, y - 5, 257, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    cols.forEach(col => doc.text(col.label, col.x, y));

    y += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);

    // Table rows
    data.shareholders.forEach((sh) => {
        if (y > 185) {
            doc.addPage();
            y = 20;
            // Re-draw header
            doc.setFillColor(...PDF_STYLES.primaryRGB);
            doc.rect(20, y - 5, 257, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            cols.forEach(col => doc.text(col.label, col.x, y));
            y += 8;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(9);
        }

        const shareRange = sh.shareNumberFrom && sh.shareNumberTo
            ? `${sh.shareNumberFrom}–${sh.shareNumberTo}`
            : '—'
        doc.text(shareRange, cols[0].x, y);
        doc.text(sh.name.substring(0, 30), cols[1].x, y);
        doc.text(sh.personalNumber || '—', cols[2].x, y);
        doc.text(sh.shareClass, cols[3].x, y);
        doc.text(sh.shares.toLocaleString('sv-SE'), cols[4].x, y);
        doc.text(`${sh.ownershipPercentage}%`, cols[5].x, y);
        doc.text(`${sh.votesPercentage}%`, cols[6].x, y);
        doc.text(sh.acquisitionDate || '—', cols[7].x, y);

        // Row divider
        y += 2;
        doc.setDrawColor(...PDF_STYLES.dividerColor);
        doc.line(20, y, 277, y);
        y += 6;
    });

    // Extract date footer
    y += 5;
    doc.setTextColor(...PDF_STYLES.grayText);
    doc.setFontSize(8);
    doc.text(`Utdrag ur aktiebok, ${new Date().toLocaleDateString('sv-SE')}`, 20, y);
    doc.text('Upprättad i enlighet med ABL 5 kap. 2 §', 20, y + 5);

    // Footer
    doc.text(PDF_STYLES.footer, 148, 200, { align: 'center' });

    doc.save(`Aktiebok_${companyName.replace(/\s+/g, '_')}.pdf`);
}

// ============================================================================
// Meeting Minutes (Protokoll) PDF
// ============================================================================

export interface MeetingMinutesDecision {
    title: string
    decision: string
    amount?: number
    votingResult?: { for: number; against: number; abstained: number }
}

export interface MeetingMinutesPDFData {
    year: number
    date: string
    time?: string
    location: string
    type: string
    meetingCategory?: 'bolagsstamma' | 'styrelsemote'
    meetingNumber?: number
    chairperson?: string
    secretary?: string
    attendees?: string[]
    decisions: MeetingMinutesDecision[]
    protokollText?: string
    agenda?: string[]
}

export const generateMeetingMinutesPDF = (data: MeetingMinutesPDFData, company?: PDFCompanyInfo) => {
    const doc = new jsPDF();
    const companyName = company?.name || 'Mitt Företag AB'
    const orgNumber = company?.orgNumber || ''

    const isBoard = data.meetingCategory === 'styrelsemote'
    const isOrdinarie = data.type === 'ordinarie'

    const title = isBoard
        ? `PROTOKOLL FÖRT VID STYRELSEMÖTE${data.meetingNumber ? ` #${data.meetingNumber}` : ''}`
        : `PROTOKOLL FÖRT VID ${isOrdinarie ? 'ORDINARIE' : 'EXTRA'} BOLAGSSTÄMMA`

    // Title
    doc.setTextColor(PDF_STYLES.primaryColor);
    doc.setFontSize(16);
    const titleLines = doc.splitTextToSize(title, 160)
    doc.text(titleLines, 105, 25, { align: 'center' });

    let y = 25 + titleLines.length * 7 + 3

    // Company info
    doc.setFontSize(12);
    doc.text(companyName, 105, y, { align: 'center' });
    y += 5
    if (orgNumber) {
        doc.setFontSize(10);
        doc.setTextColor(...PDF_STYLES.grayText);
        doc.text(`Org.nr: ${orgNumber}`, 105, y, { align: 'center' });
        y += 5
    }

    doc.setDrawColor(...PDF_STYLES.dividerColor);
    doc.line(40, y + 2, 170, y + 2);
    y += 10

    // If protokollText is present, render it as preformatted text
    if (data.protokollText) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(data.protokollText, 160)
        for (const line of lines) {
            y = checkPageBreak(doc, y)
            doc.text(line, 20, y)
            y += 5
        }
        addFooter(doc)
        const filename = isBoard
            ? `Protokoll_Styrelsemote${data.meetingNumber ? `_${data.meetingNumber}` : ''}_${data.year}.pdf`
            : `Protokoll_Bolagsstamma_${data.year}.pdf`
        doc.save(filename)
        return
    }

    // Meeting details box
    doc.setFillColor(...PDF_STYLES.bgFill);
    doc.rect(20, y, 170, 30, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Datum: ${formatDateLong(data.date)}`, 25, y + 8);
    if (data.time) doc.text(`Tid: ${data.time}`, 25, y + 14);
    doc.text(`Plats: ${data.location || 'Ej angiven'}`, 25, y + (data.time ? 20 : 14));
    if (data.chairperson) doc.text(`Ordförande: ${data.chairperson}`, 110, y + 8);
    if (data.secretary) doc.text(`Sekreterare: ${data.secretary}`, 110, y + 14);
    y += 38

    // Attendance
    if (data.attendees && data.attendees.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(PDF_STYLES.primaryColor);
        doc.text('Närvarande', 20, y);
        y += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        data.attendees.forEach(name => {
            y = checkPageBreak(doc, y)
            doc.text(`  ${name}`, 20, y);
            y += 6;
        });
        y += 5;
    }

    // Decisions
    if (data.decisions.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(PDF_STYLES.primaryColor);
        doc.text('Beslut', 20, y);
        y += 8;

        data.decisions.forEach((decision, i) => {
            y = checkPageBreak(doc, y, 25)

            doc.setTextColor(PDF_STYLES.primaryColor);
            doc.setFontSize(11);
            doc.text(`§ ${i + 1}  ${decision.title}`, 20, y);
            y += 6;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            const decisionLines = doc.splitTextToSize(decision.decision, 160)
            for (const line of decisionLines) {
                y = checkPageBreak(doc, y)
                doc.text(line, 25, y)
                y += 5
            }

            if (decision.amount) {
                doc.text(`Belopp: ${decision.amount.toLocaleString('sv-SE')} kr`, 25, y);
                y += 5;
            }

            if (decision.votingResult) {
                const vr = decision.votingResult;
                doc.setTextColor(...PDF_STYLES.grayText);
                doc.text(`Omröstning: ${vr.for} för, ${vr.against} emot, ${vr.abstained} avstod`, 25, y);
                doc.setTextColor(0, 0, 0);
                y += 5;
            }

            y += 4;
        });
    } else if (data.agenda) {
        // If no decisions but agenda, render agenda
        doc.setFontSize(11);
        doc.setTextColor(PDF_STYLES.primaryColor);
        doc.text('Dagordning', 20, y);
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        data.agenda.forEach((item, i) => {
            y = checkPageBreak(doc, y)
            doc.text(`§ ${i + 1}  ${item}`, 25, y);
            y += 7;
        });
        y += 5;
    }

    // Signature lines
    y = checkPageBreak(doc, y, 40)
    y = Math.max(y + 10, 220)
    doc.setDrawColor(...PDF_STYLES.dividerColor);

    doc.line(25, y, 90, y);
    doc.line(115, y, 180, y);
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(...PDF_STYLES.grayText);
    doc.text(data.chairperson || 'Ordförande', 25, y);
    doc.text('Justeringsperson', 115, y);

    y += 3;
    doc.setFontSize(8);
    doc.text('Ordförande', 25, y);
    doc.text('Protokolljusterare', 115, y);

    addFooter(doc)

    const filename = isBoard
        ? `Protokoll_Styrelsemote${data.meetingNumber ? `_${data.meetingNumber}` : ''}_${data.year}.pdf`
        : `Protokoll_Bolagsstamma_${data.year}.pdf`
    doc.save(filename)
}

// ============================================================================
// Dividend Receipt (Utdelningsavi) PDF
// ============================================================================

export interface DividendReceiptShareholder {
    name: string
    personalNumber?: string
    shares: number
    ownershipPercentage: number
    grossAmount: number
    tax: number
    netAmount: number
}

export interface DividendReceiptPDFData {
    year: number
    amount: number
    taxRate: string
    tax: number
    netAmount: number
    meetingDate: string
    shareholders?: DividendReceiptShareholder[]
}

export const generateDividendReceiptPDF = (data: DividendReceiptPDFData, company?: PDFCompanyInfo) => {
    const doc = new jsPDF();
    const companyName = company?.name || 'Mitt Företag AB'
    const orgNumber = company?.orgNumber || ''

    // Title
    doc.setTextColor(PDF_STYLES.primaryColor);
    doc.setFontSize(22);
    doc.text('UTDELNINGSAVI', 20, 25);

    addCompanyHeader(doc, company)

    // Divider
    doc.setDrawColor(...PDF_STYLES.dividerColor);
    doc.line(20, 42, 190, 42);

    // Summary box
    let y = 52;
    doc.setFillColor(...PDF_STYLES.bgFill);
    doc.rect(20, y, 170, 30, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Räkenskapsår: ${data.year}`, 25, y + 8);
    doc.text(`Beslut fattat vid bolagsstämma: ${formatDateLong(data.meetingDate)}`, 25, y + 15);
    doc.text(`Bolag: ${companyName}${orgNumber ? ` (${orgNumber})` : ''}`, 25, y + 22);

    y += 40;

    // Breakdown table
    doc.setFontSize(12);
    doc.setTextColor(PDF_STYLES.primaryColor);
    doc.text('Utdelning — Sammanställning', 20, y);
    y += 10;

    doc.setDrawColor(...PDF_STYLES.dividerColor);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);

    // Row: Bruttoutdelning
    doc.text('Bruttoutdelning', 25, y);
    doc.text(formatCurrency(data.amount), 180, y, { align: 'right' });
    y += 3;
    doc.line(20, y, 190, y);
    y += 8;

    // Row: Skatt
    doc.text(`Skatt (${data.taxRate})`, 25, y);
    doc.text(`-${formatCurrency(data.tax)}`, 180, y, { align: 'right' });
    y += 3;
    doc.line(20, y, 190, y);
    y += 8;

    // Row: Nettoutdelning (highlighted)
    doc.setFillColor(...PDF_STYLES.primaryRGB);
    doc.rect(20, y - 5, 170, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Nettoutdelning', 25, y + 3);
    doc.text(formatCurrency(data.netAmount), 180, y + 3, { align: 'right' });
    y += 18;

    // Per-shareholder table (if available)
    if (data.shareholders && data.shareholders.length > 0) {
        doc.setTextColor(PDF_STYLES.primaryColor);
        doc.setFontSize(12);
        doc.text('Fördelning per aktieägare', 20, y);
        y += 10;

        // Header
        doc.setFillColor(...PDF_STYLES.bgFill);
        doc.rect(20, y - 5, 170, 8, 'F');
        doc.setTextColor(...PDF_STYLES.grayText);
        doc.setFontSize(8);
        doc.text('Namn', 22, y);
        doc.text('Aktier', 85, y);
        doc.text('Andel', 105, y);
        doc.text('Brutto', 125, y);
        doc.text('Skatt', 150, y);
        doc.text('Netto', 175, y, { align: 'right' });
        y += 6;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        data.shareholders.forEach(sh => {
            y = checkPageBreak(doc, y)
            doc.text(sh.name.substring(0, 25), 22, y);
            doc.text(sh.shares.toLocaleString('sv-SE'), 85, y);
            doc.text(`${sh.ownershipPercentage}%`, 105, y);
            doc.text(formatCurrency(sh.grossAmount), 125, y);
            doc.text(formatCurrency(sh.tax), 150, y);
            doc.text(formatCurrency(sh.netAmount), 175, y, { align: 'right' });
            y += 2;
            doc.setDrawColor(...PDF_STYLES.dividerColor);
            doc.line(20, y, 190, y);
            y += 6;
        });
    }

    // Legal reference
    y = checkPageBreak(doc, y, 15)
    y += 5;
    doc.setTextColor(...PDF_STYLES.grayText);
    doc.setFontSize(8);
    doc.text(`Beslut fattat vid bolagsstämma ${formatDateLong(data.meetingDate)}`, 20, y);
    doc.text('Utdelning beslutad i enlighet med ABL 18 kap.', 20, y + 5);

    addFooter(doc)

    doc.save(`Utdelningsavi_${companyName.replace(/\s+/g, '_')}_${data.year}.pdf`);
}
