"use client"

import * as React from "react"
import { Trash2, Download } from "lucide-react"
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
                    actionLabel={text.settings.exportSIE}
                    onAction={() => {
                        alert("Export startad! Filen laddas ner strax.")
                    }}
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
