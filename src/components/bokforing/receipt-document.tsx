import Image from 'next/image'
import { ReceiptDocumentData } from '@/types/documents'

interface ReceiptDocumentProps {
    data: ReceiptDocumentData
}

export function ReceiptDocument({ data }: ReceiptDocumentProps) {
    return (
        <div className="bg-white text-black p-8 max-w-md mx-auto" style={{ fontFamily: 'monospace, courier' }}>
            {/* Header */}
            <div className="text-center mb-6">
                <Image
                    src={data.companyLogo}
                    alt={data.companyName}
                    width={120}
                    height={48}
                    className="object-contain mx-auto mb-3"
                />
                <h1 className="text-xl font-bold mb-1">{data.companyName}</h1>
                <p className="text-xs text-gray-600">{data.companyAddress}</p>
                <p className="text-xs text-gray-600">Org.nr: {data.companyOrgNr}</p>
                {data.storeName && <p className="text-xs text-gray-600 mt-1">{data.storeName}</p>}
            </div>

            <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

            {/* Receipt info */}
            <div className="text-center text-sm mb-4">
                <p className="font-bold">KVITTO</p>
                <p className="text-xs">#{data.receiptNumber}</p>
                <p className="text-xs">{data.receiptDate} {data.receiptTime}</p>
                {data.cashierName && <p className="text-xs">Kassör: {data.cashierName}</p>}
            </div>

            <div className="border-t border-dashed border-gray-400 my-4"></div>

            {/* Line items */}
            <div className="mb-4 text-sm">
                {data.lineItems.map((item, idx) => (
                    <div key={idx} className="mb-2">
                        <div className="flex justify-between">
                            <span>{item.description}</span>
                            <span className="font-semibold">{item.amount.toLocaleString('sv-SE')} kr</span>
                        </div>
                        <div className="text-xs text-gray-600 flex justify-between">
                            <span>{item.quantity} st × {item.unitPrice.toLocaleString('sv-SE')} kr</span>
                            <span>Moms {item.vatRate}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-gray-400 my-4"></div>

            {/* Totals */}
            <div className="text-sm space-y-1 mb-4">
                <div className="flex justify-between">
                    <span>Summa exkl. moms:</span>
                    <span>{data.subtotal.toLocaleString('sv-SE')} kr</span>
                </div>
                <div className="flex justify-between">
                    <span>Moms:</span>
                    <span>{data.vatAmount.toLocaleString('sv-SE')} kr</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-400 pt-2 mt-2">
                    <span>TOTALT:</span>
                    <span>{data.total.toLocaleString('sv-SE')} kr</span>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-400 my-4"></div>

            {/* Payment info */}
            <div className="text-sm mb-4">
                <div className="flex justify-between">
                    <span>Betalning:</span>
                    <span className="font-semibold">{data.paymentMethod}</span>
                </div>
                {data.cardLastFour && (
                    <div className="text-xs text-gray-600">
                        <span>Kort ****{data.cardLastFour}</span>
                    </div>
                )}
                <div className="flex justify-between mt-1">
                    <span>Mottaget:</span>
                    <span>{data.total.toLocaleString('sv-SE')} kr</span>
                </div>
            </div>

            {/* Notes */}
            {data.notes && (
                <div className="text-xs text-center text-gray-600 mb-4">
                    <p>{data.notes}</p>
                </div>
            )}

            <div className="border-t-2 border-dashed border-gray-400 my-4"></div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500">
                <p>Tack för ditt köp!</p>
                <p className="mt-2">Spara kvittot som underlag</p>
            </div>
        </div>
    )
}
