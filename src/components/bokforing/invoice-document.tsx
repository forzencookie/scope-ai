import Image from 'next/image'
import { InvoiceDocumentData } from '@/types/documents'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'

interface InvoiceDocumentProps {
    data: InvoiceDocumentData
}

export function InvoiceDocument({ data }: InvoiceDocumentProps) {
    return (
        <div className="bg-white text-black p-12 max-w-4xl mx-auto" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {/* Header with logo */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <Image
                        src={data.companyLogo}
                        alt={data.companyName}
                        width={150}
                        height={60}
                        className="object-contain"
                    />
                    <div className="mt-4 text-sm text-gray-600">
                        <p className="font-semibold text-gray-900">{data.companyName}</p>
                        <p>{data.companyAddress}</p>
                        <p>Org.nr: {data.companyOrgNr}</p>
                        {data.companyPhone && <p>Tel: {data.companyPhone}</p>}
                        {data.companyEmail && <p>{data.companyEmail}</p>}
                    </div>
                </div>

                <div className="text-right">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">FAKTURA</h1>
                    <div className="text-sm space-y-1">
                        <p><span className="font-semibold">Fakturanummer:</span> {data.invoiceNumber}</p>
                        <p><span className="font-semibold">Fakturadatum:</span> {data.invoiceDate}</p>
                        <p><span className="font-semibold">Förfallodatum:</span> {data.dueDate}</p>
                    </div>
                </div>
            </div>

            {/* Customer info */}
            <div className="mb-8 pb-4 border-b border-gray-300">
                <p className="text-xs text-gray-500 mb-1">Kund</p>
                <p className="font-semibold text-gray-900">{data.customerName}</p>
                {data.customerAddress && <p className="text-sm text-gray-600">{data.customerAddress}</p>}
            </div>

            {/* Line items table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-gray-900">
                        <th className="text-left py-3 font-semibold">Beskrivning</th>
                        <th className="text-right py-3 font-semibold w-16">Antal</th>
                        <th className="text-right py-3 font-semibold w-24">À-pris</th>
                        <th className="text-right py-3 font-semibold w-16">Moms</th>
                        <th className="text-right py-3 font-semibold w-28">Belopp</th>
                    </tr>
                </thead>
                <tbody>
                    {data.lineItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                            <td className="py-3 text-sm">{item.description}</td>
                            <td className="py-3 text-sm text-right">{item.quantity}</td>
                            <td className="py-3 text-sm text-right">{item.unitPrice.toLocaleString('sv-SE')} kr</td>
                            <td className="py-3 text-sm text-right">{item.vatRate}%</td>
                            <td className="py-3 text-sm text-right font-semibold">{item.amount.toLocaleString('sv-SE')} kr</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-80">
                    <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">Summa exkl. moms:</span>
                        <span className="font-semibold">{data.subtotal.toLocaleString('sv-SE')} kr</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm border-b border-gray-300">
                        <span className="text-gray-600">Moms:</span>
                        <span className="font-semibold">{data.vatAmount.toLocaleString('sv-SE')} kr</span>
                    </div>
                    <div className="flex justify-between py-3 text-lg border-b-2 border-gray-900">
                        <span className="font-bold">Att betala:</span>
                        <span className="font-bold">{data.total.toLocaleString('sv-SE')} kr</span>
                    </div>
                </div>
            </div>

            {/* Payment info */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h3 className="font-semibold mb-3 text-gray-900">Betalningsinformation</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {data.paymentInfo.bankgiro && (
                        <div>
                            <p className="text-gray-600">Bankgiro:</p>
                            <p className="font-semibold">{data.paymentInfo.bankgiro}</p>
                        </div>
                    )}
                    {data.paymentInfo.plusgiro && (
                        <div>
                            <p className="text-gray-600">Plusgiro:</p>
                            <p className="font-semibold">{data.paymentInfo.plusgiro}</p>
                        </div>
                    )}
                    <div>
                        <p className="text-gray-600">OCR-nummer:</p>
                        <p className="font-semibold font-mono">{data.paymentInfo.ocrNumber}</p>
                    </div>
                    <div>
                        <p className="text-gray-600">Förfallodatum:</p>
                        <p className="font-semibold">{data.dueDate}</p>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {data.notes && (
                <div className="text-xs text-gray-500 italic">
                    <p>{data.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-center text-gray-500">
                <p>Vänligen ange OCR-nummer vid betalning</p>
            </div>
        </div>
    )
}
