import {
    TrendingDown,
    Loader2,
    Users,
    Building2,
    Package,
    CreditCard,
    MoreHorizontal
} from "lucide-react"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell } from "recharts"
import {
    expensePieColors,
    expensePieConfig,
} from "./data"
import { useCompanyStatistics } from "@/hooks/use-company-statistics"

const PLACEHOLDER_CATEGORIES = [
    { category: "Personalkostnader", amount: 0, percentage: 0, icon: Users },
    { category: "Lokalkostnader", amount: 0, percentage: 0, icon: Building2 },
    { category: "Förbrukningsinventarier", amount: 0, percentage: 0, icon: Package },
    { category: "Externa tjänster", amount: 0, percentage: 0, icon: CreditCard },
    { category: "Övriga kostnader", amount: 0, percentage: 0, icon: MoreHorizontal },
]

export function Kostnadsanalys() {
    const { expenseCategories, isLoading } = useCompanyStatistics()
    const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.amount, 0)

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Laddar kostnadsanalys...
            </div>
        )
    }

    // Sort categories largest first for better visualization
    const sortedCategories = [...expenseCategories].sort((a, b) => b.amount - a.amount)

    // Use placeholders if no data
    const displayCategories = sortedCategories.length > 0 ? sortedCategories : PLACEHOLDER_CATEGORIES

    return (
        <div className="space-y-6">
            {/* Pie Chart and Categories */}
            <div className="grid grid-cols-3 gap-6">
                {/* Large Pie Chart */}
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>Kostnadsfördelning</CardTitle>
                        <CardDescription>Januari - December 2024</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer config={expensePieConfig} className="mx-auto aspect-square max-h-[250px]">
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={sortedCategories.length > 0 ? sortedCategories.map((cat) => ({
                                        name: cat.category,
                                        value: cat.amount,
                                    })) : [{ name: "Ingen data", value: 1 }]} // Show placeholder circle if empty
                                    dataKey="value"
                                    nameKey="name"
                                    stroke="0"
                                >
                                    {sortedCategories.length > 0 ? sortedCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={expensePieColors[index % expensePieColors.length]} />
                                    )) : (
                                        <Cell fill="var(--muted)" /> // Gray placeholder
                                    )}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            {totalExpenses.toLocaleString("sv-SE")} kr totalt <TrendingDown className="h-4 w-4" />
                        </div>
                        <div className="leading-none text-muted-foreground">
                            Visar totala kostnader för hela året
                        </div>
                    </CardFooter>
                </Card>

                {/* Category Details */}
                <div className="col-span-2 space-y-3">
                    <h2 className="text-sm font-medium text-muted-foreground mb-3">Kostnadsfördelning per kategori</h2>
                    {displayCategories.map((cat, index) => {
                        const Icon = cat.icon
                        const color = sortedCategories.length > 0
                            ? expensePieColors[index % expensePieColors.length]
                            : "var(--muted-foreground)" // Gray for placeholders

                        return (
                            <Card key={cat.category} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: sortedCategories.length > 0 ? `${expensePieColors[index % expensePieColors.length]}20` : "var(--muted)" }}
                                        >
                                            <Icon className="h-5 w-5" style={{ color: color }} />
                                        </div>
                                        <div>
                                            <span className="font-medium">{cat.category}</span>
                                            <p className="text-xs text-muted-foreground">{sortedCategories.length > 0 ? `${cat.percentage}% av totala kostnader` : "Ingen data"}</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-semibold">{cat.amount !== 0 ? `${cat.amount.toLocaleString("sv-SE")} kr` : "-"}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${cat.percentage}%`,
                                            backgroundColor: sortedCategories.length > 0 ? expensePieColors[index % expensePieColors.length] : "transparent"
                                        }}
                                    />
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
