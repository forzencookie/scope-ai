"use client"

import { LayoutDashboard, Building, Users, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { StatusBadge } from "./ui"

export function BentoGrid() {
  return (
    <section id="features" className="px-3 md:px-4 py-8 max-w-[2400px] mx-auto">
      <div className="bg-white border border-stone-200 rounded-3xl p-8 md:p-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight mb-4">Allt du behöver. Automatiserat.</h2>
          <p className="text-stone-600 max-w-2xl">
            Från daglig bokföring till årsredovisning — varje modul är byggd för att spara dig tid med AI som förstår svensk redovisning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[550px]">
          {/* Card 1: Books (Wide) - Row 1, Cols 1-2 */}
          <div className="md:col-span-2 md:row-span-1 bg-white border border-stone-200 rounded-xl p-8 hover:border-stone-300 transition-colors group">
            <div className="h-full flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg">
                  <LayoutDashboard className="w-5 h-5 text-stone-600" />
                </div>
                <StatusBadge status="complete" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">AI-bokföring</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Banktransaktioner kategoriseras automatiskt mot BAS-kontoplanen. AI:n lär sig dina mönster och föreslår konteringar.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: VAT (Square) - Row 1, Col 3 */}
          <div className="md:col-span-1 md:row-span-1 bg-white border border-stone-200 rounded-xl p-8 hover:border-stone-300 transition-colors group">
            <div className="h-full flex flex-col justify-between">
              <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg w-fit">
                <Building className="w-5 h-5 text-stone-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">Momsdeklaration</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Genereras automatiskt från bokföringen. Skicka direkt till Skatteverket.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Payroll (Vertical) - Row 1-2, Col 4 */}
          <div className="md:col-span-1 md:row-span-2 bg-white border border-stone-200 rounded-xl p-8 hover:border-stone-300 transition-colors group">
            <div className="h-full flex flex-col">
              <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg w-fit mb-8">
                <Users className="w-5 h-5 text-stone-600" />
              </div>
              <div className="space-y-4 flex-1">
                {[
                  { label: "Löner", status: "complete" as const },
                  { label: "Arbetsgivaravgift", status: "complete" as const },
                  { label: "Pension", status: "pending" as const },
                  { label: "Semester", status: "active" as const },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-stone-200 last:border-0">
                    <span className="text-sm font-medium text-stone-700">{item.label}</span>
                    <div className={cn("w-2 h-2 rounded-full", {
                      "bg-emerald-500": item.status === "complete",
                      "bg-amber-500": item.status === "pending",
                      "bg-violet-500": item.status === "active",
                    })} />
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-black transition-colors">Löner & AGI</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  AI beräknar löner, skatter och arbetsgivaravgifter. Lönebesked och AGI-deklarationer genereras automatiskt.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Documents (Wide) - Row 2, Cols 1-3 */}
          <div className="md:col-span-3 md:row-span-1 bg-white border border-stone-200 rounded-xl p-8 text-stone-900 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.03)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] group-hover:animate-shine pointer-events-none" />
            <div className="relative z-10 h-full flex items-center justify-between">
              <div className="max-w-md">
                <div className="p-2 bg-stone-100 border border-stone-200 rounded-lg w-fit mb-6">
                  <FileText className="w-5 h-5 text-stone-700" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-2">Kvitton & Fakturor</h3>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Skanna kvitton, ladda upp fakturor — AI:n matchar automatiskt mot transaktioner och föreslår kontering.
                </p>
              </div>
              <div className="hidden md:flex gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-24 h-32 bg-stone-100 border border-stone-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
