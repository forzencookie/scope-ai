"use client"

/**
 * Momsdeklaration Preview Component
 * 
 * Renders a visual preview matching the official Skatteverket SKV 4700 form.
 * This is read-only and used to show how the data would appear on the official document.
 */

import { VatReport } from "@/lib/vat-processor"
import { CompanyInfo, defaultCompanyInfo } from "@/lib/vat-xml-export"
import { cn } from "@/lib/utils"

interface MomsPreviewProps {
    report: VatReport
    company?: CompanyInfo
    className?: string
}

function PreviewRow({
    code,
    label,
    value,
    isTotal = false,
    showPlus = false
}: {
    code: string
    label: string
    value: number
    isTotal?: boolean
    showPlus?: boolean
}) {
    if (value === 0 && !isTotal) return null

    return (
        <div className={cn(
            "grid grid-cols-[3rem_1fr_6rem] gap-2 py-1.5 border-b border-gray-300 text-sm",
            isTotal && "bg-gray-100 font-semibold"
        )}>
            <div className="font-mono text-gray-600">{code}</div>
            <div className="text-gray-800">{label}</div>
            <div className="text-right font-mono">
                {showPlus && value > 0 && "+"}
                {Math.round(value).toLocaleString("sv-SE")}
            </div>
        </div>
    )
}

function SectionHeader({ title, amountLabel = "Belopp" }: { title: string; amountLabel?: string }) {
    return (
        <div className="grid grid-cols-[3rem_1fr_6rem] gap-2 py-2 bg-gray-200 px-2 text-xs font-bold text-gray-700 uppercase tracking-wide border-b-2 border-gray-400">
            <div></div>
            <div>{title}</div>
            <div className="text-right">{amountLabel}</div>
        </div>
    )
}

export function MomsPreview({ report, company = defaultCompanyInfo, className }: MomsPreviewProps) {
    return (
        <div className={cn(
            "bg-white border-2 border-gray-400 rounded shadow-lg font-sans text-black max-w-2xl",
            className
        )}>
            {/* Header */}
            <div className="border-b-2 border-gray-400 p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Deklarationen ska finnas hos Skatteverket senast på deklarationsdagen</div>
                        <h1 className="text-lg font-bold">Mervärdesskattdeklaration</h1>
                    </div>
                    <div className="text-right">
                        <div className="bg-yellow-400 text-black px-3 py-1 font-bold text-lg rounded">SKV</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <div className="text-xs text-gray-500">Period</div>
                        <div className="font-semibold">{report.period}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Organisationsnummer</div>
                        <div className="font-mono">{company.organisationsnummer}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Företagsnamn</div>
                        <div className="font-semibold">{company.foretagsnamn}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500">Momsregistreringsnummer</div>
                        <div className="font-mono text-xs">{company.momsregistreringsnummer}</div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Section A */}
                <div>
                    <SectionHeader title="A. Momspliktig försäljning eller uttag exkl. moms" amountLabel="kr" />
                    <PreviewRow code="05" label="Momspliktig försäljning 25%" value={report.ruta05} />
                    <PreviewRow code="06" label="Momspliktig försäljning 12%" value={report.ruta06} />
                    <PreviewRow code="07" label="Momspliktig försäljning 6%" value={report.ruta07} />
                    <PreviewRow code="08" label="Hyresinkomster vid frivillig skattskyldighet" value={report.ruta08} />
                </div>

                {/* Section B */}
                <div>
                    <SectionHeader title="B. Utgående moms på försäljning" amountLabel="Moms kr" />
                    <PreviewRow code="10" label="Utgående moms 25%" value={report.ruta10} />
                    <PreviewRow code="11" label="Utgående moms 12%" value={report.ruta11} />
                    <PreviewRow code="12" label="Utgående moms 6%" value={report.ruta12} />
                </div>

                {/* Section C */}
                {(report.ruta20 + report.ruta21 + report.ruta22 + report.ruta23 + report.ruta24) > 0 && (
                    <div>
                        <SectionHeader title="C. Momspliktiga inköp vid omvänd skattskyldighet" amountLabel="kr" />
                        <PreviewRow code="20" label="Inköp av varor från annat EU-land" value={report.ruta20} />
                        <PreviewRow code="21" label="Inköp av tjänster från annat EU-land" value={report.ruta21} />
                        <PreviewRow code="22" label="Inköp av tjänster från land utanför EU" value={report.ruta22} />
                        <PreviewRow code="23" label="Inköp av varor i Sverige" value={report.ruta23} />
                        <PreviewRow code="24" label="Övriga inköp av tjänster" value={report.ruta24} />
                    </div>
                )}

                {/* Section D */}
                {(report.ruta30 + report.ruta31 + report.ruta32) > 0 && (
                    <div>
                        <SectionHeader title="D. Utgående moms på inköp i ruta 20-24" amountLabel="Moms kr" />
                        <PreviewRow code="30" label="Utgående moms 25%" value={report.ruta30} />
                        <PreviewRow code="31" label="Utgående moms 12%" value={report.ruta31} />
                        <PreviewRow code="32" label="Utgående moms 6%" value={report.ruta32} />
                    </div>
                )}

                {/* Section E */}
                {(report.ruta35 + report.ruta36 + report.ruta37 + report.ruta38 + report.ruta39 + report.ruta40 + report.ruta41 + report.ruta42) > 0 && (
                    <div>
                        <SectionHeader title="E. Försäljning m.m. som är undantagen från moms" amountLabel="kr" />
                        <PreviewRow code="35" label="Försäljning av varor till annat EU-land" value={report.ruta35} />
                        <PreviewRow code="36" label="Försäljning av varor utanför EU" value={report.ruta36} />
                        <PreviewRow code="37" label="Mellanmans inköp vid trepartshandel" value={report.ruta37} />
                        <PreviewRow code="38" label="Mellanmans försäljning vid trepartshandel" value={report.ruta38} />
                        <PreviewRow code="39" label="Försäljning av tjänster till EU-land" value={report.ruta39} />
                        <PreviewRow code="40" label="Övrig försäljning av tjänster utanför Sverige" value={report.ruta40} />
                        <PreviewRow code="41" label="Försäljning där köparen är skattskyldig" value={report.ruta41} />
                        <PreviewRow code="42" label="Övrig momsfri försäljning" value={report.ruta42} />
                    </div>
                )}

                {/* Section H: Import */}
                {(report.ruta50 + report.ruta60 + report.ruta61 + report.ruta62) > 0 && (
                    <div>
                        <SectionHeader title="H. Import" amountLabel="kr" />
                        <PreviewRow code="50" label="Beskattningsunderlag vid import" value={report.ruta50} />
                        <PreviewRow code="60" label="Utgående moms på import 25%" value={report.ruta60} />
                        <PreviewRow code="61" label="Utgående moms på import 12%" value={report.ruta61} />
                        <PreviewRow code="62" label="Utgående moms på import 6%" value={report.ruta62} />
                    </div>
                )}

                {/* Section F */}
                <div>
                    <SectionHeader title="F. Ingående moms" amountLabel="Moms kr" />
                    <PreviewRow code="48" label="Ingående moms att dra av" value={report.ruta48} />
                </div>

                {/* Section G - Result */}
                <div className="border-2 border-gray-600 rounded p-3 bg-gray-50">
                    <SectionHeader title="G. Moms att betala eller få tillbaka" amountLabel="kr" />
                    <PreviewRow
                        code="49"
                        label={report.ruta49 >= 0 ? "Moms att betala" : "Moms att få tillbaka"}
                        value={Math.abs(report.ruta49)}
                        isTotal
                        showPlus={report.ruta49 >= 0}
                    />
                </div>

                {/* Footer */}
                <div className="text-xs text-gray-500 pt-4 border-t">
                    <p>Deadline: {report.dueDate}</p>
                    <p className="mt-1">Skriv under på andra sidan.</p>
                </div>
            </div>
        </div>
    )
}
