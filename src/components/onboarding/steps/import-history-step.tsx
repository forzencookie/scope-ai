"use client"

import { UploadCloud } from "lucide-react"

// ============================================================================
// ImportHistoryStep - SIE file upload for existing companies
// ============================================================================

export function ImportHistoryStep() {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/sie/import', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        alert(`Importerade ${data.stats.verifications} verifikationer och ${data.stats.accounts} konton!`)
      }
    } catch (err) {
      console.error(err)
      alert("Kunde inte importera filen.")
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div
        className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center hover:bg-white/[0.04] hover:border-white/25 transition-all cursor-pointer"
        onClick={() => document.getElementById('sie-upload')?.click()}
      >
        <input
          id="sie-upload"
          type="file"
          accept=".se,.si,.sie"
          className="hidden"
          onChange={handleFileUpload}
        />
        <UploadCloud className="h-10 w-10 text-white/30 mx-auto mb-4" />
        <h3 className="font-medium mb-1 text-white">Släpp din SIE-fil här</h3>
        <p className="text-sm text-white/40">eller klicka för att välja fil</p>
        <p className="text-xs text-white/25 mt-4">Stöder SIE4 standarden (.se)</p>
      </div>
    </div>
  )
}
