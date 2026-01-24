import { SupplierInvoice } from "@/data/ownership"

export type PaymentFormat = 'LB' | 'ISO20022'

interface PaymentFileOptions {
    senderBankgiro: string
    senderName: string
    executionDate: string // YYYY-MM-DD
}

export function generatePaymentFile(invoices: SupplierInvoice[], format: PaymentFormat, options: PaymentFileOptions): string {
    if (format === 'LB') {
        return generateLB(invoices, options)
    } else {
        return generateISO20022(invoices, options)
    }
}

function generateLB(invoices: SupplierInvoice[], options: PaymentFileOptions): string {
    // Opening record (Öppningspost)
    const dateStr = options.executionDate.replace(/-/g, '').slice(2) // YYMMDD
    const bg = options.senderBankgiro.replace(/\D/g, '').padEnd(10, '0')
    let content = `11${bg}${dateStr}LEV-BETALNINGAR${''.padEnd(45)}\n`

    let totalAmount = 0

    invoices.forEach(inv => {
        // Payment record (Betalningspost) - type 14 for simple BG payment
        // Standard format is complex, simplified for MVP demonstration
        const amount = Math.round(inv.totalAmount * 100).toString().padStart(12, '0')
        const ocrRef = inv.ocrReference || inv.invoiceNumber // Fallback to invoice number
        const recipientBg = '0000000000' // Mock receiver BG as it's not on SupplierInvoice yet (would need Supplier entity)
        const ocr = ocrRef.replace(/\D/g, '').padStart(25, '0')

        // In LB file, recipient BG is usually in a separate record or specific field
        // Mocking a standard Line 14 structure:
        // 14 + RecipientBG (10) + Amount (12) + PayDate (6) + Reserved (5) + OCR (25) + ...
        content += `14${recipientBg}${amount}${dateStr}${' '.repeat(5)}${ocr}SEK\n`

        totalAmount += inv.totalAmount
    })

    // Total record (Summapost)
    const totalStr = Math.round(totalAmount * 100).toString().padStart(12, '0')
    const countStr = invoices.length.toString().padStart(7, '0')
    content += `29${bg}${dateStr}${totalStr}${countStr}${' '.repeat(43)}\n`

    return content
}

function generateISO20022(invoices: SupplierInvoice[], options: PaymentFileOptions): string {
    const msgId = `MSG-${Date.now()}`
    const createDate = new Date().toISOString()

    return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${msgId}</MsgId>
      <CreDtTm>${createDate}</CreDtTm>
      <NbOfTx>1</NbOfTx>
      <InitgPty>
        <Nm>${options.senderName}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT-001</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${options.executionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${options.senderName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>SE1234000000000000000000</IBAN>
        </Id>
      </DbtrAcct>
      ${invoices.map(inv => `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${inv.invoiceNumber}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="${inv.currency || 'SEK'}">${inv.totalAmount.toFixed(2)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${inv.supplierName}</Nm>
        </Cdtr>
        <RmtInf>
          <Strd>
            <CdtrRefInf>
              <Tp>
                <CdOrPrtry>
                  <Cd>SCOR</Cd>
                </CdOrPrtry>
              </Tp>
              <Ref>${inv.ocrReference || inv.invoiceNumber}</Ref>
            </CdtrRefInf>
          </Strd>
        </RmtInf>
      </CdtTrfTxInf>
      `).join('')}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`
}
