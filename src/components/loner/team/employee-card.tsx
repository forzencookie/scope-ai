"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal, FileText, Wallet, Car } from "lucide-react"
import { cn } from "@/lib/utils"

interface Employee {
    id: string
    name: string
    role: string
}

interface EmployeeCardProps {
    employee: Employee
    balance: number
    mileage: number
    onReport: () => void
}

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(val)
}

export function EmployeeCard({ employee, balance, mileage, onReport }: EmployeeCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 bg-muted/20 pb-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={`/avatars/${employee.id}.png`} />
                    <AvatarFallback>
                        {employee.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                    <CardTitle className="text-base">{employee.name}</CardTitle>
                    <CardDescription>{employee.role}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 grid gap-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/40">
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Wallet className="h-3 w-3" /> Utläggskuld
                        </span>
                        <span className={cn("font-medium", balance > 0 ? "text-red-600" : "")}>
                            {formatCurrency(balance)}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 rounded-md bg-muted/40">
                        <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <Car className="h-3 w-3" /> Resor (kr)
                        </span>
                        <span className="font-medium">
                            {formatCurrency(mileage)}
                        </span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={onReport}
                >
                    <FileText className="h-4 w-4 mr-2" />
                    Rapportera
                </Button>
            </CardContent>
        </Card>
    )
}
