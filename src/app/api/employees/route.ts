import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";

export async function GET() {
    try {
        const employees = await db.getEmployees();
        return NextResponse.json({ employees });
    } catch (error) {
        console.error("Failed to fetch employees:", error);
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Basic validation
        if (!body.name || !body.role) {
            return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
        }

        const employee = await db.addEmployee({
            name: body.name,
            role: body.role,
            email: body.email,
            salary: Number(body.salary) || 0,
            status: body.status || 'active',
            employment_date: body.employment_date || new Date().toISOString().split('T')[0]
        });

        return NextResponse.json({ employee });
    } catch (error) {
        console.error("Failed to create employee:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
