import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, AlertCircle, DollarSign, Users } from "lucide-react"

interface AgiStatsProps {
    stats: {
        nextPeriod: string;
        deadline: string;
        tax: number;
        contributions: number;
        totalSalary: number;
        employees: number;
    }
}

export function AgiStats({ stats }: AgiStatsProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK" }).format(amount)
    }

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Kommande</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.nextPeriod}</div>
                    <div className="text-xs text-muted-foreground">
                        {stats.deadline}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Att betala</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.tax + stats.contributions)}</div>
                    <div className="text-xs text-muted-foreground">
                        {formatCurrency(stats.tax)} skatt, {formatCurrency(stats.contributions)} avg
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bruttolön</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.totalSalary)}</div>
                    <div className="text-xs text-muted-foreground">
                        för perioden
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Anställda</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.employees}</div>
                    <div className="text-xs text-muted-foreground">
                        Personer
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
