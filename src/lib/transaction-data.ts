export type Transaction = {
    id: string
    name: string
    date: string
    amount: string
    status: "Att bokföra" | "Bokförd" | "Saknar underlag" | "Ignorerad"
    category: string
    iconName: string
    iconColor: string
    account: string
}

export const allTransactions: Transaction[] = [
    {
        id: "1",
        name: "Webflow Subscription",
        date: "May 2, 2024",
        amount: "-$49.00",
        status: "Att bokföra",
        category: "Software",
        iconName: "Smartphone",
        iconColor: "text-blue-500",
        account: "Business Amex"
    },
    {
        id: "2",
        name: "Office Supplies - Staples",
        date: "May 10, 2024",
        amount: "-$124.50",
        status: "Att bokföra",
        category: "Supplies",
        iconName: "Tag",
        iconColor: "text-orange-500",
        account: "Business Amex"
    },
    {
        id: "3",
        name: "Delta Airlines",
        date: "May 15, 2024",
        amount: "-$450.00",
        status: "Saknar underlag",
        category: "Travel",
        iconName: "Plane",
        iconColor: "text-purple-500",
        account: "Business Amex"
    },
    {
        id: "4",
        name: "Client Payment - Acme Corp",
        date: "May 7, 2024",
        amount: "+$4,500.00",
        status: "Bokförd",
        category: "Income",
        iconName: "Briefcase",
        iconColor: "text-green-500",
        account: "Main Checking"
    },
    {
        id: "5",
        name: "Starbucks Meeting",
        date: "May 12, 2024",
        amount: "-$14.20",
        status: "Bokförd",
        category: "Meals",
        iconName: "Coffee",
        iconColor: "text-amber-600",
        account: "Business Debit"
    },
    {
        id: "6",
        name: "WeWork Monthly",
        date: "May 24, 2024",
        amount: "-$550.00",
        status: "Bokförd",
        category: "Rent",
        iconName: "Building2",
        iconColor: "text-indigo-500",
        account: "Main Checking"
    },
    {
        id: "7",
        name: "Consulting Fee",
        date: "May 27, 2024",
        amount: "+$2,100.00",
        status: "Bokförd",
        category: "Income",
        iconName: "Briefcase",
        iconColor: "text-green-500",
        account: "Main Checking"
    },
]
