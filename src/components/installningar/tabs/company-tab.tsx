"use client"

import * as React from "react"
import { Trash2, Download, Upload, Building2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useCompany } from "@/providers/company-provider"
import { useTextMode } from "@/providers/text-mode-provider"
import { CompanyTypeSelector } from "@/components/onboarding/company-type-selector"
import {
    SettingsPageHeader,
    SettingsFormField,
    SettingsSaveButton,
    SettingsSection,
    SettingsActionCard,
} from "@/components/ui/settings-items"
import type { SettingsFormData } from "./account-tab"

interface CompanyTabProps {
    formData: SettingsFormData
    setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>
    onSave: () => void
}

export function CompanyTab({ formData, setFormData, onSave }: CompanyTabProps) {
    const { text } = useTextMode()
    const { company, updateCompany } = useCompany()
    const accountingMethod = company?.accountingMethod || 'invoice'
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
    const [confirmText, setConfirmText] = React.useState("")
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isExporting, setIsExporting] = React.useState(false)
    const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
    const logoInputRef = React.useRef<HTMLInputElement>(null)

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingLogo(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/company/logo', {
                method: 'POST',
                body: formData,
            })

            if (res.ok) {
                const data = await res.json()
                updateCompany({ logoUrl: data.logo_url })
            } else {
                const err = await res.json()
                alert(err.message || 'Kunde inte ladda upp logotyp')
            }
        } catch {
            alert('Ett fel uppstod vid uppladdning')
        } finally {
            setIsUploadingLogo(false)
            if (logoInputRef.current) logoInputRef.current.value = ''
        }
    }

    const handleSIEExport = async () => {
        setIsExporting(true)
        try {
            // Get current fiscal year
            const currentYear = new Date().getFullYear()
            const response = await fetch(`/api/sie/export?year=${currentYear}`)
            
            if (!response.ok) {
                throw new Error('Export failed')
            }
            
            // Get the filename from Content-Disposition header or use default
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `bokforing_${currentYear}.se`
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/)
                if (match) filename = match[1]
            }
            
            // Create blob and download
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('SIE export error:', error)
            alert('Kunde inte exportera SIE-fil. Försök igen.')
        } finally {
            setIsExporting(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch('/api/cleanup', { method: 'DELETE' })
            if (res.ok) {
                localStorage.removeItem('scope-ai-company')
                localStorage.removeItem('chat-history')
                setTimeout(() => {
                    window.location.reload()
                }, 500)
            } else {
                alert("Kunde inte radera data.")
                setIsDeleting(false)
            }
        } catch (e) {
            console.error(e)
            alert("Ett fel uppstod.")
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <SettingsPageHeader
                title={text.settings.companyInfo}
                description={text.settings.companyInfoDesc}
            />

            <SettingsSection
                title={text.settings.companyType}
                description={text.settings.companyTypeDesc}
            >
                <CompanyTypeSelector showDescription={false} columns={2} />
            </SettingsSection>

            <Separator />

            <SettingsSection
                title="Logotyp"
                description="Visas på fakturor och lönebesked"
            >
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/30">
                        {company?.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={company.logoUrl}
                                alt="Företagslogotyp"
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground/50" />
                        )}
                    </div>
                    <div className="space-y-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingLogo ? 'Laddar upp...' : 'Ladda upp logotyp'}
                        </Button>
                        <p className="text-xs text-muted-foreground">PNG, JPG, SVG. Max 2 MB.</p>
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={handleLogoUpload}
                        />
                    </div>
                </div>
            </SettingsSection>

            <Separator />

            <div className="grid gap-4">
                <SettingsFormField
                    id="company-name"
                    label="Företagsnamn"
                    placeholder="Mitt Företag AB"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <div className="grid gap-2">
                    <Label>Bokföringsmetod</Label>
                    <Select
                        value={accountingMethod}
                        onValueChange={(val: 'cash' | 'invoice') => updateCompany({ accountingMethod: val })}
                    >
                        <SelectTrigger className="w-full text-left justify-between px-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="invoice">
                                <span className="font-medium block">Fakturametoden</span>
                                <span className="text-xs text-muted-foreground">Bokför vid faktura och betalning (Standard för AB)</span>
                            </SelectItem>
                            <SelectItem value="cash">
                                <span className="font-medium block">Kontantmetoden</span>
                                <span className="text-xs text-muted-foreground">Bokför endast vid betalning (Enklare)</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-2">
                    <Label>Momsredovisningsperiod</Label>
                    <Select
                        value={company?.vatFrequency || 'quarterly'}
                        onValueChange={(val: 'monthly' | 'quarterly' | 'annually') => updateCompany({ vatFrequency: val })}
                    >
                        <SelectTrigger className="w-full text-left justify-between px-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="monthly">
                                <span className="font-medium block">Månadsvis</span>
                                <span className="text-xs text-muted-foreground">Omsättning över 40M SEK</span>
                            </SelectItem>
                            <SelectItem value="quarterly">
                                <span className="font-medium block">Kvartalsvis</span>
                                <span className="text-xs text-muted-foreground">Standard för de flesta företag</span>
                            </SelectItem>
                            <SelectItem value="annually">
                                <span className="font-medium block">Helårsvis</span>
                                <span className="text-xs text-muted-foreground">Omsättning under 1M SEK</span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                        <Label>Fåmansföretag (3:12-regler)</Label>
                        <p className="text-xs text-muted-foreground">
                            Aktiverar K10-stöd för kvalificerade andelar
                        </p>
                    </div>
                    <input
                        type="checkbox"
                        checked={company?.isCloselyHeld ?? true}
                        onChange={(e) => updateCompany({ isCloselyHeld: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <SettingsFormField
                        id="org-nr"
                        label="Organisationsnummer"
                        placeholder="556123-4567"
                        value={formData.orgNumber}
                        onChange={(e) => setFormData({ ...formData, orgNumber: e.target.value })}
                    />
                    <SettingsFormField
                        id="vat-nr"
                        label="Momsreg.nr"
                        placeholder="SE556123456701"
                        value={formData.vatNumber}
                        onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                    />
                </div>
                <SettingsFormField
                    id="address"
                    label="Adress"
                    placeholder="Storgatan 1, 111 22 Stockholm"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
            </div>

            <Separator />

            <SettingsSection
                title={text.settings.dataExport}
                description={text.settings.dataExportDesc}
            >
                <SettingsActionCard
                    title="SIE-Export"
                    description="Exportera hela din bokföring till SIE4-format"
                    actionLabel={isExporting ? "Exporterar..." : text.settings.exportSIE}
                    onAction={handleSIEExport}
                    variant="info"
                    icon={Download}
                />
            </SettingsSection>

            <Separator />

            <SettingsSection
                title="Datahantering"
                description="Hantera din företagsdata och återställning"
            >
                <SettingsActionCard
                    title="Nollställ all data"
                    description="Permanent radering av all data"
                    actionLabel="Radera allt"
                    onAction={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    icon={Trash2}
                />
            </SettingsSection>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[425px] border-none">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            Nollställ all data
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Detta kommer permanent radera alla kvitton, transaktioner, leverantörsfakturor och chatthistorik.
                            <br /><br />
                            Detta går <strong>INTE</strong> att ångra. Du måste logga in igen efter radering.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="confirm-delete">Skriv <strong>radera</strong> för att bekräfta</Label>
                            <Input
                                id="confirm-delete"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="radera"
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Avbryt</Button>
                        <Button
                            variant="destructive"
                            disabled={confirmText.toLowerCase() !== 'radera' || isDeleting}
                            onClick={handleDelete}
                        >
                            {isDeleting ? "Raderar..." : "Jag förstår, radera allt"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SettingsSaveButton onClick={onSave} />
        </div>
    )
}
