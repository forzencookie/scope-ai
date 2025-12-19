"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Building2, Landmark, LayoutDashboard, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MyndigheterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "skatteverket"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-6xl py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/simulator"
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Simulator</span>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h1 className="font-semibold">Myndigheter</h1>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              Öppna Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-white border-b">
        <div className="container max-w-6xl px-4">
          <nav className="flex gap-1">
            <Link
              href="/myndigheter?tab=skatteverket"
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                currentTab === "skatteverket"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Skatteverket
              </div>
            </Link>
            <Link
              href="/myndigheter?tab=bolagsverket"
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                currentTab === "bolagsverket"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bolagsverket
              </div>
            </Link>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main>{children}</main>
    </div>
  )
}
