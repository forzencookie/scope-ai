"use client"

import { useState } from "react"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage, BreadcrumbLink,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Building2, 
    MapPin, 
    Phone, 
    Mail, 
    Globe, 
    FileText,
    CreditCard,
    Calendar,
    User,
    Pencil,
    Check,
    X,
} from "lucide-react"

// Company data
const initialCompanyData = {
    name: "Scope AI AB",
    orgNumber: "559123-4567",
    vatNumber: "SE559123456701",
    address: "Storgatan 15",
    postalCode: "111 23",
    city: "Stockholm",
    country: "Sverige",
    phone: "+46 8 123 45 67",
    email: "info@scopeai.se",
    website: "www.scopeai.se",
    bankgiro: "123-4567",
    plusgiro: "12 34 56-7",
    iban: "SE12 3456 7890 1234 5678 90",
    bic: "SWEDSESS",
    fiscalYearStart: "Januari",
    fiscalYearEnd: "December",
    registrationDate: "2020-03-15",
    ceo: "Anna Andersson",
    boardMembers: "Anna Andersson (Ordförande), Erik Eriksson, Maria Johansson",
    auditor: "Revisionsbyrån AB",
    sniCode: "62010 - Dataprogrammering",
}

interface InfoRowProps {
    icon: React.ReactNode
    label: string
    value: string
    fieldKey: string
    isEditing: boolean
    editValue: string
    onEdit: (key: string) => void
    onSave: (key: string, value: string) => void
    onCancel: () => void
    onChange: (value: string) => void
}

function InfoRow({ icon, label, value, fieldKey, isEditing, editValue, onEdit, onSave, onCancel, onChange }: InfoRowProps) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 group">
            <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{icon}</div>
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {isEditing ? (
                        <Input 
                            value={editValue}
                            onChange={(e) => onChange(e.target.value)}
                            className="mt-1 h-8"
                            autoFocus
                        />
                    ) : (
                        <p className="font-medium">{value}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1">
                {isEditing ? (
                    <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => onSave(fieldKey, editValue)}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={onCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                    </>
                ) : (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onEdit(fieldKey)}
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}

export default function CompanyInfoPage() {
    const [companyData, setCompanyData] = useState(initialCompanyData)
    const [editingField, setEditingField] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")

    const handleEdit = (key: string) => {
        setEditingField(key)
        setEditValue(companyData[key as keyof typeof companyData])
    }

    const handleSave = (key: string, value: string) => {
        setCompanyData(prev => ({ ...prev, [key]: value }))
        setEditingField(null)
    }

    const handleCancel = () => {
        setEditingField(null)
        setEditValue("")
    }

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                        orientation="vertical"
                        className="mr-2 data-[orientation=vertical]:h-4"
                    />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/settings">Inställningar</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Företags information</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>
            <div className="flex-1 flex flex-col bg-background">
                {/* Page Content */}
                <main className="flex-1 flex flex-col p-6 gap-6">
                    <div>
                        <h1 className="text-2xl font-semibold flex items-center gap-2">
                            <Building2 className="h-6 w-6" />
                            Företags information
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Hantera ditt företags grundläggande information
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="rounded-lg border border-border/50 p-5">
                            <h2 className="text-lg font-medium mb-4">Grundläggande uppgifter</h2>
                            <div className="space-y-1">
                                <InfoRow 
                                    icon={<Building2 className="h-4 w-4" />}
                                    label="Företagsnamn"
                                    value={companyData.name}
                                    fieldKey="name"
                                    isEditing={editingField === "name"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<FileText className="h-4 w-4" />}
                                    label="Organisationsnummer"
                                    value={companyData.orgNumber}
                                    fieldKey="orgNumber"
                                    isEditing={editingField === "orgNumber"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<FileText className="h-4 w-4" />}
                                    label="Momsregistreringsnummer"
                                    value={companyData.vatNumber}
                                    fieldKey="vatNumber"
                                    isEditing={editingField === "vatNumber"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<FileText className="h-4 w-4" />}
                                    label="SNI-kod"
                                    value={companyData.sniCode}
                                    fieldKey="sniCode"
                                    isEditing={editingField === "sniCode"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Registreringsdatum"
                                    value={companyData.registrationDate}
                                    fieldKey="registrationDate"
                                    isEditing={editingField === "registrationDate"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="rounded-lg border border-border/50 p-5">
                            <h2 className="text-lg font-medium mb-4">Kontaktuppgifter</h2>
                            <div className="space-y-1">
                                <InfoRow 
                                    icon={<MapPin className="h-4 w-4" />}
                                    label="Adress"
                                    value={companyData.address}
                                    fieldKey="address"
                                    isEditing={editingField === "address"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<MapPin className="h-4 w-4" />}
                                    label="Postnummer & Ort"
                                    value={`${companyData.postalCode} ${companyData.city}`}
                                    fieldKey="postalCode"
                                    isEditing={editingField === "postalCode"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<Phone className="h-4 w-4" />}
                                    label="Telefon"
                                    value={companyData.phone}
                                    fieldKey="phone"
                                    isEditing={editingField === "phone"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<Mail className="h-4 w-4" />}
                                    label="E-post"
                                    value={companyData.email}
                                    fieldKey="email"
                                    isEditing={editingField === "email"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<Globe className="h-4 w-4" />}
                                    label="Webbplats"
                                    value={companyData.website}
                                    fieldKey="website"
                                    isEditing={editingField === "website"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                            </div>
                        </div>

                        {/* Banking Info */}
                        <div className="rounded-lg border border-border/50 p-5">
                            <h2 className="text-lg font-medium mb-4">Bankuppgifter</h2>
                            <div className="space-y-1">
                                <InfoRow 
                                    icon={<CreditCard className="h-4 w-4" />}
                                    label="Bankgiro"
                                    value={companyData.bankgiro}
                                    fieldKey="bankgiro"
                                    isEditing={editingField === "bankgiro"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<CreditCard className="h-4 w-4" />}
                                    label="Plusgiro"
                                    value={companyData.plusgiro}
                                    fieldKey="plusgiro"
                                    isEditing={editingField === "plusgiro"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<CreditCard className="h-4 w-4" />}
                                    label="IBAN"
                                    value={companyData.iban}
                                    fieldKey="iban"
                                    isEditing={editingField === "iban"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<CreditCard className="h-4 w-4" />}
                                    label="BIC/SWIFT"
                                    value={companyData.bic}
                                    fieldKey="bic"
                                    isEditing={editingField === "bic"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                            </div>
                        </div>

                        {/* Fiscal Year & Management */}
                        <div className="rounded-lg border border-border/50 p-5">
                            <h2 className="text-lg font-medium mb-4">Räkenskapsår & Styrelse</h2>
                            <div className="space-y-1">
                                <InfoRow 
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Räkenskapsår"
                                    value={`${companyData.fiscalYearStart} - ${companyData.fiscalYearEnd}`}
                                    fieldKey="fiscalYearStart"
                                    isEditing={editingField === "fiscalYearStart"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<User className="h-4 w-4" />}
                                    label="VD"
                                    value={companyData.ceo}
                                    fieldKey="ceo"
                                    isEditing={editingField === "ceo"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<User className="h-4 w-4" />}
                                    label="Styrelseledamöter"
                                    value={companyData.boardMembers}
                                    fieldKey="boardMembers"
                                    isEditing={editingField === "boardMembers"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                                <InfoRow 
                                    icon={<FileText className="h-4 w-4" />}
                                    label="Revisor"
                                    value={companyData.auditor}
                                    fieldKey="auditor"
                                    isEditing={editingField === "auditor"}
                                    editValue={editValue}
                                    onEdit={handleEdit}
                                    onSave={handleSave}
                                    onCancel={handleCancel}
                                    onChange={setEditValue}
                                />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}
